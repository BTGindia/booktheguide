'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Compass, Mountain, X } from 'lucide-react';

/* ── Static suggestions (always available, even when DB is empty) ── */
const STATIC_SUGGESTIONS: Suggestion[] = [
  // States
  { label: 'Himachal Pradesh', type: 'state', href: '/explore/himachal-pradesh' },
  { label: 'Uttarakhand', type: 'state', href: '/explore/uttarakhand' },
  { label: 'Rajasthan', type: 'state', href: '/explore/rajasthan' },
  { label: 'Ladakh', type: 'state', href: '/explore/ladakh' },
  { label: 'Jammu & Kashmir', type: 'state', href: '/explore/kashmir' },
  { label: 'Goa', type: 'state', href: '/explore/goa' },
  { label: 'Kerala', type: 'state', href: '/explore/kerala' },
  { label: 'Karnataka', type: 'state', href: '/explore/karnataka' },
  { label: 'Delhi', type: 'state', href: '/explore/delhi' },
  { label: 'Maharashtra', type: 'state', href: '/explore/maharashtra' },
  // Experiences
  { label: 'Trekking', type: 'experience', href: '/experiences/trekking' },
  { label: 'Adventure Sports', type: 'experience', href: '/experiences/adventure-guides' },
  { label: 'Heritage Walks', type: 'experience', href: '/experiences/heritage-walks' },
  { label: 'Group Trips', type: 'experience', href: '/experiences/group-trips' },
  { label: 'Offbeat Travel', type: 'experience', href: '/experiences/offbeat-travel' },
  { label: 'Tourist Guides', type: 'experience', href: '/experiences/tourist-guides' },
  // Popular searches
  { label: 'Manali', type: 'destination', href: '/search?q=Manali' },
  { label: 'Spiti Valley', type: 'destination', href: '/search?q=Spiti+Valley' },
  { label: 'Rishikesh', type: 'destination', href: '/search?q=Rishikesh' },
  { label: 'Triund Trek', type: 'destination', href: '/search?q=Triund' },
  { label: 'Hampta Pass', type: 'destination', href: '/search?q=Hampta+Pass' },
  { label: 'Valley of Flowers', type: 'destination', href: '/search?q=Valley+of+Flowers' },
  { label: 'Kedarnath', type: 'destination', href: '/search?q=Kedarnath' },
  { label: 'Jaipur', type: 'destination', href: '/search?q=Jaipur' },
];

interface Suggestion {
  label: string;
  type: 'state' | 'city' | 'destination' | 'experience';
  href: string;
}

interface HeroSearchProps {
  variant?: 'full' | 'hero';
  categories?: { slug: string; label: string }[];
}

