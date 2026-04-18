'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  X,
  Send,
  Mountain,
  Compass,
  Palmtree,
  User,
  RefreshCw,
  MapPin,
  Calendar,
  IndianRupee,
} from 'lucide-react';

/* ── Types ── */
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  packages?: PackageCard[];
}

interface PackageCard {
  id: string;
  title: string;
  destination: string;
  duration: string;
  price: string;
  why: string;
}

/* ── Suggested conversation starters ── */
const SUGGESTED_PROMPTS = [
  { icon: <Mountain className="w-4 h-4" />, text: "I need to get away from everything" },
  { icon: <Palmtree className="w-4 h-4" />, text: "Planning a trip with friends" },
  { icon: <Compass className="w-4 h-4" />, text: "Something adventurous under 10K" },
  { icon: <MapPin className="w-4 h-4" />, text: "Never been to the mountains" },
];

/* ── Pablo Avatar using the mascot image ── */
function PabloAvatar({ size = 40 }: { size?: number }) {
  return (
    <div className="rounded-full overflow-hidden flex-shrink-0 bg-[#FFF8F0]" style={{ width: size, height: size }}>
      <Image
        src="/images/btg/pablo-mascot.png"
        alt="Pablo — your travel buddy"
        width={size}
        height={size}
        className="object-cover w-full h-full"
      />
    </div>
  );
}

