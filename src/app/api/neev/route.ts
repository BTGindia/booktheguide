import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

// ────────────────────────────────────────────────────────────────
// NEEV — BookTheGuide's AI Travel Planner
// POST /api/neev   { sessionId, messages: [{role,content}] }
// ────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface NeevRequest {
  sessionId: string;
  messages: ChatMessage[];
}

/* ── Fetch available packages from DB for context ── */
async function getAvailablePackages() {
  const products = await prisma.product.findMany({
    where: { status: 'APPROVED', isActive: true },
    include: {
      destination: {
        include: { city: { include: { state: { select: { name: true } } } } },
      },
      guide: {
        include: { user: { select: { name: true } } },
      },
      fixedDepartures: {
        where: { isActive: true, approvalStatus: 'APPROVED', startDate: { gte: new Date() } },
        orderBy: { pricePerPerson: 'asc' },
        take: 1,
        select: {
          pricePerPerson: true,
          startDate: true,
          endDate: true,
          totalSeats: true,
          bookedSeats: true,
          meetingPoint: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return products.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    description: p.description?.slice(0, 200),
    destination: p.destination.name,
    city: p.destination.city.name,
    state: p.destination.city.state.name,
    activityType: p.activityType,
    category: p.packageCategory,
    difficultyLevel: p.difficultyLevel,
    durationDays: p.durationDays,
    durationNights: p.durationNights,
    isPetFriendly: p.isPetFriendly,
    highlights: p.highlights.slice(0, 3),
    guideName: p.guide.user.name,
    price: p.fixedDepartures[0]?.pricePerPerson ?? null,
    nextDeparture: p.fixedDepartures[0]?.startDate ?? null,
    seatsLeft: p.fixedDepartures[0]
      ? p.fixedDepartures[0].totalSeats - (p.fixedDepartures[0].bookedSeats || 0)
      : null,
    meetingPoint: p.fixedDepartures[0]?.meetingPoint ?? null,
  }));
}

/* ── Build the NEEV system prompt ── */
function buildSystemPrompt(packagesJson: string): string {
  return `You are NEEV, BookTheGuide's AI Travel Planner. You are warm, witty, and genuinely curious — like a well-travelled friend who happens to know every trail, every hidden cafe, every guide worth their salt in India.

## YOUR PERSONALITY
- You're casual but never sloppy. Friendly but never cringy.
- You use humour naturally — a light touch, not forced.
- You're perceptive — you read between the lines of what people say.
- You NEVER sound like a corporate chatbot. No "I'd be happy to assist you!" energy.
- You ask thoughtful questions that make people go "huh, good question."
- You adapt your tone to the user — playful if they're playful, gentle if they're stressed, energetic if they're excited.
- Keep responses concise — 2-4 sentences per turn usually. Never write essays unless presenting a trip plan.
- Use simple, conversational language. No jargon.

## YOUR GREETING (first message only — DON'T repeat this)
"Hey! I'm NEEV, your travel planner. Not a search engine, I promise — more like that friend who always knows the best spots. What's pulling you towards a journey right now?"

## HOW YOU THINK
You uncover what the traveller truly needs through natural conversation, NOT a questionnaire.

Layer 1 — Surface (practical): days, dates, budget, group size. Weave these in naturally, don't list them.
Layer 2 — Emotional (the why): Are they escaping burnout? Celebrating? Reconnecting? Listen for emotional cues.
Layer 3 — Style: Do they want structure or spontaneity? Crowds or solitude? Challenge or comfort?

IMPORTANT: Don't ask all questions at once. One question per turn. Let the conversation flow naturally. Pick up on what they've already told you. If someone says "I'm exhausted and need to disappear" — you already know their emotional state. Don't ask "how are you feeling?" again.

## WHEN SUGGESTING TRIPS
- ONLY suggest packages that exist in the catalog below. NEVER invent packages.
- When you have enough context (usually after 3-5 exchanges), present 1-3 matching packages.
- Present each package warmly — connect it to what they told you. Explain WHY this package fits their mood/needs.
- Use this exact format for each package card (the frontend will parse this):

:::package
id: [package_id]
title: [package_title]
destination: [destination], [state]
duration: [X days / Y nights]
price: [price or "On request"]
why: [1-2 sentences connecting this package to their emotional needs — make it personal]
:::

- After presenting packages, ask if any of these resonate or if they want something different.
- If nothing in the catalog matches, be honest: "I don't have something that exactly fits what you're describing right now, but here's what's close..." or suggest they explore custom trips with a guide.

## WHAT YOU NEVER DO
- Never invent or fabricate packages, guides, or destinations not in the catalog.
- Never be preachy, over-caring, or use phrases like "I totally understand your feelings."
- Never ask more than one question per message.
- Never dump a wall of text. Keep it punchy.
- Never use emojis excessively. One or two max per message, and only when natural.
- Never say "As an AI..." — you're NEEV, a travel planner.
- Never give medical, legal, or financial advice.

## AVAILABLE PACKAGES CATALOG
${packagesJson}

If the catalog is empty, let the user know you're freshly set up and packages are being added — ask them to check back soon or browse the website.

## CONVERSATION INTELLIGENCE
At the end of each response, add a hidden metadata line (the user won't see this, it's for our system):
<!--NEEV_META:{"emotion":"[detected emotion]","style":"[travel style]","intent":"[high/medium/low/browsing]","suggestedIds":[list of suggested product ids or empty]}-->`;
}

/* ── Call Gemini API ── */
async function callGemini(
  systemPrompt: string,
  messages: ChatMessage[],
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // Fallback to smart local response if no API key
    return generateFallbackResponse(messages);
  }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Build conversation history for Gemini
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({
      history,
      systemInstruction: { role: 'user', parts: [{ text: systemPrompt }] },
      generationConfig: {
        temperature: 0.85,
        topP: 0.92,
        topK: 40,
        maxOutputTokens: 800,
      },
    });

    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    return generateFallbackResponse(messages);
  }
}

