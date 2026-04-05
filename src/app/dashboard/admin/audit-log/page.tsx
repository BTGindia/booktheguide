'use client';

import { useEffect, useState } from 'react';
import { FileText, Search, Loader2, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  notes: string | null;
  createdAt: string;
  performedBy: {
    name: string;
    email: string;
    role: string;
  };
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  VERIFY: 'bg-emerald-100 text-emerald-800',
  REJECT: 'bg-red-100 text-red-800',
  SUSPEND: 'bg-orange-100 text-orange-800',
  APPROVE: 'bg-green-100 text-green-800',
  REVERT_TO_REVIEW: 'bg-yellow-100 text-yellow-800',
};

export default function AdminAuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '25');
      if (entityType) params.set('entityType', entityType);
      if (action) params.set('action', action);
      if (search) params.set('entityId', search);
      const res = await fetch(`/api/admin/audit-log?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.logs || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [page, entityType, action]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading text-btg-dark">Audit Log</h1>
          <p className="text-gray-500 text-sm mt-1">Track all admin and system actions</p>
        </div>
        <FileText className="w-5 h-5 text-btg-terracotta" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by entity ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); fetchLogs(); } }}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-btg-terracotta/20 focus:border-btg-terracotta outline-none"
          />
        </div>
        <select
          value={entityType}
          onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-btg-terracotta/20 focus:border-btg-terracotta outline-none"
        >
          <option value="">All Entities</option>
          <option value="GuideProfile">Guide Profile</option>
          <option value="GuideCertification">Certification</option>
          <option value="GuideKyc">KYC</option>
          <option value="Product">Product</option>
        </select>
        <select
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1); }}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-btg-terracotta/20 focus:border-btg-terracotta outline-none"
        >
          <option value="">All Actions</option>
          <option value="VERIFY">Verify</option>
          <option value="REJECT">Reject</option>
          <option value="SUSPEND">Suspend</option>
          <option value="APPROVE">Approve</option>
          <option value="UPDATE">Update</option>
          <option value="CREATE">Create</option>
          <option value="DELETE">Delete</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-btg-terracotta" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-btg-dark">No audit entries found</p>
          <p className="text-sm text-gray-500">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Time</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Entity</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Field</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Change</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">By</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(entry.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_COLORS[entry.action] || 'bg-gray-100 text-gray-700'}`}>
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="text-xs font-medium text-gray-800">{entry.entityType}</span>
                        <p className="text-xs text-gray-400 truncate max-w-[120px]" title={entry.entityId}>
                          {entry.entityId.slice(0, 8)}...
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {entry.fieldName || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {entry.oldValue || entry.newValue ? (
                        <div className="text-xs max-w-[200px]">
                          {entry.oldValue && (
                            <p className="text-red-600 truncate" title={entry.oldValue}>
                              - {entry.oldValue.slice(0, 50)}{entry.oldValue.length > 50 ? '...' : ''}
                            </p>
                          )}
                          {entry.newValue && (
                            <p className="text-green-600 truncate" title={entry.newValue}>
                              + {entry.newValue.slice(0, 50)}{entry.newValue.length > 50 ? '...' : ''}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="text-xs font-medium text-gray-800">{entry.performedBy?.name || 'System'}</span>
                        <p className="text-xs text-gray-400">{entry.performedBy?.role || ''}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[150px] truncate" title={entry.notes || ''}>
                      {entry.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
