'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Calendar, Users, ChevronDown, Compass } from 'lucide-react';

interface Suggestion {
  id: string;
  name: string;
  city: string;
  state: string;
  label: string;
  type: 'state' | 'city' | 'destination';
}

const EXPERIENCE_OPTIONS = [
  'Tourist Guides',
  'Group Trips',
  'Adventure Guides',
  'Heritage Walks',
  'Travel with Influencers',
  'Custom Trip',
];

interface HeroSearchProps {
  /** Render compact pill-style for hero sections */
  variant?: 'full' | 'hero';
}

export function HeroSearch({ variant = 'full' }: HeroSearchProps) {
  const router = useRouter();
  const [destination, setDestination] = useState('');
  const [experience, setExperience] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [groupType, setGroupType] = useState('');
  const [groupSize, setGroupSize] = useState(4);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch destination suggestions
  useEffect(() => {
    if (destination.length < 2) {
      setSuggestions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/destinations/suggest?q=${encodeURIComponent(destination)}`);
        const data = await res.json();
        setSuggestions(data.suggestions || []);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [destination]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = () => {
    if (!destination.trim()) return;

    const params = new URLSearchParams();
    params.set('destination', destination);
    if (experience) params.set('experience', experience);
    if (selectedDate) params.set('date', selectedDate);
    if (groupType) {
      params.set('group', groupType);
      if (groupType === 'group') params.set('groupSize', String(groupSize));
    }
    router.push(`/search?${params.toString()}`);
  };

  const selectSuggestion = (s: Suggestion) => {
    setDestination(s.label);
    setShowSuggestions(false);
  };

  return (
    <div className={`search-container rounded-[20px] p-2.5 sm:p-3 ${variant === 'hero' ? 'max-w-5xl' : 'max-w-5xl'} mx-auto`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {/* Destination with autocomplete */}
        <div className="relative search-field rounded-2xl" ref={suggestRef}>
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#58bdae] z-10" />
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Where to? (e.g., Manali)"
            className="w-full h-[52px] pl-11 pr-4 rounded-2xl bg-white/70 border-0 text-[14px] font-medium text-[#1A1A18] placeholder:text-[#6B6560]/60 focus:outline-none focus:ring-0"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[200] max-h-72 overflow-y-auto">
              {suggestions.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => selectSuggestion(s)}
                  className={`w-full px-4 py-3 text-left hover:bg-[#58bdae]/5 flex items-start gap-3 transition-colors first:rounded-t-2xl last:rounded-b-2xl ${
                    i > 0 ? 'border-t border-gray-50' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    s.type === 'state' ? 'bg-[#58bdae]/10' : s.type === 'city' ? 'bg-[#E8943A]/10' : 'bg-gray-100'
                  }`}>
                    <MapPin className={`w-4 h-4 ${
                      s.type === 'state' ? 'text-[#58bdae]' : s.type === 'city' ? 'text-[#E8943A]' : 'text-[#6B6560]'
                    }`} />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-[#1A1A18]">{s.name}</p>
                    <p className="text-[12px] text-[#6B6560]">
                      {s.type === 'state' ? 'State' : s.type === 'city' ? `City in ${s.state}` : `${s.city}, ${s.state}`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Experience Type */}
        <div className="relative search-field rounded-2xl">
          <Compass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#58bdae]" />
          <select
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            className="w-full h-[52px] pl-11 pr-8 rounded-2xl bg-white/70 border-0 text-[14px] font-medium text-[#1A1A18] focus:outline-none focus:ring-0 appearance-none cursor-pointer"
          >
            <option value="">Experience Type</option>
            {EXPERIENCE_OPTIONS.map((exp) => (
              <option key={exp} value={exp}>{exp}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#58bdae]/50 pointer-events-none" />
        </div>

        {/* Select Date (Calendar) */}
        <div className="relative search-field rounded-2xl">
          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#58bdae] z-10" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            placeholder="Select Date"
            className="w-full h-[52px] pl-11 pr-4 rounded-2xl bg-white/70 border-0 text-[14px] font-medium text-[#1A1A18] focus:outline-none focus:ring-0 appearance-none"
          />
        </div>

        {/* Group Type */}
        <div className="relative search-field rounded-2xl">
          <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#58bdae]" />
          <select
            value={groupType}
            onChange={(e) => setGroupType(e.target.value)}
            className="w-full h-[52px] pl-11 pr-8 rounded-2xl bg-white/70 border-0 text-[14px] font-medium text-[#1A1A18] focus:outline-none focus:ring-0 appearance-none cursor-pointer"
          >
            <option value="">Travelling as...</option>
            <option value="solo">Solo Traveller</option>
            <option value="couple">Couple / Twin</option>
            <option value="family">Family</option>
            <option value="group">Group</option>
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#58bdae]/50 pointer-events-none" />
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={!destination.trim()}
          className="search-btn h-[52px] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-2xl flex items-center justify-center gap-2.5 text-[15px] tracking-wide font-heading"
        >
          <Search className="w-[18px] h-[18px]" />
          Search Trip
        </button>
      </div>

      {/* Group size selector (shown when group selected) */}
      {groupType === 'group' && (
        <div className="mt-2 flex items-center gap-3 bg-[#58bdae]/8 p-3 rounded-2xl border border-[#58bdae]/10">
          <Users className="w-4 h-4 text-[#58bdae]" />
          <span className="text-sm font-medium text-[#1A1A18]">Group Size:</span>
          <select
            value={groupSize}
            onChange={(e) => setGroupSize(Number(e.target.value))}
            className="h-9 px-3 rounded-xl bg-white border-0 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#58bdae]/30"
          >
            {Array.from({ length: 29 }, (_, i) => i + 2).map((n) => (
              <option key={n} value={n}>{n} people</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