/* ── Smart fallback when no API key is configured ── */
function generateFallbackResponse(messages: ChatMessage[]): string {
  const lastMsg = messages[messages.length - 1]?.content.toLowerCase() || '';
  const msgCount = messages.filter((m) => m.role === 'user').length;

  // First message — greeting
  if (msgCount <= 1) {
    return `Hey! I'm NEEV, your travel planner. Not a search engine, I promise — more like that friend who always knows the best spots.\n\nWhat's pulling you towards a journey right now?\n\n<!--NEEV_META:{"emotion":"neutral","style":"unknown","intent":"browsing","suggestedIds":[]}-->`;
  }

  // Detect emotional cues
  const exhaustedWords = ['tired', 'exhausted', 'burnout', 'stressed', 'overwhelmed', 'escape', 'disappear', 'break', 'peace', 'quiet'];
  const adventureWords = ['adventure', 'thrill', 'trek', 'hiking', 'adrenaline', 'challenge', 'climb', 'raft', 'extreme'];
  const cultureWords = ['heritage', 'culture', 'history', 'temple', 'food', 'local', 'authentic', 'traditional'];
  const budgetWords = ['budget', 'cheap', 'affordable', 'low cost', 'economical'];
  const groupWords = ['friends', 'group', 'solo', 'couple', 'family', 'alone'];

  if (exhaustedWords.some((w) => lastMsg.includes(w))) {
    return `I hear you. Sometimes the best trips aren't about doing everything — they're about doing almost nothing, just somewhere beautiful.\n\nWhen you imagine your perfect escape, what do you see? Mountains with mist? A quiet lake? Or maybe a little village where nobody knows your name?\n\n<!--NEEV_META:{"emotion":"exhausted","style":"solo","intent":"medium","suggestedIds":[]}-->`;
  }

  if (adventureWords.some((w) => lastMsg.includes(w))) {
    return `Now we're talking! There's nothing like that moment when your heart's racing and you're completely present.\n\nAre you looking for something that pushes your limits, or more of a "beautiful scenery with a dash of adrenaline" situation?\n\n<!--NEEV_META:{"emotion":"excited","style":"adventure","intent":"medium","suggestedIds":[]}-->`;
  }

  if (cultureWords.some((w) => lastMsg.includes(w))) {
    return `Ah, a fellow depth-seeker! India's got layers on layers when it comes to history and culture — the kind of stories that don't make it to Wikipedia.\n\nAny particular era or region calling to you? Or should I surprise you?\n\n<!--NEEV_META:{"emotion":"curious","style":"cultural","intent":"medium","suggestedIds":[]}-->`;
  }

  if (budgetWords.some((w) => lastMsg.includes(w))) {
    return `Smart move — some of the most incredible experiences in India don't need a fat wallet. I've seen people have life-changing trips for under 10K.\n\nWhat's your ballpark budget per person? And how many days are you thinking?\n\n<!--NEEV_META:{"emotion":"practical","style":"budget","intent":"medium","suggestedIds":[]}-->`;
  }

  if (groupWords.some((w) => lastMsg.includes(w))) {
    return `Got it! That changes things in the best way. Different crews need different vibes.\n\nWhat kind of trip does your crew gravitate towards — chill and scenic, or packed with activities?\n\n<!--NEEV_META:{"emotion":"social","style":"group","intent":"medium","suggestedIds":[]}-->`;
  }

  // Location-based
  const locations = ['himachal', 'uttarakhand', 'kashmir', 'ladakh', 'goa', 'rajasthan', 'kerala', 'meghalaya', 'manali', 'rishikesh', 'mcleodganj', 'sikkim'];
  const mentioned = locations.find((loc) => lastMsg.includes(loc));
  if (mentioned) {
    return `${mentioned.charAt(0).toUpperCase() + mentioned.slice(1)} — great taste! There's so much more to it than what shows up on Instagram.\n\nAre you flexible on dates, or do you have a specific window in mind? That'll help me find what's actually available.\n\n<!--NEEV_META:{"emotion":"interested","style":"exploring","intent":"high","suggestedIds":[]}-->`;
  }

  // Generic follow-ups based on conversation depth
  if (msgCount === 2) {
    return `That's helpful! Tell me a bit more — how many days can you carve out? And is this a solo mission or are you dragging friends along?\n\n<!--NEEV_META:{"emotion":"neutral","style":"unknown","intent":"medium","suggestedIds":[]}-->`;
  }

  if (msgCount === 3) {
    return `I'm getting a picture here. One more thing — what matters more to you: a packed itinerary where you see everything, or a relaxed pace where you actually soak it in?\n\n<!--NEEV_META:{"emotion":"neutral","style":"unknown","intent":"medium","suggestedIds":[]}-->`;
  }

  return `I love that energy. Let me think about what would be perfect for you.\n\nWhile I'm putting something together — browse our packages at booktheguide.com to see what catches your eye. Sometimes the right trip just jumps out at you!\n\n<!--NEEV_META:{"emotion":"neutral","style":"unknown","intent":"medium","suggestedIds":[]}-->`;
}

