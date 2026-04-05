'use client';

import { useEffect, useState } from 'react';
import { Wallet, CheckCircle, XCircle, Clock, Loader2, FileText, CreditCard } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface KycEntry {
  id: string;
  kycStatus: string;
  idProofType: string;
  idProofNumber: string; // masked
  panNumber: string | null; // masked
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumberMasked: string | null;
  bankIfsc: string | null;
  idProofDocUrl: string | null;
  panDocUrl: string | null;
  bankProofDocUrl: string | null;
  payoutEligible: boolean;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  guide: {
    id: string;
    user: { name: string; email: string };
    verificationStatus: string;
  };
}

type FilterStatus = 'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  VERIFIED: { bg: 'bg-green-100', text: 'text-green-800' },
  REJECTED: { bg: 'bg-red-100', text: 'text-red-800' },
};

export default function AdminKycPage() {
  const [kycList, setKycList] = useState<KycEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('PENDING');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const fetchKyc = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'ALL') params.set('status', filter);
      const res = await fetch(`/api/admin/kyc/review?${params}`);
      if (res.ok) {
        const data = await res.json();
        setKycList(data.kycEntries || []);
      }
    } catch {
      toast.error('Failed to load KYC entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchKyc(); }, [filter]);

  const handleAction = async (kycId: string, guideId: string, action: 'VERIFY' | 'REJECT') => {
    setActionLoading(kycId);
    try {
      const res = await fetch('/api/admin/kyc/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kycId, guideId, action, notes: notes[kycId] || '' }),
      });
      if (res.ok) {
        toast.success(`KYC ${action.toLowerCase()}d successfully`);
        fetchKyc();
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
          <h1 className="text-2xl font-bold font-heading text-btg-dark">KYC Review</h1>
          <p className="text-gray-500 text-sm mt-1">Review guide KYC documents and approve payouts</p>
        </div>
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-btg-terracotta" />
          <span className="text-sm font-medium text-gray-600">{kycList.length} entries</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(['ALL', 'PENDING', 'VERIFIED', 'REJECTED'] as FilterStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              filter === s
                ? 'bg-btg-terracotta text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === 'ALL' ? 'All' : s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-btg-terracotta" />
        </div>
      ) : kycList.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="font-semibold text-btg-dark">All caught up!</p>
          <p className="text-sm text-gray-500">No KYC entries matching this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {kycList.map((kyc) => {
            const statusStyle = STATUS_COLORS[kyc.kycStatus] || STATUS_COLORS.PENDING;

            return (
              <div key={kyc.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-btg-dark text-sm">{kyc.guide.user.name}</p>
                      <p className="text-xs text-gray-500">{kyc.guide.user.email}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Guide status: {kyc.guide.verificationStatus.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {kyc.payoutEligible && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        Payout Eligible
                      </span>
                    )}
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                      {kyc.kycStatus}
                    </span>
                  </div>
                </div>

                {/* KYC Details */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3 text-xs">
                  <div>
                    <span className="text-gray-500">ID Proof Type</span>
                    <p className="font-medium text-gray-800">{kyc.idProofType}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">ID Number (masked)</span>
                    <p className="font-medium text-gray-800">{kyc.idProofNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">PAN (masked)</span>
                    <p className="font-medium text-gray-800">{kyc.panNumber || '—'}</p>
                  </div>
                </div>

                {/* Bank Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-xs bg-gray-50 rounded-lg p-3">
                  <div>
                    <span className="text-gray-500">Bank</span>
                    <p className="font-medium text-gray-800">{kyc.bankName || '—'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Account Name</span>
                    <p className="font-medium text-gray-800">{kyc.bankAccountName || '—'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Account (masked)</span>
                    <p className="font-medium text-gray-800">{kyc.bankAccountNumberMasked || '—'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">IFSC</span>
                    <p className="font-medium text-gray-800">{kyc.bankIfsc || '—'}</p>
                  </div>
                </div>

                {/* Documents */}
                <div className="flex gap-3 mb-3">
                  {kyc.idProofDocUrl && (
                    <a href={kyc.idProofDocUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-btg-terracotta hover:underline">
                      <FileText className="w-3 h-3" /> ID Proof Doc
                    </a>
                  )}
                  {kyc.panDocUrl && (
                    <a href={kyc.panDocUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-btg-terracotta hover:underline">
                      <FileText className="w-3 h-3" /> PAN Doc
                    </a>
                  )}
                  {kyc.bankProofDocUrl && (
                    <a href={kyc.bankProofDocUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-btg-terracotta hover:underline">
                      <FileText className="w-3 h-3" /> Bank Proof
                    </a>
                  )}
                </div>

                {/* Action Section */}
                {kyc.kycStatus === 'PENDING' && (
                  <div className="border-t border-gray-100 pt-3 mt-2">
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Admin notes (optional)..."
                          value={notes[kyc.id] || ''}
                          onChange={(e) => setNotes({ ...notes, [kyc.id]: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-btg-terracotta/20 focus:border-btg-terracotta outline-none"
                        />
                      </div>
                      <button
                        onClick={() => handleAction(kyc.id, kyc.guide.id, 'VERIFY')}
                        disabled={actionLoading === kyc.id}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        {actionLoading === kyc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleAction(kyc.id, kyc.guide.id, 'REJECT')}
                        disabled={actionLoading === kyc.id}
                        className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}

                {kyc.adminNotes && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-lg text-xs text-gray-600">
                    <span className="font-medium">Admin notes:</span> {kyc.adminNotes}
                  </div>
                )}

                <div className="mt-2 text-xs text-gray-400">
                  Submitted: {formatDate(kyc.createdAt)} | Last updated: {formatDate(kyc.updatedAt)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
