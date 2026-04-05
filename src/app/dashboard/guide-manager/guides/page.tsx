'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Users, Shield, ShieldCheck, Search, Star, ExternalLink } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Guide {
  id: string;
  slug: string;
  bio: string | null;
  experienceYears: number | null;
  isVerified: boolean;
  isActive: boolean;
  averageRating: number;
  totalReviews: number;
  totalTrips: number;
  createdAt: string;
  user: { name: string; email: string; image: string | null };
  serviceAreas: { state: { name: string } }[];
}

export default function GuideManagerGuidesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-btg-light-text">Loading guides...</div>}>
      <GuideManagerGuidesContent />
    </Suspense>
  );
}

function GuideManagerGuidesContent() {
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get('filter') || 'all';

  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(initialFilter);

  useEffect(() => {
    fetchGuides();
  }, []);

  const fetchGuides = async () => {
    try {
      const res = await fetch('/api/admin/guides');
      const data = await res.json();
      setGuides(data.guides || []);
    } catch {
      toast.error('Failed to load guides');
    } finally {
      setLoading(false);
    }
  };

  const toggleVerification = async (guideId: string, verified: boolean) => {
    try {
      const res = await fetch(`/api/admin/guides/${guideId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified: !verified }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(verified ? 'Verification removed' : 'Guide verified!');
      fetchGuides();
    } catch {
      toast.error('Action failed');
    }
  };

  const filtered = guides
    .filter((g) => {
      if (filter === 'pending') return g.isVerified === false;
      if (filter === 'verified') return g.isVerified === true;
      return true;
    })
    .filter(
      (g) =>
        g.user.name.toLowerCase().includes(search.toLowerCase()) ||
        g.user.email.toLowerCase().includes(search.toLowerCase())
    );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Guides</h1>
          <p className="text-gray-600 mt-1">{guides.length} registered guides across all regions</p>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'verified', label: 'Verified' },
            { key: 'pending', label: 'Pending' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guides by name or email..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Guides List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Guide</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Location</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Rating</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Trips</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Joined</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  No guides found
                </td>
              </tr>
            ) : (
              filtered.map((guide) => (
                <tr key={guide.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-sm font-bold text-indigo-700">
                          {guide.user.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{guide.user.name}</p>
                        <p className="text-xs text-gray-500">{guide.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {guide.serviceAreas.length > 0
                      ? guide.serviceAreas.map((a) => a.state.name).join(', ')
                      : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      <span>{guide.averageRating.toFixed(1)}</span>
                      <span className="text-gray-400">({guide.totalReviews})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{guide.totalTrips}</td>
                  <td className="px-6 py-4">
                    {guide.isVerified ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full">
                        <ShieldCheck className="h-3 w-3" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                        <Shield className="h-3 w-3" />
                        Unverified
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(guide.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/admin/guides/${guide.id}`}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors inline-flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View
                      </Link>
                      <button
                        onClick={() => toggleVerification(guide.id, guide.isVerified)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                          guide.isVerified
                            ? 'bg-red-50 text-red-700 hover:bg-red-100'
                            : 'bg-green-50 text-green-700 hover:bg-green-100'
                        }`}
                      >
                        {guide.isVerified ? 'Unverify' : 'Verify'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
