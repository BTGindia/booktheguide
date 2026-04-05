'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Star, Send, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Booking {
  id: string;
  bookingNumber: string;
  tripType: string;
  startDate: string;
  endDate: string;
  guide: {
    user: { name: string; image: string | null };
    slug: string;
  };
}

const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

function StarSelector({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {value > 0 && <span className="text-xs text-btg-terracotta font-medium">{ratingLabels[value]}</span>}
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(s => (
          <button
            key={s}
            type="button"
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(s)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={`w-7 h-7 transition-colors ${
                s <= (hovered || value)
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-200'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function WriteReviewPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState('');
  const [ratings, setRatings] = useState({
    overall: 0,
    knowledge: 0,
    communication: 0,
    valueForMoney: 0,
    safety: 0,
  });
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Fetch completed bookings without reviews
    fetch('/api/customer/bookings?status=COMPLETED')
      .then(r => r.json())
      .then(data => {
        // Filter to only completed bookings
        const completed = (data.bookings || []).filter(
          (b: any) => b.status === 'COMPLETED' && !b.review
        );
        setBookings(completed);
      })
      .catch(() => toast.error('Failed to load bookings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) { toast.error('Select a booking to review'); return; }
    if (ratings.overall === 0) { toast.error('Overall rating is required'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: selectedBooking,
          overallRating: ratings.overall,
          knowledgeRating: ratings.knowledge || null,
          communicationRating: ratings.communication || null,
          valueForMoneyRating: ratings.valueForMoney || null,
          safetyRating: ratings.safety || null,
          comment: comment.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      setSubmitted(true);
      toast.success('Review submitted! Thank you.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-btg-terracotta"></div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-btg-dark mb-2">Thank You!</h2>
        <p className="text-gray-600 mb-6">Your review helps guides improve and helps fellow travelers make better decisions.</p>
        <Link href="/dashboard/customer/bookings">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Bookings
          </Button>
        </Link>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-16 h-16 bg-btg-sand rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-btg-terracotta" />
        </div>
        <h2 className="text-xl font-bold text-btg-dark mb-2">No Bookings to Review</h2>
        <p className="text-gray-600 mb-6">You can write reviews once your trips are completed.</p>
        <Link href="/dashboard/customer/bookings">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Bookings
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-heading text-btg-dark">Write a Review</h1>
        <p className="text-gray-600 mt-1">Share your experience with your guide</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Booking Selection */}
        <Card>
          <CardContent className="p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Select Trip</label>
            <div className="space-y-2">
              {bookings.map(b => (
                <label
                  key={b.id}
                  className={`flex items-center gap-4 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedBooking === b.id
                      ? 'border-btg-terracotta bg-orange-50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="booking"
                    value={b.id}
                    checked={selectedBooking === b.id}
                    onChange={() => setSelectedBooking(b.id)}
                    className="sr-only"
                  />
                  <div className="w-10 h-10 bg-btg-sand rounded-xl flex items-center justify-center text-sm font-bold text-btg-terracotta">
                    {b.guide?.user?.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-btg-dark text-sm">{b.bookingNumber}</p>
                    <p className="text-xs text-gray-500">
                      Guide: {b.guide?.user?.name || 'Unknown'} &middot;{' '}
                      {new Date(b.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedBooking === b.id ? 'border-btg-terracotta' : 'border-gray-300'
                  }`}>
                    {selectedBooking === b.id && <div className="w-2.5 h-2.5 rounded-full bg-btg-terracotta" />}
                  </div>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ratings */}
        <Card>
          <CardContent className="p-6 space-y-5">
            <h3 className="font-semibold text-btg-dark">Rate Your Experience</h3>
            <StarSelector
              label="Overall Rating *"
              value={ratings.overall}
              onChange={(v) => setRatings({ ...ratings, overall: v })}
            />
            <div className="border-t border-gray-100 pt-4 space-y-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Detailed Ratings (Optional)</p>
              <StarSelector
                label="Guide Knowledge"
                value={ratings.knowledge}
                onChange={(v) => setRatings({ ...ratings, knowledge: v })}
              />
              <StarSelector
                label="Communication"
                value={ratings.communication}
                onChange={(v) => setRatings({ ...ratings, communication: v })}
              />
              <StarSelector
                label="Value for Money"
                value={ratings.valueForMoney}
                onChange={(v) => setRatings({ ...ratings, valueForMoney: v })}
              />
              <StarSelector
                label="Safety"
                value={ratings.safety}
                onChange={(v) => setRatings({ ...ratings, safety: v })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Comment */}
        <Card>
          <CardContent className="p-6">
            <Textarea
              label="Your Review (Optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your experience — what you enjoyed, what stood out..."
              rows={5}
            />
            <p className="text-xs text-gray-400 mt-1">{comment.length} / 1000 characters</p>
          </CardContent>
        </Card>

        <Button type="submit" isLoading={submitting} className="w-full">
          <Send className="w-4 h-4 mr-2" /> Submit Review
        </Button>
      </form>
    </div>
  );
}
