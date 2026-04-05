'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import {
  ArrowLeft, Calendar, MapPin, User, Phone, Mail,
  Star, ClipboardList, IndianRupee, Users, CheckCircle,
} from 'lucide-react';

export default function CustomerBookingDetailPage() {
  const params = useParams();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/customer/bookings/${params.id}`)
      .then(r => r.json())
      .then(data => setBooking(data.booking))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-btg-terracotta"></div>
      </div>
    );
  }

  if (!booking) {
    return <div className="text-center py-20 text-gray-500">Booking not found</div>;
  }

  const product = booking.tripType === 'FIXED_DEPARTURE'
    ? booking.fixedDeparture?.product
    : booking.product;

  const destination = product?.destination;

  return (
    <div className="max-w-3xl">
      <Link href="/dashboard/customer/bookings" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-btg-terracotta mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Bookings
      </Link>

      {/* Booking Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-btg-dark">
                {product?.title || `Personal Booking${booking.destinationName ? ` - ${booking.destinationName}` : ''}`}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">Booking #{booking.bookingNumber}</p>
            </div>
            <Badge variant={
              booking.status === 'CONFIRMED' ? 'success' :
              booking.status === 'COMPLETED' ? 'info' :
              booking.status === 'CANCELLED' ? 'danger' : 'warning'
            }>
              {booking.status.replace(/_/g, ' ')}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {booking.startDate && (
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>
                  {formatDate(new Date(booking.startDate))}
                  {booking.endDate && ` → ${formatDate(new Date(booking.endDate))}`}
                </span>
              </div>
            )}
            {destination && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{destination.name}{destination.city ? `, ${destination.city.name}` : ''}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="w-4 h-4 text-gray-400" />
              <span>{booking.numberOfGuests} Guest{booking.numberOfGuests > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <ClipboardList className="w-4 h-4 text-gray-400" />
              <span>{booking.tripType === 'FIXED_DEPARTURE' ? 'Fixed Departure' : 'Personal Booking'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Guide Info */}
        <Card>
          <CardContent className="p-6">
            <h2 className="font-bold text-btg-dark mb-4">Your Guide</h2>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-btg-sand flex items-center justify-center overflow-hidden">
                {booking.guide.user.image ? (
                  <img src={booking.guide.user.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-btg-terracotta" />
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{booking.guide.user.name}</p>
                {booking.guide.serviceAreas?.[0]?.state && (
                  <p className="text-xs text-gray-500">{booking.guide.serviceAreas[0].state.name}</p>
                )}
              </div>
            </div>
            <div className="space-y-1.5 text-sm text-gray-600">
              <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-gray-400" /> {booking.guide.user.email}</p>
              {booking.guide.user.phone && (
                <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400" /> {booking.guide.user.phone}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Breakdown */}
        <Card>
          <CardContent className="p-6">
            <h2 className="font-bold text-btg-dark mb-4">Payment Details</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Base Amount</span>
                <span className="font-medium">{formatCurrency(booking.baseAmount)}</span>
              </div>
              {booking.cgstAmount > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>CGST (2.5%)</span>
                  <span>{formatCurrency(booking.cgstAmount)}</span>
                </div>
              )}
              {booking.sgstAmount > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>SGST (2.5%)</span>
                  <span>{formatCurrency(booking.sgstAmount)}</span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span className="text-btg-terracotta">{formatCurrency(booking.totalAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Personal Booking Quote */}
      {booking.tripType === 'PERSONAL_BOOKING' && booking.packageDetails && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="font-bold text-btg-dark mb-4">Guide&apos;s Quote</h2>
            <div className="space-y-2">
              {(Array.isArray(booking.packageDetails) ? booking.packageDetails : []).map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-sm p-2 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">{item.label}{item.unit ? ` (${item.unit})` : ''}</span>
                  <span className="font-medium">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Guest Details */}
      {booking.guestDetails && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="font-bold text-btg-dark mb-4">Guest Details</h2>
            <div className="space-y-2">
              {(Array.isArray(booking.guestDetails) ? booking.guestDetails : []).map((guest: any, i: number) => (
                <div key={i} className="p-2 bg-gray-50 rounded-lg text-sm">
                  <span className="font-medium text-gray-900">Guest {i + 1}: </span>
                  <span className="text-gray-600">{guest.name}{guest.age ? `, Age: ${guest.age}` : ''}{guest.gender ? `, ${guest.gender}` : ''}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Special Requests */}
      {booking.specialRequests && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="font-bold text-btg-dark mb-4">Special Requests</h2>
            <p className="text-sm text-gray-600">{booking.specialRequests}</p>
          </CardContent>
        </Card>
      )}

      {/* Review Section */}
      {booking.status === 'COMPLETED' && !booking.review && (
        <Card className="bg-gradient-to-r from-amber-50 to-amber-50/50 border-amber-200">
          <CardContent className="p-6 text-center">
            <Star className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <h3 className="font-bold text-gray-900 mb-1">Share your experience!</h3>
            <p className="text-sm text-gray-600 mb-4">Help other travelers by reviewing your trip</p>
            <Link
              href={`/dashboard/customer/reviews/new?bookingId=${booking.id}`}
              className="inline-flex items-center gap-2 bg-btg-terracotta text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-btg-dark transition-colors"
            >
              Write a Review
            </Link>
          </CardContent>
        </Card>
      )}

      {booking.review && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <h2 className="font-bold text-btg-dark">Your Review</h2>
            </div>
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map(n => (
                <Star
                  key={n}
                  className={`w-5 h-5 ${n <= booking.review.overallRating ? 'text-amber-500 fill-amber-500' : 'text-gray-200'}`}
                />
              ))}
              <span className="ml-2 text-sm font-bold text-gray-700">{booking.review.overallRating}/5</span>
            </div>
            {booking.review.comment && <p className="text-sm text-gray-600">{booking.review.comment}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
