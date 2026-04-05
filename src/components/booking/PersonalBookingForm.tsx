'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, Calendar, Users, CheckCircle, AlertCircle, MapPin, FileText, Mail, Phone, UserCircle, Utensils, Car, Building } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  guide: any;
}

export default function PersonalBookingForm({ guide }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [meetingPoint, setMeetingPoint] = useState('');
  const [destinationName, setDestinationName] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [requirements, setRequirements] = useState({
    food: false,
    travel: false,
    stay: false,
    other: '',
  });
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Guest contact info (when not logged in)
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const isLoggedIn = !!session?.user;

  // Check availability when dates change
  useEffect(() => {
    if (startDate && endDate) {
      checkAvailability();
    } else {
      setIsAvailable(null);
    }
  }, [startDate, endDate]);

  const checkAvailability = async () => {
    setCheckingAvailability(true);
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Fetch availability for the month range
      const months = new Set<string>();
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        months.add(`${d.getFullYear()}-${d.getMonth() + 1}`);
      }

      let allAvail: any[] = [];
      for (const m of Array.from(months)) {
        const [year, month] = m.split('-');
        const res = await fetch(
          `/api/guide/availability/check?guideId=${guide.id}&year=${year}&month=${month}`
        );
        const data = await res.json();
        allAvail = [...allAvail, ...(data.availability || [])];
      }

      // Check if all dates in range are available
      let available = true;
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const avail = allAvail.find(
          (a: any) => new Date(a.date).toISOString().split('T')[0] === dateStr
        );
        if (avail && !avail.isAvailable) {
          available = false;
          break;
        }
      }

      setIsAvailable(available);
    } catch {
      setIsAvailable(null);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAvailable) {
      toast.error('Guide is not available for selected dates');
      return;
    }

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

    setLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guideId: guide.id,
          tripType: 'PERSONAL_BOOKING',
          startDate,
          endDate,
          numberOfGuests,
          meetingPoint: meetingPoint.trim() || null,
          destinationName: destinationName.trim() || null,
          requirements,
          specialRequests: specialRequests.trim() || null,
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
      toast.success('Request submitted!');
    } catch (error: any) {
      toast.error(error.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
        <p className="text-gray-600 mb-2">
          Your booking number is{' '}
          <span className="font-heading font-medium text-btg-terracotta">{success}</span>
        </p>
        <p className="text-sm text-gray-500 mb-6">
          {isLoggedIn
            ? `${guide.user.name} will review your request and send you a custom quote with pricing. You can accept or negotiate the quote from your dashboard.`
            : `${guide.user.name} will review your request and send you a custom quote. A confirmation has been sent to ${guestEmail}. You can log in later with this email to track your booking.`}
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
            Explore More
          </button>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Guest Contact Info (when not logged in) */}
      {!isLoggedIn && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-btg-terracotta" />
            Your Contact Details
          </h3>
          <p className="text-sm text-gray-500 mb-4">No account needed &mdash; just enter your email to request a booking.</p>
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

      {/* How it works banner */}
      <div className="bg-btg-cream border border-btg-sand rounded-xl p-4">
        <h3 className="font-semibold text-btg-dark mb-2 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          How Personal Booking Works
        </h3>
        <ol className="text-sm text-btg-terracotta space-y-1 list-decimal list-inside">
          <li>You submit your trip details and requirements below</li>
          <li>The guide reviews your request and creates a custom package with pricing</li>
          <li>You review the quote and confirm or negotiate</li>
          <li>Once accepted, the booking is confirmed</li>
        </ol>
      </div>

      {/* Date Selection */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-btg-terracotta" />
          Travel Dates
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={today}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || today}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent"
            />
          </div>
        </div>

        {/* Availability Status */}
        {checkingAvailability && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking availability...
          </div>
        )}

        {isAvailable === true && !checkingAvailability && (
          <div className="mt-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 px-4 py-2 rounded-lg">
            <CheckCircle className="h-4 w-4" />
            Guide is available for these dates!
          </div>
        )}

        {isAvailable === false && !checkingAvailability && (
          <div className="mt-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 px-4 py-2 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            Guide is not available for some of these dates. Try different dates.
          </div>
        )}
      </div>

      {/* Trip Details */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-btg-terracotta" />
          Trip Details
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Where do you want to go?</label>
            <input
              type="text"
              value={destinationName}
              onChange={(e) => setDestinationName(e.target.value)}
              placeholder="e.g., Kedarkantha Trek, Mussoorie sightseeing..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meeting / Pickup Point</label>
            <input
              type="text"
              value={meetingPoint}
              onChange={(e) => setMeetingPoint(e.target.value)}
              placeholder="e.g., Dehradun Railway Station, Delhi Airport..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Number of guests */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-btg-terracotta" />
          Number of People
        </h3>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setNumberOfGuests(Math.max(1, numberOfGuests - 1))}
            className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-lg font-medium"
          >
            -
          </button>
          <span className="text-2xl font-bold text-gray-900 w-12 text-center">
            {numberOfGuests}
          </span>
          <button
            type="button"
            onClick={() => setNumberOfGuests(numberOfGuests + 1)}
            className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-lg font-medium"
          >
            +
          </button>
        </div>
      </div>

      {/* Requirements */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">What do you need arranged?</h3>
        <p className="text-sm text-gray-500 mb-3">Select what you'd like the guide to include in the package (this affects pricing)</p>
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              checked={requirements.food}
              onChange={(e) => setRequirements((p) => ({ ...p, food: e.target.checked }))}
              className="w-4 h-4 rounded text-btg-terracotta focus:ring-btg-terracotta/40"
            />
            <span className="text-sm font-medium text-gray-700 inline-flex items-center gap-1.5"><Utensils className="w-4 h-4" /> Food / Meals</span>
          </label>
          <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              checked={requirements.travel}
              onChange={(e) => setRequirements((p) => ({ ...p, travel: e.target.checked }))}
              className="w-4 h-4 rounded text-btg-terracotta focus:ring-btg-terracotta/40"
            />
            <span className="text-sm font-medium text-gray-700 inline-flex items-center gap-1.5"><Car className="w-4 h-4" /> Travel / Transport</span>
          </label>
          <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              checked={requirements.stay}
              onChange={(e) => setRequirements((p) => ({ ...p, stay: e.target.checked }))}
              className="w-4 h-4 rounded text-btg-terracotta focus:ring-btg-terracotta/40"
            />
            <span className="text-sm font-medium text-gray-700 inline-flex items-center gap-1.5"><Building className="w-4 h-4" /> Stay / Accommodation</span>
          </label>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Other requirements</label>
            <input
              type="text"
              value={requirements.other}
              onChange={(e) => setRequirements((p) => ({ ...p, other: e.target.value }))}
              placeholder="e.g., Photography, Equipment rental..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Special Requests */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Additional Notes (Optional)</h3>
        <textarea
          value={specialRequests}
          onChange={(e) => setSpecialRequests(e.target.value)}
          rows={3}
          placeholder="Dietary requirements, medical conditions, fitness level, specific places you want to visit..."
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !isAvailable || checkingAvailability}
        className="w-full flex items-center justify-center gap-2 py-4 bg-btg-terracotta text-white rounded-xl text-lg font-semibold hover:bg-btg-terracotta disabled:opacity-50 transition-colors"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          'Submit Booking Request'
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        No payment required now. The guide will send you a custom quote which you can review before confirming.
      </p>
    </form>
  );
}
