'use client';

import { useEffect, useState } from 'react';
import { Calendar, MapPin, Users, Clock, Hash, CheckCircle, XCircle, AlertCircle, MessageSquare, Send, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { formatCurrency, formatDate, formatDateRange } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import GuideQuoteBuilder from '@/components/guide/GuideQuoteBuilder';
import toast from 'react-hot-toast';

interface Booking {
  id: string;
  bookingNumber: string;
  tripType: string;
  status: string;
  numberOfGuests: number;
  baseAmount: number;
  totalAmount: number;
  specialRequests: string | null;
  startDate: string | null;
  endDate: string | null;
  destinationName: string | null;
  meetingPoint: string | null;
  requirements: any;
  packageDetails: any;
  createdAt: string;
  customer: { name: string; email: string; phone: string | null };
  fixedDeparture: {
    startDate: string;
    endDate: string;
    product: { title: string; destination: { name: string } };
  } | null;
}

const statusColors: Record<string, string> = {
  CONFIRMED: 'bg-green-50 text-green-700',
  PENDING: 'bg-amber-50 text-amber-700',
  COMPLETED: 'bg-blue-50 text-blue-700',
  CANCELLED: 'bg-red-50 text-red-700',
  AWAITING_QUOTE: 'bg-purple-50 text-purple-700',
  QUOTE_SENT: 'bg-indigo-50 text-indigo-700',
};

const statusLabels: Record<string, string> = {
  CONFIRMED: 'Confirmed',
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  AWAITING_QUOTE: 'Awaiting Quote',
  QUOTE_SENT: 'Quote Sent',
};

export default function GuideBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedQuote, setExpandedQuote] = useState<string | null>(null);
  const [markingComplete, setMarkingComplete] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/guide/bookings');
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const markAsCompleted = async (bookingId: string) => {
    setMarkingComplete(bookingId);
    try {
      const res = await fetch(`/api/guide/bookings/${bookingId}/complete`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Booking marked as completed!');
      fetchBookings();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update booking');
    } finally {
      setMarkingComplete(null);
    }
  };

  const filteredBookings = filter === 'all'
    ? bookings
    : bookings.filter((b) => b.status === filter);

  // Count bookings by status for badges
  const counts = bookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const awaitingCount = counts['AWAITING_QUOTE'] || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-btg-terracotta"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <p className="text-gray-600 mt-1">Manage your upcoming and past bookings</p>
      </div>

      {/* Alert banner for awaiting quotes */}
      {awaitingCount > 0 && (
        <div className="mb-6 bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center gap-3">
          <MessageSquare className="h-5 w-5 text-purple-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-purple-800">
              {awaitingCount} booking{awaitingCount > 1 ? 's' : ''} awaiting your quote
            </p>
            <p className="text-sm text-purple-600">
              Customers are waiting for your custom package. Click &quot;Send Quote&quot; to respond.
            </p>
          </div>
          <button
            onClick={() => setFilter('AWAITING_QUOTE')}
            className="ml-auto text-sm font-medium text-purple-700 hover:text-purple-900 whitespace-nowrap"
          >
            View All →
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: 'all', label: 'All' },
          { key: 'AWAITING_QUOTE', label: 'Awaiting Quote' },
          { key: 'QUOTE_SENT', label: 'Quote Sent' },
          { key: 'PENDING', label: 'Pending' },
          { key: 'CONFIRMED', label: 'Confirmed' },
          { key: 'COMPLETED', label: 'Completed' },
          { key: 'CANCELLED', label: 'Cancelled' },
        ].map((tab) => {
          const count = tab.key === 'all' ? bookings.length : (counts[tab.key] || 0);
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                filter === tab.key
                  ? 'bg-btg-terracotta text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 ${
                  filter === tab.key ? 'bg-white/20' : 'bg-gray-200'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {filteredBookings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
          <p className="text-gray-600">
            {filter === 'AWAITING_QUOTE'
              ? 'No personal bookings awaiting your quote right now.'
              : 'Your bookings will appear here once customers start booking.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Booking #</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Trip</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Dates</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Guests</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Amount</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBookings.map((booking) => {
                  const dates = booking.fixedDeparture
                    ? { start: booking.fixedDeparture.startDate, end: booking.fixedDeparture.endDate }
                    : { start: booking.startDate, end: booking.endDate };
                  const isAwaitingQuote = booking.status === 'AWAITING_QUOTE';
                  const isQuoteExpanded = expandedQuote === booking.id;
                  const isPastTrip = dates.end && new Date(dates.end) < new Date();

                  return (
                    <>
                      <tr 
                        key={booking.id}
                        className={`hover:bg-gray-50 transition-colors ${isAwaitingQuote ? 'bg-purple-50/50' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-sm font-mono text-gray-700">
                            <Hash className="h-3.5 w-3.5 text-gray-400" />
                            {booking.bookingNumber}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{formatDate(booking.createdAt)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 text-sm">{booking.customer.name}</p>
                          <p className="text-xs text-gray-500">{booking.customer.email}</p>
                          {booking.customer.phone && (
                            <p className="text-xs text-gray-400">{booking.customer.phone}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 text-sm">
                            {booking.fixedDeparture
                              ? booking.fixedDeparture.product.title
                              : 'Personal Booking'}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            {booking.tripType === 'PERSONAL_BOOKING' && (
                              <span className="text-xs bg-btg-sand text-btg-dark px-1.5 py-0.5 rounded">Personal</span>
                            )}
                            {booking.tripType === 'FIXED_DEPARTURE' && (
                              <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">Fixed</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-700">
                            {dates.start && dates.end
                              ? formatDateRange(dates.start, dates.end)
                              : '—'}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Users className="h-3.5 w-3.5 text-gray-400" />
                            <span className="font-medium text-gray-700">{booking.numberOfGuests}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full ${
                              statusColors[booking.status] || 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {statusLabels[booking.status] || booking.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className="font-bold text-btg-terracotta">
                            {booking.totalAmount > 0 ? formatCurrency(booking.totalAmount) : '—'}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* Mark as Completed button for CONFIRMED trips after end date */}
                            {booking.status === 'CONFIRMED' && isPastTrip && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => markAsCompleted(booking.id)}
                                disabled={markingComplete === booking.id}
                              >
                                {markingComplete === booking.id ? (
                                  <span className="animate-spin">⏳</span>
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                              </Button>
                            )}
                            {/* Quote builder toggle for AWAITING_QUOTE */}
                            {isAwaitingQuote && (
                              <Button
                                size="sm"
                                onClick={() => setExpandedQuote(isQuoteExpanded ? null : booking.id)}
                              >
                                <Send className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            {/* View details button */}
                            {(booking.specialRequests || booking.requirements || (booking.status === 'QUOTE_SENT' && booking.packageDetails)) && (
                              <button
                                onClick={() => setExpandedQuote(isQuoteExpanded ? null : booking.id)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                {isQuoteExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {/* Expanded details row */}
                      {isQuoteExpanded && (
                        <tr key={`${booking.id}-details`} className="bg-gray-50">
                          <td colSpan={8} className="px-6 py-4">
                            {/* Personal booking details */}
                            {booking.tripType === 'PERSONAL_BOOKING' && (booking.destinationName || booking.meetingPoint || booking.requirements) && (
                              <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Customer Requirements</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                  {booking.destinationName && (
                                    <div>
                                      <span className="text-gray-500">Destination:</span>{' '}
                                      <span className="font-medium">{booking.destinationName}</span>
                                    </div>
                                  )}
                                  {booking.meetingPoint && (
                                    <div>
                                      <span className="text-gray-500">Pickup:</span>{' '}
                                      <span className="font-medium">{booking.meetingPoint}</span>
                                    </div>
                                  )}
                                </div>
                                {booking.requirements && (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {booking.requirements.food && (
                                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">🍽 Food needed</span>
                                    )}
                                    {booking.requirements.travel && (
                                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">🚗 Travel needed</span>
                                    )}
                                    {booking.requirements.stay && (
                                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">🏨 Stay needed</span>
                                    )}
                                    {booking.requirements.other && (
                                      <p className="text-xs text-gray-600 w-full">Other: {booking.requirements.other}</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {booking.specialRequests && (
                              <div className="mb-4 p-3 bg-amber-50 rounded-lg">
                                <p className="text-xs font-medium text-gray-500 mb-1">Special Requests</p>
                                <p className="text-sm text-gray-700">{booking.specialRequests}</p>
                              </div>
                            )}

                            {/* Quote sent details */}
                            {booking.status === 'QUOTE_SENT' && booking.packageDetails && (
                              <div className="mb-4 p-3 bg-indigo-50 rounded-lg">
                                <p className="text-xs font-semibold text-indigo-600 mb-2">Your Sent Quote</p>
                                <div className="space-y-1">
                                  {(Array.isArray(booking.packageDetails) ? booking.packageDetails : []).map((item: any, i: number) => (
                                    <div key={i} className="flex justify-between text-sm">
                                      <span className="text-gray-700">{item.label}</span>
                                      <span className="font-medium">{formatCurrency(item.amount)}</span>
                                    </div>
                                  ))}
                                  <div className="border-t border-indigo-200 pt-1 mt-1 flex justify-between text-sm font-bold">
                                    <span>Total</span>
                                    <span className="text-btg-terracotta">{formatCurrency(booking.totalAmount)}</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Quote builder for AWAITING_QUOTE */}
                            {isAwaitingQuote && (
                              <GuideQuoteBuilder
                                bookingId={booking.id}
                                booking={booking}
                                onQuoteSent={() => {
                                  setExpandedQuote(null);
                                  fetchBookings();
                                }}
                              />
                            )}
                          </td>
                        </tr>
                      )}
                    </>
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