/* ── Parse metadata from NEEV's response ── */
function parseNeevMeta(response: string) {
  const metaMatch = response.match(/<!--NEEV_META:(.*?)-->/);
  let meta = { emotion: 'neutral', style: 'unknown', intent: 'browsing', suggestedIds: [] as string[] };

  if (metaMatch) {
    try {
      meta = JSON.parse(metaMatch[1]);
    } catch {
      // keep defaults
    }
  }

  // Also extract package IDs from :::package blocks
  const ids: string[] = [];
  let packageMatch;
  const packageRegex = /:::package\s*\n\s*id:\s*(.+)/g;
  while ((packageMatch = packageRegex.exec(response)) !== null) {
    ids.push(packageMatch[1].trim());
  }
  if (ids.length > 0) meta.suggestedIds = ids;

  // Clean the meta tag from the visible response
  const cleanResponse = response.replace(/<!--NEEV_META:.*?-->/g, '').trim();

  return { cleanResponse, meta };
}

/* ── Main POST handler ── */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Rate limit: 15 messages per minute per IP
    const ip = getClientIp(request);
    if (!rateLimit(ip, 15, 60_000)) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        { status: 429 }
      );
    }

    const body: NeevRequest = await request.json();
    const { sessionId, messages } = body;

    if (!sessionId || !messages?.length) {
      return NextResponse.json({ error: 'sessionId and messages are required' }, { status: 400 });
    }

    // Get user session if logged in
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id || null;

    // Fetch available packages for context
    const packages = await getAvailablePackages();
    const packagesJson = JSON.stringify(packages, null, 2);

    // Build system prompt with live catalog
    const systemPrompt = buildSystemPrompt(packagesJson);

    // Call AI
    const rawResponse = await callGemini(systemPrompt, messages);

    // Parse metadata and clean response
    const { cleanResponse, meta } = parseNeevMeta(rawResponse);

    const responseTimeMs = Date.now() - startTime;

    // Log to database (non-blocking)
    const lastUserMessage = messages.filter((m) => m.role === 'user').pop()?.content || '';
    prisma.aiQueryLog
      .create({
        data: {
          userId,
          sessionId,
          query: lastUserMessage,
          response: cleanResponse,
          responseTimeMs,
          emotionalTone: meta.emotion,
          travelStyle: meta.style,
          intentSignal: meta.intent,
          suggestedIds: meta.suggestedIds,
        },
      })
      .catch((err: any) => console.error('Failed to log AI query:', err));

    return NextResponse.json({
      response: cleanResponse,
      meta: {
        emotion: meta.emotion,
        suggestedPackageIds: meta.suggestedIds,
      },
    });
  } catch (error: any) {
    console.error('NEEV API error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    );
  }
}
