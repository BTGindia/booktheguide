'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, Shield, Clock, XCircle, AlertTriangle, Search, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Guide {
  id: string;
  slug: string;
  legalName: string | null;
  displayName: string | null;
  verificationStatus: string;
  profileCompleteness: number;
  isActive: boolean;
  createdAt: string;
  user: { name: string; email: string; image: string | null };
  serviceAreas: { state: { name: string } }[];
  _count: { guideCertifications: number };
  pendingReviewFields: string[];
}

type FilterStatus = 'ALL' | 'UNVERIFIED' | 'IN_REVIEW' | 'VERIFIED' | 'SUSPENDED';

const STATUS_BADGE: Record<string, { bg: string; text: string; icon: any }> = {
  UNVERIFIED: { bg: 'bg-gray-100', text: 'text-gray-700', icon: AlertTriangle },
  IN_REVIEW: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
  VERIFIED: { bg: 'bg-green-100', text: 'text-green-800', icon: ShieldCheck },
  SUSPENDED: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
};

export default function VerifyGuidesPage() {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('IN_REVIEW');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const fetchGuides = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'ALL') params.set('status', filter);
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/guides/verify?${params}`);
      if (res.ok) {
        const data = await res.json();
        setGuides(data.guides || []);
      }
    } catch {
      toast.error('Failed to load guides');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGuides(); }, [filter]);

  const handleAction = async (guideId: string, action: string) => {
    setActionLoading(guideId);
    try {
      const res = await fetch('/api/admin/guides/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guideId, action, notes: notes[guideId] || '' }),
      });
      if (res.ok) {
        toast.success(`Guide ${action.toLowerCase()} successfully`);
        fetchGuides();
        setExpandedId(null);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Action failed');
      }
    } catch {
      toast.error('Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading text-btg-dark">Guide Verification</h1>
          <p className="text-gray-500 text-sm mt-1">Review and verify guide profiles</p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-btg-terracotta" />
          <span className="text-sm font-medium text-gray-600">{guides.length} guides</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchGuides()}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-btg-terracotta/20 focus:border-btg-terracotta outline-none"
          />
        </div>
        <div className="flex gap-2">
          {(['ALL', 'IN_REVIEW', 'UNVERIFIED', 'VERIFIED', 'SUSPENDED'] as FilterStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                filter === s
                  ? 'bg-btg-terracotta text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s === 'ALL' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Guide List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-btg-terracotta" />
        </div>
      ) : guides.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <ShieldCheck className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="font-semibold text-btg-dark">All caught up!</p>
          <p className="text-sm text-gray-500">No guides matching this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {guides.map((guide) => {
            const status = STATUS_BADGE[guide.verificationStatus] || STATUS_BADGE.UNVERIFIED;
            const StatusIcon = status.icon;
            const isExpanded = expandedId === guide.id;

            return (
              <div key={guide.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : guide.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-btg-sand rounded-full flex items-center justify-center text-btg-terracotta font-bold text-sm">
                      {(guide.user.name || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-btg-dark text-sm">
                        {guide.legalName || guide.displayName || guide.user.name}
                      </p>
                      <p className="text-xs text-gray-500">{guide.user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {guide.pendingReviewFields?.length > 0 && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                        {guide.pendingReviewFields.length} pending fields
                      </span>
                    )}
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Completeness</div>
                      <div className="text-sm font-semibold">{guide.profileCompleteness || 0}%</div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                      <StatusIcon className="w-3 h-3" />
                      {guide.verificationStatus.replace('_', ' ')}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50/50">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-gray-500 text-xs">States</span>
                        <p className="font-medium">{guide.serviceAreas?.map((sa: any) => sa.state?.name).join(', ') || 'None'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs">Certifications</span>
                        <p className="font-medium">{guide._count?.guideCertifications || 0}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs">Active</span>
                        <p className="font-medium">{guide.isActive ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs">Joined</span>
                        <p className="font-medium">{formatDate(guide.createdAt)}</p>
                      </div>
                    </div>

                    {guide.pendingReviewFields?.length > 0 && (
                      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs font-semibold text-amber-800 mb-1">Fields pending review:</p>
                        <div className="flex flex-wrap gap-1">
                          {guide.pendingReviewFields.map((f: string) => (
                            <span key={f} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">{f}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mb-4">
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Admin Notes</label>
                      <textarea
                        value={notes[guide.id] || ''}
                        onChange={(e) => setNotes({ ...notes, [guide.id]: e.target.value })}
                        placeholder="Add notes for this action..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none h-20 focus:ring-2 focus:ring-btg-terracotta/20 focus:border-btg-terracotta outline-none"
                      />
                    </div>

                    <div className="flex gap-2">
                      {guide.verificationStatus !== 'VERIFIED' && (
                        <button
                          onClick={() => handleAction(guide.id, 'VERIFY')}
                          disabled={actionLoading === guide.id}
                          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          {actionLoading === guide.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                        </button>
                      )}
                      {guide.verificationStatus !== 'SUSPENDED' && (
                        <button
                          onClick={() => handleAction(guide.id, 'SUSPEND')}
                          disabled={actionLoading === guide.id}
                          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                          Suspend
                        </button>
                      )}
                      {guide.verificationStatus === 'VERIFIED' && (
                        <button
                          onClick={() => handleAction(guide.id, 'REVERT_TO_REVIEW')}
                          disabled={actionLoading === guide.id}
                          className="px-4 py-2 bg-yellow-500 text-white text-sm font-medium rounded-lg hover:bg-yellow-600 disabled:opacity-50"
                        >
                          Revert to Review
                        </button>
                      )}
                      {guide.verificationStatus === 'IN_REVIEW' && (
                        <button
                          onClick={() => handleAction(guide.id, 'REJECT')}
                          disabled={actionLoading === guide.id}
                          className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      )}
                    </div>
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
