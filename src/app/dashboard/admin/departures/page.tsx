'use client';

import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle, Clock, MapPin, Calendar, Users, DollarSign } from 'lucide-react';
import { formatCurrency, formatDateRange } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Departure {
  id: string;
  startDate: string;
  endDate: string;
  pricePerPerson: number;
  totalSeats: number;
  bookedSeats: number;
  meetingPoint: string;
  endingPoint: string | null;
  approvalStatus: string;
  commissionPercent: number | null;
  reviewNotes: string | null;
  reviewedAt: string | null;
  product: {
    title: string;
    activityType: string;
    destination: {
      name: string;
      city: { name: string; state: { name: string } };
    };
    guide: {
      user: { name: string };
    };
  };
  reviewedBy?: { user: { name: string } } | null;
}

export default function AdminDeparturesPage() {
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING_APPROVAL');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDepartures = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/departures?status=${statusFilter}`);
      const data = await res.json();
      setDepartures(data.departures || []);
    } catch {
      toast.error('Failed to load departures');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartures();
  }, [statusFilter]);

  const handleReview = async (id: string, action: 'APPROVED' | 'REJECTED') => {
    setSubmitting(true);
    try {
      const body: any = { action, reviewNotes: reviewNotes.trim() || null };

      const res = await fetch(`/api/admin/departures/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(data.message);
      setReviewingId(null);
      setReviewNotes('');
      fetchDepartures();
    } catch (error: any) {
      toast.error(error.message || 'Review failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-heading text-btg-dark mb-2">
          Departure Approvals
        </h1>
        <p className="text-gray-600">Review and approve fixed departures. Set commission percentage when approving.</p>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-6">
        {[
          { value: 'PENDING_APPROVAL', label: 'Pending', icon: Clock },
          { value: 'APPROVED', label: 'Approved', icon: CheckCircle },
          { value: 'REJECTED', label: 'Rejected', icon: XCircle },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-btg-terracotta text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-btg-terracotta" />
        </div>
      ) : departures.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No {statusFilter.toLowerCase().replace('_', ' ')} departures</p>
        </div>
      ) : (
        <div className="space-y-4">
          {departures.map((dep) => (
            <div key={dep.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-btg-dark text-lg">{dep.product.title}</h3>
                    <p className="text-sm text-gray-500">
                      by {dep.product.guide.user.name}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    dep.approvalStatus === 'APPROVED'
                      ? 'bg-green-100 text-green-700'
                      : dep.approvalStatus === 'REJECTED'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {dep.approvalStatus.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Calendar className="w-4 h-4 text-btg-terracotta" />
                    {formatDateRange(dep.startDate, dep.endDate)}
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <MapPin className="w-4 h-4 text-btg-terracotta" />
                    {dep.product.destination.name}
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <DollarSign className="w-4 h-4 text-btg-terracotta" />
                    {formatCurrency(dep.pricePerPerson)} / person
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Users className="w-4 h-4 text-btg-terracotta" />
                    {dep.totalSeats} seats
                  </div>
                </div>

                {dep.meetingPoint && (
                  <p className="text-xs text-gray-500 mb-1">Meeting: {dep.meetingPoint}</p>
                )}
                {dep.endingPoint && (
                  <p className="text-xs text-gray-500 mb-1">Ending: {dep.endingPoint}</p>
                )}

                {dep.approvalStatus === 'APPROVED' && dep.commissionPercent !== null && (
                  <p className="text-sm text-green-700 mt-2">Commission: {dep.commissionPercent}%</p>
                )}

                {dep.reviewNotes && (
                  <p className="text-sm text-gray-600 mt-2 italic">Note: {dep.reviewNotes}</p>
                )}

                {dep.reviewedBy && (
                  <p className="text-xs text-gray-400 mt-1">Reviewed by {dep.reviewedBy.user.name}</p>
                )}

                {/* Review Actions */}
                {dep.approvalStatus === 'PENDING_APPROVAL' && (
                  <>
                    {reviewingId === dep.id ? (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                        <p className="text-sm text-gray-600">
                          Commission will be auto-applied from the state&apos;s fixed rate.
                        </p>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Review Notes (optional)
                          </label>
                          <textarea
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            rows={2}
                            placeholder="Any notes for the guide..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleReview(dep.id, 'APPROVED')}
                            disabled={submitting}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            Approve
                          </button>
                          <button
                            onClick={() => handleReview(dep.id, 'REJECTED')}
                            disabled={submitting}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                          >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                            Reject
                          </button>
                          <button
                            onClick={() => { setReviewingId(null); setReviewNotes(''); }}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReviewingId(dep.id)}
                        className="mt-4 px-4 py-2 bg-btg-terracotta text-white rounded-lg hover:bg-btg-terracotta text-sm"
                      >
                        Review This Departure
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