function PabloAvatarSmall() {
  return (
    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-[#FF7F50]/20 shadow-sm">
      <PabloAvatar size={32} />
    </div>
  );
}

/* ── Parse :::package blocks from response ── */
function parsePackageCards(text: string): { cleanText: string; packages: PackageCard[] } {
  const packages: PackageCard[] = [];
  const cleanText = text.replace(/:::package\s*\n([\s\S]*?):::/g, (_match, block: string) => {
    const card: Partial<PackageCard> = {};
    for (const line of block.split('\n')) {
      const [key, ...rest] = line.split(':');
      const value = rest.join(':').trim();
      if (key && value) {
        const k = key.trim().toLowerCase();
        if (k === 'id') card.id = value;
        else if (k === 'title') card.title = value;
        else if (k === 'destination') card.destination = value;
        else if (k === 'duration') card.duration = value;
        else if (k === 'price') card.price = value;
        else if (k === 'why') card.why = value;
      }
    }
    if (card.id && card.title) {
      packages.push(card as PackageCard);
    }
    return ''; // remove the block from visible text
  });

  return { cleanText: cleanText.trim(), packages };
}

/* ── Generate a session ID ── */
function generateSessionId() {
  return `pablo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/* ══════════════════════════════════════════════════════════════
   Pablo — AI Travel Buddy Component
   ══════════════════════════════════════════════════════════════ */
export function AiTravelAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);
  const [teaserDismissed, setTeaserDismissed] = useState(false);
  const [sessionId] = useState(generateSessionId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── Auto-show teaser bubble after 3s ── */
  useEffect(() => {
    const dismissed = sessionStorage.getItem('pablo_teaser_dismissed');
    if (dismissed) {
      setTeaserDismissed(true);
      return;
    }
    const timer = setTimeout(() => setShowTeaser(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  /* ── Hide teaser when chat opens ── */
  useEffect(() => {
    if (isOpen) setShowTeaser(false);
  }, [isOpen]);

  /* ── Listen for global "open Pablo" event ── */
  useEffect(() => {
    const handler = () => {
      setIsOpen(true);
      setShowTeaser(false);
      setTeaserDismissed(true);
      sessionStorage.setItem('pablo_teaser_dismissed', '1');
    };
    window.addEventListener('open-pablo-chat', handler);
    return () => window.removeEventListener('open-pablo-chat', handler);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  /* ── Send message to Pablo API ── */
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isTyping) return;

      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsTyping(true);

      try {
        // Build conversation history for API
        const allMessages = [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch('/api/neev', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, messages: allMessages }),
        });

        if (!res.ok) throw new Error('API error');

        const data = await res.json();
        const rawContent: string = data.response || "Hmm, my brain just glitched. Try that again?";

        // Parse package cards from the response
        const { cleanText, packages } = parsePackageCards(rawContent);

        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: cleanText,
          timestamp: new Date(),
          packages: packages.length > 0 ? packages : undefined,
        };

        setMessages((prev) => [...prev, aiMsg]);
      } catch {
        const errorMsg: Message = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: "Oops, something went sideways. Mind trying that again?",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsTyping(false);
      }
    },
    [isTyping, messages, sessionId],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  /* ── Format markdown-ish text to HTML ── */
  function formatContent(text: string): string {
    // Escape HTML entities first to prevent XSS
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    return escaped
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  }

  return (
    <>
      {/* ====== FLOATING BUTTON — Pablo ====== */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed z-[60] flex items-center shadow-2xl transition-all duration-300 hover:scale-105 ${
          isOpen
            ? 'bottom-8 right-8 w-12 h-12 rounded-full bg-gray-900 justify-center'
            : 'bottom-6 right-6 sm:bottom-8 sm:right-8 pl-1 pr-4 py-1 rounded-full bg-white border border-[#FF7F50]/20 hover:border-[#FF7F50]/50'
        }`}
        style={!isOpen ? { boxShadow: '0 4px 24px rgba(255,127,80,0.25), 0 0 50px rgba(255,127,80,0.08)' } : undefined}
        aria-label={isOpen ? 'Close Pablo' : 'Talk to Pablo'}
      >
        {isOpen ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <>
            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-[#FF7F50]/30 shadow-md">
              <PabloAvatar size={40} />
            </div>
            <div className="hidden sm:flex flex-col items-start ml-2.5">
              <span className="text-[#FF7F50] text-[11px] font-bold tracking-[0.08em] leading-none mb-0.5">Pablo</span>
              <span className="text-[#1A1A18] text-[12px] font-medium leading-none">Your travel buddy</span>
            </div>
          </>
        )}
      </button>

      {/* ====== TEASER POPUP BUBBLE ====== */}
      {showTeaser && !isOpen && !teaserDismissed && (
        <div className="fixed bottom-[5.5rem] right-6 sm:bottom-[6rem] sm:right-8 z-[58] transition-all duration-300 opacity-100 translate-y-0">
          <div
            className="relative bg-white rounded-2xl shadow-xl border border-[#FF7F50]/15 px-4 py-3 max-w-[240px] cursor-pointer group"
            style={{ boxShadow: '0 4px 20px rgba(255,127,80,0.15)' }}
            onClick={() => {
              setShowTeaser(false);
              setTeaserDismissed(true);
              sessionStorage.setItem('pablo_teaser_dismissed', '1');
              setIsOpen(true);
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTeaser(false);
                setTeaserDismissed(true);
                sessionStorage.setItem('pablo_teaser_dismissed', '1');
              }}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-500 text-[10px] leading-none transition-colors"
              aria-label="Dismiss"
            >
              ✕
            </button>
            <p className="text-[13px] text-[#1A1A18] font-body leading-snug">
              Hey! Need help planning a trip? <span className="text-[#FF7F50] font-semibold">I&apos;m Pablo</span> — tap to chat 👋
            </p>
            {/* Speech bubble tail */}
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white border-r border-b border-[#FF7F50]/15 rotate-45" />
          </div>
        </div>
      )}

      {/* ====== CHAT PANEL ====== */}
      <div
        className={`fixed bottom-24 right-4 sm:right-8 z-[59] w-[400px] max-w-[calc(100vw-1rem)] bg-white rounded-2xl shadow-2xl border border-gray-200/80 overflow-hidden transition-all duration-300 origin-bottom-right ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-90 translate-y-4 pointer-events-none'
        }`}
        style={{ maxHeight: 'calc(100vh - 160px)' }}
      >
        {/* Header — warm, inviting */}
        <div className="bg-gradient-to-r from-[#FFF5EE] via-[#FFF0E6] to-[#FFE8D6] px-5 py-4 relative overflow-hidden border-b border-[#FF7F50]/10">
          <div className="relative flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-[#FF7F50]/25 shadow-md">
              <PabloAvatar size={48} />
            </div>
            <div className="flex-1">
              <h3 className="text-[#1A1A18] font-bold text-[17px] font-heading tracking-wide">
                Pablo
              </h3>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[#6B6560] text-xs">
                  Your travel buddy
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setMessages([]);
              }}
              className="p-1.5 rounded-lg hover:bg-[#FF7F50]/10 transition-colors"
              aria-label="New conversation"
              title="Start fresh"
            >
              <RefreshCw className="w-4 h-4 text-[#FF7F50]/50 hover:text-[#FF7F50]" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="h-[380px] overflow-y-auto p-4 space-y-4 bg-[#FDFCFA]">
          {messages.length === 0 ? (
            <div className="space-y-4">
              {/* Pablo greeting */}
              <div className="flex gap-3">
                <PabloAvatarSmall />
                <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-gray-100/80 max-w-[85%]">
                  <p className="text-sm text-gray-800 font-body leading-relaxed">
                    Hey there! I&apos;m <strong className="text-[#FF7F50]">Pablo</strong> — think of me as that friend who&apos;s been everywhere and remembers all the good stuff.
                  </p>
                  <p className="text-sm text-gray-800 font-body leading-relaxed mt-2">
                    So, what&apos;s on your mind — mountains, chaos, peace, or just &quot;get me out of here&quot;?
                  </p>
                </div>
              </div>

              {/* Conversation starters */}
              <div className="pl-11">
                <p className="text-[10px] text-gray-400 font-body mb-2 uppercase tracking-wider">
                  Try saying
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt.text}
                      onClick={() => sendMessage(prompt.text)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#FF7F50]/15 rounded-xl text-xs font-medium text-gray-600 hover:border-[#FF7F50]/40 hover:text-[#FF7F50] hover:bg-[#FF7F50]/5 transition-all font-body shadow-sm"
                    >
                      {prompt.icon}
                      {prompt.text}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div key={msg.id}>
                  <div
                    className={`flex gap-3 ${
                      msg.role === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-[#1A1A18]">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <PabloAvatarSmall />
                    )}

                    <div
                      className={`max-w-[80%] px-4 py-3 shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-[#1A1A18] text-white rounded-2xl rounded-tr-md'
                          : 'bg-white text-gray-800 rounded-2xl rounded-tl-md border border-gray-100/80'
                      }`}
                    >
                      <div
                        className="text-sm font-body leading-relaxed whitespace-pre-line"
                        dangerouslySetInnerHTML={{
                          __html: formatContent(msg.content),
                        }}
                      />
                      <p
                        className={`text-[10px] mt-1 ${
                          msg.role === 'user' ? 'text-white/40' : 'text-gray-400'
                        }`}
                      >
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Package cards — rendered below the message */}
                  {msg.packages && msg.packages.length > 0 && (
                    <div className="pl-11 mt-3 space-y-2.5">
                      {msg.packages.map((pkg) => (
                        <Link
                          key={pkg.id}
                          href={`/trips/${pkg.id}`}
                          className="block bg-white rounded-xl border border-[#FF7F50]/15 p-3.5 shadow-sm hover:shadow-md hover:border-[#FF7F50]/30 transition-all group"
                        >
                          <h4 className="text-[13px] font-bold text-[#1A1A18] group-hover:text-[#FF7F50] transition-colors leading-tight">
                            {pkg.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-gray-500">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {pkg.destination}
                            </span>
                            {pkg.duration && (
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {pkg.duration}
                              </span>
                            )}
                            {pkg.price && pkg.price !== 'On request' && (
                              <span className="inline-flex items-center gap-1">
                                <IndianRupee className="w-3 h-3" />
                                {pkg.price}
                              </span>
                            )}
                          </div>
                          {pkg.why && (
                            <p className="text-[11px] text-[#FF7F50] mt-1.5 leading-snug italic">
                              &ldquo;{pkg.why}&rdquo;
                            </p>
                          )}
                          <span className="inline-block mt-2 text-[10px] font-semibold text-[#FF7F50] uppercase tracking-wider group-hover:underline">
                            View Trip →
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-3">
                  <PabloAvatarSmall />
                  <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-gray-100/80">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-[#FF7F50] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-[#FF7F50] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-[#FF7F50] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-[11px] text-gray-400">Pablo&apos;s thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form
          onSubmit={handleSubmit}
          className="border-t border-gray-200 p-3 bg-white flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell me what you're craving..."
            className="flex-1 h-10 px-4 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7F50]/30 focus:border-transparent font-body placeholder:text-gray-400"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="w-10 h-10 rounded-xl bg-[#FF7F50] flex items-center justify-center text-white disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-[#e5673e] transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Footer */}
        <div className="px-4 py-2 bg-gray-50/80 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 text-center">
            Pablo by BookTheGuide &middot; Suggestions only, not a booking confirmation
          </p>
        </div>
      </div>
    </>
  );
}