export function HeroSearch({ variant = 'full' }: HeroSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleSearch = () => {
    if (!query.trim()) return;
    setShowDropdown(false);
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  /* ── Filter static suggestions + fetch API suggestions ── */
  const updateSuggestions = useCallback((q: string) => {
    const trimmed = q.trim().toLowerCase();
    if (!trimmed) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    // Instant: filter static suggestions
    const staticMatches = STATIC_SUGGESTIONS.filter((s) =>
      s.label.toLowerCase().includes(trimmed)
    ).slice(0, 5);
    setSuggestions(staticMatches);
    setShowDropdown(true);
    setActiveIdx(-1);

    // Debounced: fetch from API for live DB results
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (trimmed.length >= 2) {
      debounceRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/destinations/suggest?q=${encodeURIComponent(trimmed)}`);
          if (!res.ok) return;
          const data = await res.json();
          const apiResults: Suggestion[] = (data.suggestions || []).map((s: any) => ({
            label: s.label,
            type: s.type as Suggestion['type'],
            href: s.type === 'state'
              ? `/explore/${s.name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, '')}`
              : `/search?q=${encodeURIComponent(s.name)}`,
          }));

          // Merge: API results first, then static (deduped)
          const seen = new Set(apiResults.map((r) => r.label.toLowerCase()));
          const merged = [
            ...apiResults,
            ...staticMatches.filter((s) => !seen.has(s.label.toLowerCase())),
          ].slice(0, 7);

          setSuggestions(merged);
          setShowDropdown(true);
        } catch {
          // Keep static suggestions on error
        }
      }, 250);
    }
  }, []);

  /* ── Close dropdown on outside click ── */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ── Keyboard navigation ── */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === 'Enter') handleSearch();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx >= 0 && activeIdx < suggestions.length) {
        const s = suggestions[activeIdx];
        setQuery(s.label);
        setShowDropdown(false);
        router.push(s.href);
      } else {
        handleSearch();
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const selectSuggestion = (s: Suggestion) => {
    setQuery(s.label);
    setShowDropdown(false);
    router.push(s.href);
  };

  const typeIcon = (type: Suggestion['type']) => {
    switch (type) {
      case 'state':
        return <MapPin className="w-3.5 h-3.5 text-[#58bdae] flex-shrink-0" />;
      case 'experience':
        return <Compass className="w-3.5 h-3.5 text-[#E8943A] flex-shrink-0" />;
      default:
        return <Mountain className="w-3.5 h-3.5 text-[#6B6560] flex-shrink-0" />;
    }
  };

  const typeLabel = (type: Suggestion['type']) => {
    switch (type) {
      case 'state': return 'State';
      case 'city': return 'City';
      case 'experience': return 'Experience';
      default: return 'Destination';
    }
  };

  return (
    <div ref={wrapperRef} className="max-w-xl mx-auto sm:mx-0 relative">
      {/* Search bar — transparent glass */}
      <div className="flex items-center bg-white/15 backdrop-blur-md rounded-full border border-white/25 shadow-[0_2px_20px_rgba(0,0,0,0.15)]">
        <Search className="ml-3.5 w-[18px] h-[18px] text-[#58bdae] flex-shrink-0 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            updateSuggestions(e.target.value);
          }}
          onFocus={() => { if (query.trim()) updateSuggestions(query); }}
          onKeyDown={handleKeyDown}
          placeholder="Search trips, treks, destinations..."
          className="flex-1 h-[40px] sm:h-[42px] pl-2.5 pr-1 bg-transparent border-0 text-[13px] sm:text-[14px] font-medium text-white placeholder:text-white/50 focus:outline-none focus:ring-0"
          autoComplete="off"
          role="combobox"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          aria-autocomplete="list"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setSuggestions([]); setShowDropdown(false); }}
            className="mr-1 p-1 text-white/50 hover:text-white transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={handleSearch}
          disabled={!query.trim()}
          className="h-[32px] sm:h-[34px] mr-1 px-4 sm:px-5 disabled:opacity-40 text-white text-[12px] sm:text-[13px] font-bold rounded-full bg-[#58bdae] hover:bg-[#4aa99b] active:scale-95 transition-all flex-shrink-0"
        >
          Search
        </button>
      </div>

      {/* Dropdown suggestions */}
      {showDropdown && suggestions.length > 0 && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+6px)] bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-200/60 shadow-[0_12px_48px_rgba(0,0,0,0.18)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
          role="listbox"
        >
          <div className="py-1.5">
            {suggestions.map((s, idx) => (
              <button
                key={`${s.type}-${s.label}`}
                onClick={() => selectSuggestion(s)}
                onMouseEnter={() => setActiveIdx(idx)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  idx === activeIdx ? 'bg-[#58bdae]/10' : 'hover:bg-gray-50'
                }`}
                role="option"
                aria-selected={idx === activeIdx}
              >
                {typeIcon(s.type)}
                <span className="flex-1 text-[13px] sm:text-[14px] font-medium text-[#1A1A18] truncate">
                  {s.label}
                </span>
                <span className="text-[10px] font-semibold tracking-wide uppercase text-[#6B6560]/60">
                  {typeLabel(s.type)}
                </span>
              </button>
            ))}
          </div>
          {query.trim() && (
            <div className="border-t border-gray-100">
              <button
                onClick={handleSearch}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
              >
                <Search className="w-3.5 h-3.5 text-[#58bdae] flex-shrink-0" />
                <span className="text-[13px] font-medium text-[#58bdae]">
                  Search all results for &ldquo;{query.trim()}&rdquo;
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
