'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import {
  ClipboardList, Calendar, MapPin, Star, User,
  Search, Filter, ArrowRight,
} from 'lucide-react';

interface Booking {
  id: string;
  bookingNumber: string;
  tripType: string;
  numberOfGuests: number;
  baseAmount: number;
  totalAmount: number;
  status: string;
  startDate: string | null;
  endDate: string | null;
  destinationName: string | null;
  createdAt: string;
  guide: {
    user: { name: string; image: string | null };
    serviceAreas: { state: { name: string } }[];
  };
  fixedDeparture: {
    product: { title: string; slug: string; coverImage: string | null; destination: { name: string } };
  } | null;
  product: { title: string; slug: string } | null;
  review: { id: string; overallRating: number } | null;
}

const STATUS_CONFIG: Record<string, { variant: 'success' | 'warning' | 'danger' | 'info' | 'outline'; label: string }> = {
  PENDING: { variant: 'warning', label: 'Pending' },
  CONFIRMED: { variant: 'success', label: 'Confirmed' },
  COMPLETED: { variant: 'info', label: 'Completed' },
  CANCELLED: { variant: 'danger', label: 'Cancelled' },
  AWAITING_QUOTE: { variant: 'warning', label: 'Awaiting Quote' },
  QUOTE_SENT: { variant: 'info', label: 'Quote Sent' },
};

export default function CustomerBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (typeFilter) params.set('tripType', typeFilter);
    fetch(`/api/customer/bookings?${params}`)
      .then(r => r.json())
      .then(data => setBookings(data.bookings || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter, typeFilter]);

  const filtered = bookings.filter(b => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.bookingNumber.toLowerCase().includes(q) ||
      b.guide.user.name.toLowerCase().includes(q) ||
      (b.fixedDeparture?.product.title || '').toLowerCase().includes(q) ||
      (b.destinationName || '').toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-heading text-btg-dark">My Bookings</h1>
        <p className="text-gray-600 mt-1">View and manage all your trip bookings</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search bookings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-btg-terracotta/20 focus:border-btg-terracotta"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm">
          <option value="">All Status</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="PENDING">Pending</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="AWAITING_QUOTE">Awaiting Quote</option>
          <option value="QUOTE_SENT">Quote Sent</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm">
          <option value="">All Types</option>
          <option value="FIXED_DEPARTURE">Fixed Departure</option>
          <option value="PERSONAL_BOOKING">Personal Booking</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-btg-terracotta"></div></div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No bookings found</p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 text-sm text-btg-terracotta font-semibold hover:underline"
            >
              Find a guide <ArrowRight className="w-4 h-4" />
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking) => {
            const statusCfg = STATUS_CONFIG[booking.status] || { variant: 'outline' as const, label: booking.status };
            const title = booking.tripType === 'FIXED_DEPARTURE' && booking.fixedDeparture
              ? booking.fixedDeparture.product.title
              : booking.product?.title || `Personal Trip${booking.destinationName ? ` - ${booking.destinationName}` : ''}`;

            return (
              <Link key={booking.id} href={`/dashboard/customer/bookings/${booking.id}`}>
                <Card hover>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-btg-sand flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {booking.fixedDeparture?.product.coverImage ? (
                            <img src={booking.fixedDeparture.product.coverImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <MapPin className="w-6 h-6 text-btg-terracotta" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm truncate">{title}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {booking.bookingNumber} • Guide: {booking.guide.user.name}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            <Badge size="sm" variant={statusCfg.variant}>{statusCfg.label}</Badge>
                            <Badge size="sm" variant="outline">
                              {booking.tripType === 'FIXED_DEPARTURE' ? 'Fixed Departure' : 'Personal'}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              {booking.numberOfGuests} guest{booking.numberOfGuests > 1 ? 's' : ''}
                            </span>
                          </div>
                          {booking.startDate && (
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(new Date(booking.startDate))}
                              {booking.endDate && ` - ${formatDate(new Date(booking.endDate))}`}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-btg-terracotta">{formatCurrency(booking.totalAmount)}</p>
                        {booking.status === 'COMPLETED' && !booking.review && (
                          <span className="text-xs text-amber-600 font-semibold">⭐ Review</span>
                        )}
                        {booking.review && (
                          <div className="flex items-center gap-0.5 justify-end mt-0.5">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span className="text-xs font-bold">{booking.review.overallRating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
