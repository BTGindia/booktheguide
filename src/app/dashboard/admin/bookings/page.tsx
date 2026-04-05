'use client';

import { useEffect, useState } from 'react';
import { Loader2, ClipboardList, Calendar, Users, DollarSign, Search } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Booking {
  id: string;
  bookingNumber: string;
  tripType: string;
  status: string;
  numberOfGuests: number;
  totalAmount: number;
  commissionAmount: number;
  baseAmount: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  customer: { name: string; email: string };
  guide: { user: { name: string } };
  product?: { title: string } | null;
  fixedDeparture?: { startDate: string; endDate: string; product: { title: string } } | null;
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/admin/bookings')
      .then((r) => r.json())
      .then((data) => setBookings(data.bookings || []))
      .catch(() => toast.error('Failed to load bookings'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-btg-terracotta" />
      </div>
    );
  }

  const statusColor: Record<string, string> = {
    CONFIRMED: 'bg-green-100 text-green-700',
    COMPLETED: 'bg-blue-100 text-blue-700',
    CANCELLED: 'bg-red-100 text-red-700',
    PENDING: 'bg-amber-100 text-amber-700',
    AWAITING_QUOTE: 'bg-purple-100 text-purple-700',
    QUOTE_SENT: 'bg-indigo-100 text-indigo-700',
  };

  const statusLabels: Record<string, string> = {
    CONFIRMED: 'Confirmed',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    PENDING: 'Pending',
    AWAITING_QUOTE: 'Awaiting Quote',
    QUOTE_SENT: 'Quote Sent',
  };

  // Filtering
  const filtered = bookings.filter((b) => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (typeFilter !== 'all' && b.tripType !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const title = b.fixedDeparture?.product?.title || b.product?.title || '';
      if (
        !b.bookingNumber.toLowerCase().includes(q) &&
        !b.customer.name.toLowerCase().includes(q) &&
        !b.guide.user.name.toLowerCase().includes(q) &&
        !title.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalCommission = bookings.reduce((sum, b) => sum + b.commissionAmount, 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-heading text-btg-dark">Bookings</h1>
        <p className="text-gray-600 mt-1">{bookings.length} bookings in your managed states</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-btg-sand rounded-lg flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-btg-terracotta" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
              <p className="text-xs text-gray-500">Total Bookings</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">&#x20B9;{totalRevenue.toLocaleString('en-IN')}</p>
              <p className="text-xs text-gray-500">Total Revenue</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">&#x20B9;{totalCommission.toLocaleString('en-IN')}</p>
              <p className="text-xs text-gray-500">Total Commission</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search bookings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-btg-terracotta/20 focus:border-btg-terracotta"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-btg-terracotta/20"
        >
          <option value="all">All Statuses</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PENDING">Pending</option>
          <option value="AWAITING_QUOTE">Awaiting Quote</option>
          <option value="QUOTE_SENT">Quote Sent</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-btg-terracotta/20"
        >
          <option value="all">All Types</option>
          <option value="FIXED_DEPARTURE">Fixed Departure</option>
          <option value="PERSONAL_BOOKING">Personal Booking</option>
        </select>
        {(statusFilter !== 'all' || typeFilter !== 'all' || search) && (
          <button
            onClick={() => { setStatusFilter('all'); setTypeFilter('all'); setSearch(''); }}
            className="text-sm text-btg-terracotta hover:underline"
          >
            Clear filters
          </button>
        )}
        <span className="text-xs text-gray-500 ml-auto">{filtered.length} of {bookings.length}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No bookings yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Booking</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Guide</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 text-sm">
                      {b.fixedDeparture?.product?.title || b.product?.title || 'Personal Booking'}
                    </p>
                    <p className="text-xs text-gray-400">#{b.bookingNumber}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{b.customer.name}</p>
                    <p className="text-xs text-gray-400">{b.customer.email}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{b.guide.user.name}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">₹{b.totalAmount.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-gray-400">Commission: ₹{b.commissionAmount.toLocaleString('en-IN')}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor[b.status] || 'bg-gray-100 text-gray-700'}`}>
                      {statusLabels[b.status] || b.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(b.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
