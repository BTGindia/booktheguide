'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, Users, CheckCircle, Mail, Phone, UserCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Props {
  departure: any;
  remaining: number;
}

export default function FixedDepartureBookingForm({ departure, remaining }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [guestDetails, setGuestDetails] = useState<{ name: string; age: string; gender: string }[]>([
    { name: '', age: '', gender: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // Guest contact info (only needed when not logged in)
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const isLoggedIn = !!session?.user;

  // Update guest details array when number changes
  const handleGuestCountChange = (count: number) => {
    const newCount = Math.min(count, remaining);
    setNumberOfGuests(newCount);
    const details = [...guestDetails];
    while (details.length < newCount) {
      details.push({ name: '', age: '', gender: '' });
    }
    setGuestDetails(details.slice(0, newCount));
  };

  const updateGuest = (index: number, field: string, value: string) => {
    const updated = [...guestDetails];
    updated[index] = { ...updated[index], [field]: value };
    setGuestDetails(updated);
  };

  const totalAmount = departure.pricePerPerson * numberOfGuests;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate guest contact if not logged in
    if (!isLoggedIn) {
      if (!guestEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
        toast.error('Please enter a valid email address');
        return;
      }
      if (!guestName.trim()) {
        toast.error('Please enter your name');
        return;
      }
    }

    // Validate guest details
    for (let i = 0; i < numberOfGuests; i++) {
      if (!guestDetails[i]?.name?.trim()) {
        toast.error(`Please enter name for Guest ${i + 1}`);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guideId: departure.product.guideId,
          tripType: 'FIXED_DEPARTURE',
          fixedDepartureId: departure.id,
          numberOfGuests,
          specialRequests: specialRequests.trim() || null,
          guestDetails: guestDetails.slice(0, numberOfGuests),
          ...(!isLoggedIn && {
            guestEmail: guestEmail.trim(),
            guestName: guestName.trim(),
            guestPhone: guestPhone.trim() || null,
          }),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(data.bookingNumber);
      toast.success('Booking confirmed!');
    } catch (error: any) {
      toast.error(error.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
        <p className="text-gray-600 mb-4">
          Your booking number is{' '}
          <span className="font-heading font-medium text-btg-terracotta">{success}</span>
        </p>
        <p className="text-sm text-gray-500 mb-6">
          {isLoggedIn
            ? 'You will receive a confirmation email with all the details.'
            : `A confirmation has been sent to ${guestEmail}. You can log in later with this email to view your bookings.`}
        </p>
        <div className="flex gap-4 justify-center">
          {isLoggedIn && (
            <button
              onClick={() => router.push('/dashboard/customer')}
              className="px-6 py-3 bg-btg-terracotta text-white rounded-lg hover:bg-btg-terracotta transition-colors"
            >
              View My Bookings
            </button>
          )}
          <button
            onClick={() => router.push('/search')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Explore More Trips
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Guest Contact Info (when not logged in) */}
      {!isLoggedIn && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-btg-terracotta" />
            Your Contact Details
          </h3>
          <p className="text-sm text-gray-500 mb-4">No account needed &mdash; just enter your email to book.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Your full name"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Number of guests */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-btg-terracotta" />
          Number of Guests
        </h3>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => handleGuestCountChange(Math.max(1, numberOfGuests - 1))}
            className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-lg font-medium"
          >
            -
          </button>
          <span className="text-2xl font-bold text-gray-900 w-12 text-center">
            {numberOfGuests}
          </span>
          <button
            type="button"
            onClick={() => handleGuestCountChange(numberOfGuests + 1)}
            disabled={numberOfGuests >= remaining}
            className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-lg font-medium disabled:opacity-50"
          >
            +
          </button>
          <span className="text-sm text-gray-500">Max {remaining} seats available</span>
        </div>
      </div>

      {/* Guest Details */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Guest Details</h3>
        <div className="space-y-4">
          {Array.from({ length: numberOfGuests }).map((_, i) => (
            <div key={i} className="border border-gray-100 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Guest {i + 1} {i === 0 && '(Primary)'}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={guestDetails[i]?.name || ''}
                  onChange={(e) => updateGuest(i, 'name', e.target.value)}
                  placeholder="Full Name *"
                  required
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent"
                />
                <input
                  type="number"
                  value={guestDetails[i]?.age || ''}
                  onChange={(e) => updateGuest(i, 'age', e.target.value)}
                  placeholder="Age"
                  min={5}
                  max={80}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent"
                />
                <select
                  value={guestDetails[i]?.gender || ''}
                  onChange={(e) => updateGuest(i, 'gender', e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent"
                >
                  <option value="">Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Special Requests */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Special Requests (Optional)</h3>
        <textarea
          value={specialRequests}
          onChange={(e) => setSpecialRequests(e.target.value)}
          rows={3}
          placeholder="Any dietary requirements, medical conditions, or special needs..."
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent"
        />
      </div>

      {/* Price Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Price Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">
              {formatCurrency(departure.pricePerPerson)} &times; {numberOfGuests} guest{numberOfGuests > 1 ? 's' : ''}
            </span>
            <span className="font-medium">{formatCurrency(totalAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Platform fee</span>
            <span className="text-green-600 font-medium">Included</span>
          </div>
          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-btg-terracotta">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-4 bg-btg-terracotta text-white rounded-xl text-lg font-semibold hover:bg-btg-terracotta disabled:opacity-50 transition-colors"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          'Confirm Booking'
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        By confirming, you agree to the guide&apos;s cancellation policy and our Terms of Service.
      </p>
    </form>
  );
}
