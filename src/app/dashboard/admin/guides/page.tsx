'use client';

import { useEffect, useState } from 'react';
import { Users, Shield, ShieldCheck, Search, MapPin, Star, ExternalLink, Activity, X, Loader2, Lightbulb } from 'lucide-react';
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
  basePricePerDay: number;
  guideScore: number;
  createdAt: string;
  user: { name: string; email: string; image: string | null };
  serviceAreas: { state: { name: string } }[];
}

interface ScoreTip {
  dimension: string;
  score: number;
  maxScore: number;
  percentage: number;
  tips: string[];
}

interface ScorePopupData {
  guideName: string;
  guideId: string;
  score: number;
  breakdown: Record<string, number>;
  tips: ScoreTip[];
  updatedAt: string;
}

export default function AdminGuidesPage() {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [scorePopup, setScorePopup] = useState<ScorePopupData | null>(null);
  const [scorePopupLoading, setScorePopupLoading] = useState(false);

  const openScorePopup = async (guideId: string) => {
    setScorePopupLoading(true);
    try {
      const res = await fetch(`/api/guide/score?guideId=${guideId}`);
      if (res.ok) {
        const data = await res.json();
        setScorePopup(data);
      }
    } catch (error) {
      console.error('Error fetching score:', error);
    } finally {
      setScorePopupLoading(false);
    }
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-blue-100 text-blue-800';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getScoreBarColor = (pct: number) => {
    if (pct >= 80) return 'bg-green-500';
    if (pct >= 60) return 'bg-blue-500';
    if (pct >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

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

  const filtered = guides.filter(
    (g) =>
      g.user.name.toLowerCase().includes(search.toLowerCase()) ||
      g.user.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-btg-terracotta"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Guides Management</h1>
          <p className="text-gray-600 mt-1">{guides.length} registered guides</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search guides by name or email..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent"
        />
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
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Health Score</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map((guide) => (
              <tr key={guide.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-btg-sand flex items-center justify-center">
                      <span className="text-sm font-bold text-btg-terracotta">
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
                  <div className="flex items-center gap-2">
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
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {formatDate(guide.createdAt)}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => openScorePopup(guide.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-semibold cursor-pointer hover:opacity-80 transition-opacity ${getScoreBadgeColor(guide.guideScore || 0)}`}
                    title="Click to view score breakdown"
                  >
                    <Activity className="h-3.5 w-3.5" />
                    {(guide.guideScore || 0).toFixed(1)}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/admin/guides/${guide.id}`}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-btg-cream text-btg-terracotta hover:bg-btg-sand transition-colors inline-flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Edit
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Guide Health Score Popup */}
      {(scorePopup || scorePopupLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-bold text-gray-900">Guide Health Report</h2>
              </div>
              <button onClick={() => setScorePopup(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {scorePopupLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              </div>
            ) : scorePopup && (
              <div className="p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Guide</p>
                    <p className="font-semibold text-gray-900">{scorePopup.guideName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Overall Score</p>
                    <p className={`text-3xl font-bold ${scorePopup.score >= 80 ? 'text-green-600' : scorePopup.score >= 60 ? 'text-blue-600' : scorePopup.score >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {scorePopup.score}
                      <span className="text-sm font-normal text-gray-400">/100</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-700">Score Breakdown</p>
                  {scorePopup.tips.map((tip) => (
                    <div key={tip.dimension} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{tip.dimension}</span>
                        <span className="font-medium text-gray-900">{tip.score}/{tip.maxScore}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${getScoreBarColor(tip.percentage)}`}
                          style={{ width: `${tip.percentage}%` }}
                        />
                      </div>
                      {tip.tips.length > 0 && (
                        <ul className="ml-1 space-y-0.5">
                          {tip.tips.map((t, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-gray-500">
                              <Lightbulb className="w-3 h-3 text-yellow-500 flex-shrink-0 mt-0.5" />
                              {t}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Key Action Items</p>
                  <ul className="space-y-1.5">
                    {scorePopup.tips
                      .filter(t => t.percentage < 70)
                      .sort((a, b) => a.percentage - b.percentage)
                      .slice(0, 3)
                      .map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                          <span className={`inline-block w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${getScoreBarColor(tip.percentage)}`}>
                            {i + 1}
                          </span>
                          <span><strong>{tip.dimension}</strong> ({tip.percentage}%) — {tip.tips[0] || 'Needs improvement'}</span>
                        </li>
                      ))}
                    {scorePopup.tips.filter(t => t.percentage < 70).length === 0 && (
                      <li className="text-xs text-green-600 font-medium">All dimensions are performing well!</li>
                    )}
                  </ul>
                </div>

                <p className="text-[10px] text-gray-400 text-right">
                  Updated: {new Date(scorePopup.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
