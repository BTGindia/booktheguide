'use client';

import { useEffect, useState } from 'react';
import { Award, CheckCircle, XCircle, Clock, Search, Loader2, FileText, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Certification {
  id: string;
  certType: string;
  issuingAuthority: string;
  certNumber: string | null;
  issueDate: string;
  expiryDate: string | null;
  documentUrl: string | null;
  verificationStatus: string;
  adminNotes: string | null;
  createdAt: string;
  guide: {
    id: string;
    user: { name: string; email: string };
  };
}

type FilterStatus = 'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  VERIFIED: { bg: 'bg-green-100', text: 'text-green-800' },
  REJECTED: { bg: 'bg-red-100', text: 'text-red-800' },
};

export default function AdminCertificationsPage() {
  const [certs, setCerts] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('PENDING');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const fetchCerts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'ALL') params.set('status', filter);
      const res = await fetch(`/api/admin/certifications/review?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCerts(data.certifications || []);
      }
    } catch {
      toast.error('Failed to load certifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCerts(); }, [filter]);

  const handleAction = async (certId: string, action: 'VERIFY' | 'REJECT') => {
    setActionLoading(certId);
    try {
      const res = await fetch('/api/admin/certifications/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificationId: certId, action, notes: notes[certId] || '' }),
      });
      if (res.ok) {
        toast.success(`Certification ${action.toLowerCase()}d successfully`);
        fetchCerts();
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

  const isExpired = (date: string | null) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const isExpiringSoon = (date: string | null) => {
    if (!date) return false;
    const d = new Date(date);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading text-btg-dark">Certification Review</h1>
          <p className="text-gray-500 text-sm mt-1">Verify guide certifications and credentials</p>
        </div>
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-btg-terracotta" />
          <span className="text-sm font-medium text-gray-600">{certs.length} certifications</span>
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
      ) : certs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="font-semibold text-btg-dark">All caught up!</p>
          <p className="text-sm text-gray-500">No certifications matching this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {certs.map((cert) => {
            const statusStyle = STATUS_COLORS[cert.verificationStatus] || STATUS_COLORS.PENDING;
            const expired = isExpired(cert.expiryDate);
            const expiringSoon = isExpiringSoon(cert.expiryDate);

            return (
              <div key={cert.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-btg-sand rounded-full flex items-center justify-center">
                      <Award className="w-5 h-5 text-btg-terracotta" />
                    </div>
                    <div>
                      <p className="font-semibold text-btg-dark text-sm">{cert.certType}</p>
                      <p className="text-xs text-gray-500">by {cert.issuingAuthority}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Guide: {cert.guide.user.name} ({cert.guide.user.email})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {expired && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Expired
                      </span>
                    )}
                    {expiringSoon && !expired && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Expiring Soon
                      </span>
                    )}
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                      {cert.verificationStatus}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-xs">
                  <div>
                    <span className="text-gray-500">Cert Number</span>
                    <p className="font-medium text-gray-800">{cert.certNumber || '—'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Issued</span>
                    <p className="font-medium text-gray-800">{formatDate(cert.issueDate)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Expires</span>
                    <p className={`font-medium ${expired ? 'text-red-600' : expiringSoon ? 'text-amber-600' : 'text-gray-800'}`}>
                      {cert.expiryDate ? formatDate(cert.expiryDate) : 'No expiry'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Submitted</span>
                    <p className="font-medium text-gray-800">{formatDate(cert.createdAt)}</p>
                  </div>
                </div>

                {cert.documentUrl && (
                  <a
                    href={cert.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-btg-terracotta hover:underline mb-3"
                  >
                    <FileText className="w-3 h-3" /> View Document
                  </a>
                )}

                {cert.verificationStatus === 'PENDING' && (
                  <div className="border-t border-gray-100 pt-3 mt-2">
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Admin notes (optional)..."
                          value={notes[cert.id] || ''}
                          onChange={(e) => setNotes({ ...notes, [cert.id]: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-btg-terracotta/20 focus:border-btg-terracotta outline-none"
                        />
                      </div>
                      <button
                        onClick={() => handleAction(cert.id, 'VERIFY')}
                        disabled={actionLoading === cert.id}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        {actionLoading === cert.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                      </button>
                      <button
                        onClick={() => handleAction(cert.id, 'REJECT')}
                        disabled={actionLoading === cert.id}
                        className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}

                {cert.adminNotes && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-lg text-xs text-gray-600">
                    <span className="font-medium">Admin notes:</span> {cert.adminNotes}
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
