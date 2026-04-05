'use client';

import { useEffect, useState } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Review {
  id: string;
  overallRating: number;
  knowledgeRating: number | null;
  communicationRating: number | null;
  valueForMoneyRating: number | null;
  safetyRating: number | null;
  comment: string | null;
  createdAt: string;
  customer: { name: string; image: string | null };
  booking: {
    bookingNumber: string;
    tripType: string;
  };
}

export default function GuideReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/reviews');
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  // Calculate average ratings
  const avgOverall = reviews.length
    ? (reviews.reduce((s, r) => s + r.overallRating, 0) / reviews.length).toFixed(1)
    : '0.0';

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
        <h1 className="text-2xl font-bold text-gray-900">My Reviews</h1>
        <p className="text-gray-600 mt-1">See what customers say about your service</p>
      </div>

      {/* Stats */}
      {reviews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-btg-terracotta">{avgOverall}</p>
            <div className="flex justify-center gap-0.5 my-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.round(parseFloat(avgOverall))
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500">Overall Rating</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{reviews.length}</p>
            <p className="text-xs text-gray-500 mt-2">Total Reviews</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-green-600">
              {reviews.filter((r) => r.overallRating >= 4).length}
            </p>
            <p className="text-xs text-gray-500 mt-2">Positive (4-5★)</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-amber-600">
              {reviews.filter((r) => r.overallRating < 3).length}
            </p>
            <p className="text-xs text-gray-500 mt-2">Needs Improvement</p>
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
          <p className="text-gray-600">
            Reviews will appear here after customers complete their trips
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-btg-sand flex items-center justify-center">
                    <span className="text-sm font-bold text-btg-terracotta">
                      {review.customer.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{review.customer.name}</p>
                    <p className="text-xs text-gray-500">
                      {review.booking.tripType === 'FIXED_DEPARTURE'
                        ? 'Fixed Departure'
                        : 'Personal Booking'}{' '}
                      • {formatDate(review.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < review.overallRating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {review.comment && (
                <p className="text-gray-700 mt-3">{review.comment}</p>
              )}

              <div className="flex flex-wrap gap-4 mt-4 text-sm">
                {review.knowledgeRating && (
                  <span className="bg-gray-50 px-2 py-1 rounded text-gray-600">
                    Knowledge: {review.knowledgeRating}/5
                  </span>
                )}
                {review.communicationRating && (
                  <span className="bg-gray-50 px-2 py-1 rounded text-gray-600">
                    Communication: {review.communicationRating}/5
                  </span>
                )}
                {review.valueForMoneyRating && (
                  <span className="bg-gray-50 px-2 py-1 rounded text-gray-600">
                    Value: {review.valueForMoneyRating}/5
                  </span>
                )}
                {review.safetyRating && (
                  <span className="bg-gray-50 px-2 py-1 rounded text-gray-600">
                    Safety: {review.safetyRating}/5
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
