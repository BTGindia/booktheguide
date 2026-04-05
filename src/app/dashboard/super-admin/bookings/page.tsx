'use client';

import { useEffect, useState } from 'react';
import { Loader2, ClipboardList, Users, DollarSign, Search, TrendingUp, Calendar, Download, MapPin } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
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
  cgstAmount: number;
  sgstAmount: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  customer: { name: string; email: string };
  guide: { user: { name: string } };
  product?: { title: string; activityType: string; destination?: { city?: { state?: { name: string } } } } | null;
  fixedDeparture?: { startDate: string; endDate: string; product: { title: string; activityType: string; destination?: { city?: { state?: { name: string } } } } } | null;
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

export default function SuperAdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  
  // Date range - default to last 30 days
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetch('/api/admin/bookings')
      .then((r) => r.json())
      .then((data) => setBookings(data.bookings || []))
      .catch(() => toast.error('Failed to load bookings'))
      .finally(() => setLoading(false));
  }, []);

  const setDateRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const exportToCSV = () => {
    const rows = [
      ['Booking Number', 'Customer Name', 'Customer Email', 'Title', 'Guide Name', 'Destination', 'Experience Type', 'Total Amount', 'Commission', 'Status', 'Date'].join(','),
    ];
    filtered.forEach((b) => {
      const title = b.fixedDeparture?.product?.title || b.product?.title || 'Personal Booking';
      const destination = b.fixedDeparture?.product?.destination?.city?.state?.name || b.product?.destination?.city?.state?.name || '-';
      const activityType = b.fixedDeparture?.product?.activityType || b.product?.activityType || '-';
      rows.push([
        b.bookingNumber,
        `"${b.customer.name}"`,
        b.customer.email,
        `"${title}"`,
        `"${b.guide.user.name}"`,
        destination,
        activityType,
        b.totalAmount,
        b.commissionAmount,
        b.status,
        new Date(b.createdAt).toLocaleDateString(),
      ].join(','));
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bookings-${startDate}-to-${endDate}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-btg-terracotta" />
      </div>
    );
  }

  // Filter by date range
  const dateFiltered = bookings.filter((b) => {
    const bookingDate = new Date(b.createdAt);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate + 'T23:59:59') : null;
    if (start && bookingDate < start) return false;
    if (end && bookingDate > end) return false;
    return true;
  });

  const totalRevenue = dateFiltered.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalCommission = dateFiltered.reduce((sum, b) => sum + b.commissionAmount, 0);
  const totalGST = dateFiltered.reduce((sum, b) => sum + (b.cgstAmount || 0) + (b.sgstAmount || 0), 0);

  const filtered = dateFiltered.filter((b) => {
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

  return (
    <div>
      <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-btg-dark">All Bookings</h1>
          <p className="text-gray-600">{bookings.length} total bookings across all states</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Date Range:</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setDateRange(7)} className="px-3 py-1.5 text-xs bg-gray-100 rounded-lg hover:bg-gray-200">7 Days</button>
            <button onClick={() => setDateRange(30)} className="px-3 py-1.5 text-xs bg-gray-100 rounded-lg hover:bg-gray-200">30 Days</button>
            <button onClick={() => setDateRange(90)} className="px-3 py-1.5 text-xs bg-gray-100 rounded-lg hover:bg-gray-200">90 Days</button>
            <button onClick={() => setDateRange(365)} className="px-3 py-1.5 text-xs bg-gray-100 rounded-lg hover:bg-gray-200">1 Year</button>
            <button onClick={() => { setStartDate(''); setEndDate(''); }} className="px-3 py-1.5 text-xs bg-gray-100 rounded-lg hover:bg-gray-200">All Time</button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-gray-500">Total Revenue</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalCommission)}</p>
              <p className="text-xs text-gray-500">Commission Earned</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalGST)}</p>
              <p className="text-xs text-gray-500">GST Collected</p>
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
            placeholder="Search by name, guide, booking #..."
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
          <p className="text-gray-500">
            {bookings.length === 0 ? 'No bookings yet' : 'No bookings match your filters'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Booking #</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Guide</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Destination</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Experience</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((b) => {
                  const title = b.fixedDeparture?.product?.title || b.product?.title || 'Personal Booking';
                  const destination = b.fixedDeparture?.product?.destination?.city?.state?.name || b.product?.destination?.city?.state?.name || '-';
                  const activityType = b.fixedDeparture?.product?.activityType || b.product?.activityType || '-';
                  return (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-gray-900">#{b.bookingNumber}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-900">{b.customer.name}</p>
                        <p className="text-xs text-gray-400">{b.customer.email}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-gray-900 max-w-[200px] truncate">{title}</p>
                        <p className="text-xs text-gray-400">{b.tripType === 'FIXED_DEPARTURE' ? 'Fixed' : 'Personal'}</p>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">{b.guide.user.name}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                          {destination}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded">{activityType}</span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(b.totalAmount)}</p>
                        <p className="text-xs text-gray-400">Comm: {formatCurrency(b.commissionAmount)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor[b.status] || 'bg-gray-100 text-gray-700'}`}>
                          {statusLabels[b.status] || b.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">{formatDate(b.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
