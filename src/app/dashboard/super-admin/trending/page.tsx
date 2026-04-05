'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Loader2, Star, MapPin, Search, LayoutGrid } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  title: string;
  activityType: string;
  packageCategory: string | null;
  durationDays: number;
  isTrending: boolean;
  guide: { user: { name: string } };
  destination: { name: string; city: { name: string; state: { name: string } } };
  fixedDepartures: { pricePerPerson: number; startDate: string }[];
}

const SECTIONS = [
  { key: 'ALL', label: 'All Products' },
  { key: 'TRENDING', label: 'Trending' },
  { key: 'HERITAGE_WALKS', label: 'Heritage & Culture' },
  { key: 'GROUP_TRIPS', label: 'Group Trips' },
  { key: 'ADVENTURE_GUIDES', label: 'Adventure' },
  { key: 'TRAVEL_WITH_INFLUENCERS', label: 'Influencers' },
  { key: 'TOURIST_GUIDES', label: 'Tourist Guides' },
];

export default function SuperAdminTrendingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState('ALL');

  useEffect(() => {
    fetch('/api/admin/trending')
      .then((r) => r.json())
      .then((data) => setProducts(data.products || []))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const toggleTrending = async (productId: string, currentState: boolean) => {
    setToggling(productId);
    try {
      const res = await fetch('/api/admin/trending', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, isTrending: !currentState }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, isTrending: !currentState } : p))
      );
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle');
    } finally {
      setToggling(null);
    }
  };

  const filtered = products.filter((p) => {
    // Text search
    const matchesSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.destination.name.toLowerCase().includes(search.toLowerCase()) ||
      p.guide.user.name.toLowerCase().includes(search.toLowerCase());

    // Section filter
    let matchesSection = true;
    if (activeSection === 'TRENDING') {
      matchesSection = p.isTrending;
    } else if (activeSection !== 'ALL') {
      matchesSection = p.packageCategory === activeSection;
    }

    return matchesSearch && matchesSection;
  });

  const trendingCount = products.filter((p) => p.isTrending).length;
  const getSectionCount = (key: string) => {
    if (key === 'ALL') return products.length;
    if (key === 'TRENDING') return trendingCount;
    return products.filter((p) => p.packageCategory === key).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-btg-terracotta" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-heading text-btg-dark mb-1">
          Homepage Sections &amp; Trending
        </h1>
        <p className="text-gray-600">
          Control which packages appear in each homepage section. Mark packages as trending to feature them
          in the &quot;Trending Experiences&quot; section. Currently {trendingCount} trending.
        </p>
      </div>

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {SECTIONS.map((section) => (
          <button
            key={section.key}
            onClick={() => setActiveSection(section.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
              activeSection === section.key
                ? 'bg-btg-terracotta text-white border-btg-terracotta'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {section.key === 'TRENDING' && <Star className="w-3.5 h-3.5" />}
            {section.key === 'ALL' && <LayoutGrid className="w-3.5 h-3.5" />}
            {section.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeSection === section.key ? 'bg-white/20' : 'bg-gray-100'
            }`}>
              {getSectionCount(section.key)}
            </span>
          </button>
        ))}
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, destination or guide..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent"
        />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500">No packages found for this section.</p>
          </div>
        )}
        {filtered.map((product) => (
          <div
            key={product.id}
            className={`bg-white rounded-xl border p-5 flex items-center justify-between ${
              product.isTrending ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200'
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {product.isTrending && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                <h3 className="font-semibold text-gray-900">{product.title}</h3>
                {product.packageCategory && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-btg-cream text-btg-terracotta font-medium">
                    {SECTIONS.find((s) => s.key === product.packageCategory)?.label || product.packageCategory}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                <MapPin className="w-3 h-3 inline" /> {product.destination.name}, {product.destination.city.state.name} &bull;
                By {product.guide.user.name} &bull;
                {product.durationDays} days &bull;
                {product.activityType.replace(/_/g, ' ')}
              </p>
              {product.fixedDepartures[0] && (
                <p className="text-xs text-btg-terracotta mt-1">
                  From {formatCurrency(product.fixedDepartures[0].pricePerPerson)}/person
                </p>
              )}
            </div>
            <button
              onClick={() => toggleTrending(product.id, product.isTrending)}
              disabled={toggling === product.id}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                product.isTrending
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50`}
            >
              {toggling === product.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <TrendingUp className="w-4 h-4" />
              )}
              {product.isTrending ? 'Remove Trending' : 'Make Trending'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
