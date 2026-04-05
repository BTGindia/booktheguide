'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Building2, GraduationCap, CheckCircle, Clock, Users,
  Phone, Mail, Calendar, MapPin, Search,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';

interface Inquiry {
  id: string;
  organizationType: string;
  organizationName: string;
  contactName: string;
  officialEmail: string;
  phone: string;
  groupSize: number;
  approxDays: number;
  additionalNotes: string | null;
  isResolved: boolean;
  createdAt: string;
  preferredState: { name: string } | null;
}

export default function AdminCorporateInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterResolved, setFilterResolved] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterResolved) params.set('resolved', filterResolved);
      const res = await fetch(`/api/admin/corporate-inquiries?${params}`);
      const data = await res.json();
      setInquiries(data.inquiries || []);
    } catch { toast.error('Failed to load inquiries'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInquiries(); }, [filterResolved]);

  const toggleResolved = async (inquiry: Inquiry) => {
    try {
      const res = await fetch('/api/admin/corporate-inquiries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: inquiry.id, isResolved: !inquiry.isResolved }),
      });
      if (!res.ok) throw new Error();
      toast.success(inquiry.isResolved ? 'Marked as pending' : 'Marked as resolved');
      fetchInquiries();
    } catch { toast.error('Failed to update'); }
  };

  const filtered = inquiries.filter(i =>
    !searchQuery ||
    i.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.contactName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-heading text-btg-dark">Corporate Inquiries</h1>
        <p className="text-gray-600 mt-1">Group trip inquiries for your state</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{inquiries.length}</p><p className="text-xs text-gray-500">Total</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">{inquiries.filter(i => !i.isResolved).length}</p><p className="text-xs text-gray-500">Pending</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{inquiries.filter(i => i.isResolved).length}</p><p className="text-xs text-gray-500">Resolved</p></CardContent></Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search organizations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-btg-terracotta/20 focus:border-btg-terracotta"
          />
        </div>
        <select value={filterResolved} onChange={(e) => setFilterResolved(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm">
          <option value="">All</option>
          <option value="false">Pending</option>
          <option value="true">Resolved</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-btg-terracotta"></div></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-gray-500">No inquiries found for your state.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((inquiry) => (
            <Card key={inquiry.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${inquiry.organizationType === 'corporate' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                      {inquiry.organizationType === 'corporate' ? <Building2 className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm">{inquiry.organizationName}</h3>
                        <Badge size="sm" variant={inquiry.isResolved ? 'success' : 'warning'}>
                          {inquiry.isResolved ? 'Resolved' : 'Pending'}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 space-y-0.5">
                        <p>{inquiry.contactName} • {inquiry.officialEmail} • {inquiry.phone}</p>
                        <p>{inquiry.groupSize} people • {inquiry.approxDays} days{inquiry.preferredState ? ` • ${inquiry.preferredState.name}` : ''}</p>
                        <p className="text-gray-400">{formatDate(new Date(inquiry.createdAt))}</p>
                      </div>
                      {inquiry.additionalNotes && (
                        <p className="text-xs text-gray-500 mt-1 bg-gray-50 p-2 rounded">{inquiry.additionalNotes}</p>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant={inquiry.isResolved ? 'outline' : 'primary'} onClick={() => toggleResolved(inquiry)}>
                    {inquiry.isResolved ? 'Reopen' : 'Resolve'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
