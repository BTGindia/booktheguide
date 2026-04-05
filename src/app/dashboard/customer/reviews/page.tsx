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
  guide: {
    user: { name: string };
  };
  booking: {
    bookingNumber: string;
    tripType: string;
    startDate: string | null;
    endDate: string | null;
  };
}

export default function CustomerReviewsPage() {
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
        <p className="text-gray-600 mt-1">Reviews you've written for guides</p>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
          <p className="text-gray-600">
            Complete a trip to leave a review for your guide
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
                <div>
                  <p className="font-semibold text-gray-900">
                    Guide: {review.guide.user.name}
                  </p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Booking #{review.booking.bookingNumber} •{' '}
                    {review.booking.tripType === 'FIXED_DEPARTURE' ? 'Fixed Departure' : 'Personal Booking'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
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

              {/* Sub ratings */}
              <div className="flex flex-wrap gap-4 mt-4 text-sm">
                {review.knowledgeRating && (
                  <span className="text-gray-600">
                    Knowledge: <strong>{review.knowledgeRating}/5</strong>
                  </span>
                )}
                {review.communicationRating && (
                  <span className="text-gray-600">
                    Communication: <strong>{review.communicationRating}/5</strong>
                  </span>
                )}
                {review.valueForMoneyRating && (
                  <span className="text-gray-600">
                    Value: <strong>{review.valueForMoneyRating}/5</strong>
                  </span>
                )}
                {review.safetyRating && (
                  <span className="text-gray-600">
                    Safety: <strong>{review.safetyRating}/5</strong>
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-500 mt-3">
                Reviewed on {formatDate(review.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
