'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  X,
  Send,
  Sparkles,
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

/* ── NEEV Logo / Avatar ── */
function NeevAvatar({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer glow ring */}
      <circle cx="60" cy="60" r="58" stroke="url(#neevGlow)" strokeWidth="2" opacity="0.5">
        <animateTransform attributeName="transform" type="rotate" dur="12s" from="0 60 60" to="360 60 60" repeatCount="indefinite" />
      </circle>
      {/* Background */}
      <circle cx="60" cy="60" r="54" fill="url(#neevBg)" />
      {/* Abstract travel compass / wave motif */}
      <path d="M60 25 L65 55 L60 60 L55 55 Z" fill="#58bdae" opacity="0.7" />
      <path d="M60 95 L55 65 L60 60 L65 65 Z" fill="#FFD96A" opacity="0.6" />
      <path d="M25 60 L55 55 L60 60 L55 65 Z" fill="#FF7F50" opacity="0.5" />
      <path d="M95 60 L65 65 L60 60 L65 55 Z" fill="#58bdae" opacity="0.5" />
      {/* Center dot */}
      <circle cx="60" cy="60" r="6" fill="white" opacity="0.9" />
      <circle cx="60" cy="60" r="3" fill="#58bdae">
        <animate attributeName="r" dur="3s" values="3;4;3" repeatCount="indefinite" />
      </circle>
      {/* NEEV text */}
      <text x="60" y="102" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="system-ui, sans-serif" opacity="0.9">NEEV</text>
      <defs>
        <linearGradient id="neevGlow" x1="0" y1="0" x2="120" y2="120">
          <stop offset="0%" stopColor="#58bdae" />
          <stop offset="50%" stopColor="#FFD96A" />
          <stop offset="100%" stopColor="#58bdae" />
        </linearGradient>
        <linearGradient id="neevBg" x1="0" y1="0" x2="120" y2="120">
          <stop offset="0%" stopColor="#0f2027" />
          <stop offset="100%" stopColor="#203a43" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function NeevAvatarSmall() {
  return (
    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-[#58bdae]/30">
      <NeevAvatar size={32} />
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
  return `neev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/* ══════════════════════════════════════════════════════════════
   NEEV — AI Travel Planner Component
   ══════════════════════════════════════════════════════════════ */
export function AiTravelAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(generateSessionId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  /* ── Send message to NEEV API ── */
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
        const rawContent: string = data.response || "Hmm, I'm having a moment. Try again?";

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
      {/* ====== FLOATING BUTTON — NEEV ====== */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-8 right-8 z-[60] flex items-center gap-2.5 shadow-2xl transition-all duration-300 hover:scale-105 ${
          isOpen
            ? 'w-12 h-12 rounded-full bg-gray-900 justify-center'
            : 'pl-1.5 pr-5 py-1.5 rounded-full bg-gradient-to-r from-[#0f2027] to-[#203a43] border border-[#58bdae]/30 hover:border-[#58bdae]/60'
        }`}
        style={!isOpen ? { boxShadow: '0 4px 30px rgba(88,189,174,0.35), 0 0 60px rgba(88,189,174,0.1)' } : undefined}
        aria-label={isOpen ? 'Close NEEV' : 'Talk to NEEV'}
      >
        {isOpen ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <>
            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-[#58bdae]/40 shadow-[0_0_12px_rgba(88,189,174,0.4)]">
              <NeevAvatar size={40} />
            </div>
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-[#FFD96A] text-[10px] font-bold tracking-[0.15em] uppercase leading-none mb-0.5">NEEV</span>
              <span className="text-white text-sm font-bold tracking-wide leading-none">Travel Planner</span>
            </div>
          </>
        )}
      </button>

      {/* ====== CHAT PANEL ====== */}
      <div
        className={`fixed bottom-24 right-8 z-[59] w-[400px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 origin-bottom-right ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-90 translate-y-4 pointer-events-none'
        }`}
        style={{ maxHeight: 'calc(100vh - 160px)' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0f2027] via-[#203a43] to-[#2c5364] px-5 py-4 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #58bdae 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-[#58bdae]/40 shadow-[0_0_16px_rgba(88,189,174,0.3)]">
              <NeevAvatar size={44} />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-base font-heading tracking-wide">
                NEEV
              </h3>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[#58bdae] rounded-full animate-pulse" />
                <span className="text-white/50 text-xs">
                  Your travel planner
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setMessages([]);
              }}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="New conversation"
              title="Start fresh"
            >
              <RefreshCw className="w-4 h-4 text-white/40 hover:text-white/70" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="h-[380px] overflow-y-auto p-4 space-y-4 bg-gray-50/50">
          {messages.length === 0 ? (
            <div className="space-y-4">
              {/* NEEV greeting */}
              <div className="flex gap-3">
                <NeevAvatarSmall />
                <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-gray-100 max-w-[85%]">
                  <p className="text-sm text-gray-800 font-body leading-relaxed">
                    Hey! I&apos;m <strong className="text-[#1A4D4A]">NEEV</strong>, your travel planner. Not a search engine, I promise — more like that friend who always knows the best spots.
                  </p>
                  <p className="text-sm text-gray-800 font-body leading-relaxed mt-2">
                    What&apos;s pulling you towards a journey right now?
                  </p>
                </div>
              </div>

              {/* Conversation starters */}
              <div className="pl-11">
                <p className="text-[10px] text-gray-400 font-mono mb-2 uppercase tracking-wider">
                  Try asking
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt.text}
                      onClick={() => sendMessage(prompt.text)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:border-[#58bdae] hover:text-[#1A4D4A] hover:bg-[#58bdae]/5 transition-all font-body shadow-sm"
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
                      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-[#7A9E7E]">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <NeevAvatarSmall />
                    )}

                    <div
                      className={`max-w-[80%] px-4 py-3 shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-[#1A4D4A] text-white rounded-2xl rounded-tr-md'
                          : 'bg-white text-gray-800 rounded-2xl rounded-tl-md border border-gray-100'
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
                          msg.role === 'user' ? 'text-white/50' : 'text-gray-400'
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
                          className="block bg-white rounded-xl border border-gray-200 p-3.5 shadow-sm hover:shadow-md hover:border-[#58bdae]/40 transition-all group"
                        >
                          <h4 className="text-[13px] font-bold text-[#1A1A18] group-hover:text-[#1A4D4A] transition-colors leading-tight">
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
                            <p className="text-[11px] text-[#58bdae] mt-1.5 leading-snug italic">
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
                  <NeevAvatarSmall />
                  <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-[#58bdae] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-[#58bdae] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-[#58bdae] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-[11px] text-gray-400">NEEV is thinking...</span>
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
            placeholder="Tell me about your dream trip..."
            className="flex-1 h-10 px-4 rounded-xl bg-gray-100 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#58bdae]/40 focus:border-transparent font-body placeholder:text-gray-400"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="w-10 h-10 rounded-xl bg-[#58bdae] flex items-center justify-center text-white disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-[#4aa99b] transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Footer */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 text-center">
            NEEV by BookTheGuide &middot; Suggestions only, not a booking confirmation
          </p>
        </div>
      </div>
    </>
  );
}
