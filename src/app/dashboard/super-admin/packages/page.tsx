'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, Search, ChevronDown, ChevronRight, Clock, CheckCircle, XCircle, Star, MapPin } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface PackageItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  activityType: string;
  packageCategory: string;
  durationDays: number;
  coverImage: string | null;
  createdAt: string;
  isTrending: boolean;
  guide: {
    averageRating: number;
    guideScore: number | null;
    user: { name: string };
  };
  destination: {
    name: string;
    city: { name: string; state: { name: string } };
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  TOURIST_GUIDES: 'Tourist Guides',
  GROUP_TRIPS: 'Group Trips',
  ADVENTURE_GUIDES: 'Adventure Sports',
  HERITAGE_WALKS: 'Heritage Walks',
  TRAVEL_WITH_INFLUENCERS: 'Travel with Influencers',
  OFFBEAT_TRAVEL: 'Offbeat Travel',
  TREKKING: 'Trekking',
};

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  PENDING_REVIEW: { icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-200', label: 'Pending' },
  APPROVED: { icon: CheckCircle, color: 'text-green-600 bg-green-50 border-green-200', label: 'Approved' },
  REJECTED: { icon: XCircle, color: 'text-red-600 bg-red-50 border-red-200', label: 'Rejected' },
};

export default function SuperAdminPackagesPage() {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      setPackages(data.products || []);
      // Auto-expand all categories
      const cats = new Set<string>((data.products || []).map((p: PackageItem) => p.packageCategory));
      setExpandedCategories(cats);
    } catch {
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  // Filter
  const filtered = packages
    .filter((p) => statusFilter === 'all' || p.status === statusFilter)
    .filter(
      (p) =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.guide.user.name.toLowerCase().includes(search.toLowerCase()) ||
        p.destination.name.toLowerCase().includes(search.toLowerCase())
    );

  // Group by category
  const grouped: Record<string, PackageItem[]> = {};
  for (const pkg of filtered) {
    const cat = pkg.packageCategory || 'OTHER';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(pkg);
  }

  // Sort categories in standard order
  const categoryOrder = Object.keys(CATEGORY_LABELS);
  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const ai = categoryOrder.indexOf(a);
    const bi = categoryOrder.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  // Group by subcategory (activityType) within each category
  const groupByActivity = (items: PackageItem[]) => {
    const sub: Record<string, PackageItem[]> = {};
    for (const item of items) {
      const key = item.activityType?.replace(/_/g, ' ') || 'General';
      if (!sub[key]) sub[key] = [];
      sub[key].push(item);
    }
    return Object.entries(sub).sort(([a], [b]) => a.localeCompare(b));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-btg-terracotta" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Packages</h1>
        <p className="text-gray-600 mt-1">All packages organized by category and sub-category</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by package, guide, or destination..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all', label: 'All' },
            { key: 'APPROVED', label: 'Approved' },
            { key: 'PENDING_REVIEW', label: 'Pending' },
            { key: 'REJECTED', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === tab.key
                  ? 'bg-btg-terracotta text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-xs opacity-80">
                ({tab.key === 'all' ? packages.length : packages.filter((p) => p.status === tab.key).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
        {categoryOrder.map((cat) => {
          const count = grouped[cat]?.length || 0;
          return (
            <button
              key={cat}
              onClick={() => {
                if (count > 0) {
                  setExpandedCategories(new Set([cat]));
                  document.getElementById(`cat-${cat}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className={`p-3 rounded-xl border text-center transition-all hover:shadow-md ${
                count > 0 ? 'bg-white border-gray-200 hover:border-btg-terracotta/40' : 'bg-gray-50 border-gray-100 opacity-50'
              }`}
            >
              <div className="text-xl font-bold text-btg-terracotta">{count}</div>
              <div className="text-[11px] font-medium text-gray-600 leading-tight">{CATEGORY_LABELS[cat] || cat}</div>
            </button>
          );
        })}
      </div>

      {/* Category Sections */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No packages found</h3>
          <p className="text-gray-500 mt-1">Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedCategories.map((cat) => {
            const items = grouped[cat];
            const isExpanded = expandedCategories.has(cat);
            const subcategories = groupByActivity(items);

            return (
              <div key={cat} id={`cat-${cat}`} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(cat)}
                  className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                    <h2 className="text-lg font-bold text-gray-900">{CATEGORY_LABELS[cat] || cat}</h2>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">{items.length} packages</span>
                  </div>
                  <div className="flex gap-3 text-xs text-gray-500">
                    <span className="text-green-600">{items.filter((p) => p.status === 'APPROVED').length} approved</span>
                    <span className="text-amber-600">{items.filter((p) => p.status === 'PENDING_REVIEW').length} pending</span>
                  </div>
                </button>

                {/* Subcategories */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {subcategories.map(([activityType, subItems]) => (
                      <div key={activityType} className="border-b border-gray-50 last:border-b-0">
                        <div className="px-5 py-2.5 bg-gray-50/70">
                          <h3 className="text-sm font-semibold text-gray-700">{activityType} <span className="font-normal text-gray-400">({subItems.length})</span></h3>
                        </div>
                        <div className="divide-y divide-gray-50">
                          {subItems.map((pkg) => {
                            const si = statusConfig[pkg.status] || statusConfig.PENDING_REVIEW;
                            const StatusIcon = si.icon;
                            return (
                              <Link
                                key={pkg.id}
                                href={`/dashboard/admin/products/${pkg.id}`}
                                className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors"
                              >
                                {/* Thumbnail */}
                                <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                  {pkg.coverImage ? (
                                    <img src={pkg.coverImage} alt={pkg.title} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                      <Package className="w-5 h-5" />
                                    </div>
                                  )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <h4 className="font-semibold text-gray-900 truncate text-sm">{pkg.title}</h4>
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${si.color}`}>
                                      <StatusIcon className="h-3 w-3" />
                                      {si.label}
                                    </span>
                                    {pkg.isTrending && (
                                      <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">TRENDING</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <span>By {pkg.guide.user.name}</span>
                                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{pkg.destination.city.state.name}</span>
                                    <span>{pkg.durationDays}D</span>
                                    {pkg.guide.averageRating > 0 && (
                                      <span className="flex items-center gap-0.5"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{pkg.guide.averageRating.toFixed(1)}</span>
                                    )}
                                    {pkg.guide.guideScore != null && pkg.guide.guideScore > 0 && (
                                      <span className="text-btg-terracotta font-medium">Score: {pkg.guide.guideScore.toFixed(0)}</span>
                                    )}
                                  </div>
                                </div>

                                {/* Date */}
                                <div className="text-xs text-gray-400 flex-shrink-0">
                                  {formatDate(pkg.createdAt)}
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
