'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ACTIVITY_LABELS } from '@/lib/utils';
import { SlidersHorizontal, RotateCcw, ChevronDown } from 'lucide-react';

interface Category {
  slug: string;
  urlSlug: string;
  label: string;
}

interface SearchFiltersProps {
  states: { id: string; name: string; code: string; isNorthIndia: boolean }[];
  categories: Category[];
  currentFilters: Record<string, string | undefined>;
}

export function SearchFilters({ states, categories, currentFilters }: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/search?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/search');
  };

  const selectClass =
    'w-full h-11 rounded-full border border-btg-dark/15 bg-btg-cream px-4 pr-10 text-sm text-btg-dark font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-btg-terracotta/40 focus:border-btg-terracotta transition-colors cursor-pointer';

  return (
    <div className="bg-white rounded-[20px] border border-btg-dark/[0.06] shadow-[0_2px_16px_rgba(28,26,23,0.06)] p-6 sticky top-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-btg-terracotta" />
          <h3 className="font-heading text-lg font-medium text-btg-dark">Filters</h3>
        </div>
        <button
          onClick={clearFilters}
          className="text-xs text-btg-light-text hover:text-btg-terracotta flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Clear All
        </button>
      </div>

      {/* Category Filter */}
      <div className="mb-5">
        <label className="block text-[11px] font-semibold tracking-[0.12em] uppercase text-btg-light-text mb-2">Category</label>
        <div className="relative">
          <select
            value={currentFilters.category || ''}
            onChange={(e) => updateFilter('category', e.target.value)}
            className={selectClass}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.urlSlug} value={c.urlSlug}>{c.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-btg-light-text pointer-events-none" />
        </div>
      </div>

      {/* State Filter */}
      <div className="mb-5">
        <label className="block text-[11px] font-semibold tracking-[0.12em] uppercase text-btg-light-text mb-2">State</label>
        <div className="relative">
          <select
            value={currentFilters.state || ''}
            onChange={(e) => updateFilter('state', e.target.value)}
            className={selectClass}
          >
            <option value="">All States</option>
            <optgroup label="North India">
              {states.filter((s) => s.isNorthIndia).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </optgroup>
            <optgroup label="Other States">
              {states.filter((s) => !s.isNorthIndia).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </optgroup>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-btg-light-text pointer-events-none" />
        </div>
      </div>

      {/* Activity Type */}
      <div className="mb-5">
        <label className="block text-[11px] font-semibold tracking-[0.12em] uppercase text-btg-light-text mb-2">Activity Type</label>
        <div className="relative">
          <select
            value={currentFilters.activity || ''}
            onChange={(e) => updateFilter('activity', e.target.value)}
            className={selectClass}
          >
            <option value="">All Activities</option>
            {Object.entries(ACTIVITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-btg-light-text pointer-events-none" />
        </div>
      </div>

      {/* Trip Type Filter */}
      <div className="mb-5">
        <label className="block text-[11px] font-semibold tracking-[0.12em] uppercase text-btg-light-text mb-2">Trip Type</label>
        <div className="relative">
          <select
            value={currentFilters.gender || ''}
            onChange={(e) => updateFilter('gender', e.target.value)}
            className={selectClass}
          >
            <option value="">All Types</option>
            <option value="MIXED">Mixed Gender</option>
            <option value="MALE_ONLY">Male Only</option>
            <option value="FEMALE_ONLY">Female Only</option>
            <option value="COUPLES_ONLY">Couples Only</option>
            <option value="SOLO_ONLY">Solo Only</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-btg-light-text pointer-events-none" />
        </div>
      </div>

      {/* Min Rating */}
      <div className="mb-5">
        <label className="block text-[11px] font-semibold tracking-[0.12em] uppercase text-btg-light-text mb-2">Guide Rating</label>
        <div className="relative">
          <select
            value={currentFilters.rating || ''}
            onChange={(e) => updateFilter('rating', e.target.value)}
            className={selectClass}
          >
            <option value="">Any Rating</option>
            <option value="4.5">4.5+ &#9733;</option>
            <option value="4">4.0+ &#9733;</option>
            <option value="3.5">3.5+ &#9733;</option>
            <option value="3">3.0+ &#9733;</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-btg-light-text pointer-events-none" />
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-5">
        <label className="block text-[11px] font-semibold tracking-[0.12em] uppercase text-btg-light-text mb-2">Price per Person (&#x20B9;)</label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={currentFilters.minPrice || ''}
            onChange={(e) => updateFilter('minPrice', e.target.value)}
            className="w-1/2 h-11 rounded-full border border-btg-dark/15 bg-btg-cream px-4 text-sm text-btg-dark focus:outline-none focus:ring-2 focus:ring-btg-terracotta/40 focus:border-btg-terracotta transition-colors"
          />
          <input
            type="number"
            placeholder="Max"
            value={currentFilters.maxPrice || ''}
            onChange={(e) => updateFilter('maxPrice', e.target.value)}
            className="w-1/2 h-11 rounded-full border border-btg-dark/15 bg-btg-cream px-4 text-sm text-btg-dark focus:outline-none focus:ring-2 focus:ring-btg-terracotta/40 focus:border-btg-terracotta transition-colors"
          />
        </div>
      </div>

      {/* Sort */}
      <div className="mb-2">
        <label className="block text-[11px] font-semibold tracking-[0.12em] uppercase text-btg-light-text mb-2">Sort By</label>
        <div className="relative">
          <select
            value={currentFilters.sort || ''}
            onChange={(e) => updateFilter('sort', e.target.value)}
            className={selectClass}
          >
            <option value="">Earliest First</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="date">Departure Date</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-btg-light-text pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
