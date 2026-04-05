'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, Save, Star, Trash2, Plus,
  Shield, ShieldCheck, MapPin, Package, Calendar, User, Edit3, MessageSquare,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  customer: { name: string; email: string };
}

interface Product {
  id: string;
  title: string;
  status: string;
  activityType: string;
  durationDays: number;
  destination: { name: string; city: { name: string; state: { name: string } } };
  _count: { bookings: number };
}

interface Guide {
  id: string;
  slug: string;
  bio: string | null;
  tagline: string | null;
  experienceYears: number | null;
  totalTrips: number;
  averageRating: number;
  totalReviews: number;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  user: { name: string; email: string; image: string | null; phone: string | null; createdAt: string };
  serviceAreas: { state: { name: string } }[];
  products: Product[];
  reviews: Review[];
}

export default function AdminGuideDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [guide, setGuide] = useState<Guide | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit fields
  const [bio, setBio] = useState('');
  const [tagline, setTagline] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [totalTrips, setTotalTrips] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [joinedDate, setJoinedDate] = useState('');

  // New review
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [addingReview, setAddingReview] = useState(false);

  useEffect(() => {
    fetchGuide();
  }, [id]);

  const fetchGuide = async () => {
    try {
      const res = await fetch(`/api/admin/guides/${id}`);
      const data = await res.json();
      if (data.guide) {
        setGuide(data.guide);
        setBio(data.guide.bio || '');
        setTagline(data.guide.tagline || '');
        setExperienceYears(data.guide.experienceYears || 0);
        setTotalTrips(data.guide.totalTrips || 0);
        setAverageRating(data.guide.averageRating || 0);
        setJoinedDate(data.guide.createdAt?.split('T')[0] || '');
      }
    } catch {
      toast.error('Failed to load guide');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/guides/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio,
          tagline,
          experienceYears,
          totalTrips,
          averageRating,
          createdAt: joinedDate,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Guide updated successfully');
      fetchGuide();
    } catch {
      toast.error('Failed to update guide');
    } finally {
      setSaving(false);
    }
  };

  const toggleVerification = async () => {
    try {
      const res = await fetch(`/api/admin/guides/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified: !guide?.isVerified }),
      });
      if (!res.ok) throw new Error();
      toast.success(guide?.isVerified ? 'Verification removed' : 'Guide verified!');
      fetchGuide();
    } catch {
      toast.error('Action failed');
    }
  };

  const addReview = async () => {
    if (!newComment.trim()) {
      toast.error('Please write a review comment');
      return;
    }
    setAddingReview(true);
    try {
      const res = await fetch(`/api/admin/guides/${id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: newRating, comment: newComment }),
      });
      if (!res.ok) throw new Error();
      toast.success('Review added');
      setNewComment('');
      setNewRating(5);
      fetchGuide();
    } catch {
      toast.error('Failed to add review');
    } finally {
      setAddingReview(false);
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!confirm('Delete this review? This will recalculate the guide rating.')) return;
    try {
      const res = await fetch(`/api/admin/guides/${id}/reviews?reviewId=${reviewId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error();
      toast.success('Review deleted');
      fetchGuide();
    } catch {
      toast.error('Failed to delete review');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-btg-terracotta" />
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Guide not found</p>
        <Link href="/dashboard/admin/guides" className="text-btg-terracotta hover:underline mt-2 inline-block">
          Back to guides
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/admin/guides"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-btg-terracotta mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Guides
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-btg-sand rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-btg-terracotta">
                {guide.user.name.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{guide.user.name}</h1>
              <p className="text-gray-500">{guide.user.email}</p>
            </div>
          </div>
          <button
            onClick={toggleVerification}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              guide.isVerified
                ? 'bg-red-50 text-red-700 hover:bg-red-100'
                : 'bg-green-50 text-green-700 hover:bg-green-100'
            }`}
          >
            {guide.isVerified ? <ShieldCheck className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
            {guide.isVerified ? 'Remove Verification' : 'Verify Guide'}
          </button>
        </div>
      </div>

      {/* Location */}
      {guide.serviceAreas.length > 0 && (
        <div className="flex items-center gap-2 mb-6 text-sm text-gray-600">
          <MapPin className="w-4 h-4 text-btg-terracotta" />
          {guide.serviceAreas.map((a) => a.state.name).join(', ')}

        </div>
      )}

      {/* Editable Profile Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-btg-terracotta" />
            Edit Guide Profile
          </h2>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-btg-terracotta text-white rounded-lg hover:bg-btg-terracotta disabled:opacity-50 text-sm font-medium transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label>
            <input
              type="number"
              min={0}
              value={experienceYears}
              onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Trips</label>
            <input
              type="number"
              min={0}
              value={totalTrips}
              onChange={(e) => setTotalTrips(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Average Rating</label>
            <input
              type="number"
              min={0}
              max={5}
              step={0.1}
              value={averageRating}
              onChange={(e) => setAverageRating(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Joined Date</label>
            <input
              type="date"
              value={joinedDate}
              onChange={(e) => setJoinedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent text-sm"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Reviews Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-btg-terracotta" />
          Reviews ({guide.reviews.length})
        </h2>

        {/* Add Review Form */}
        <div className="border border-dashed border-gray-300 rounded-lg p-4 mb-4 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Add New Review</h3>
          <div className="flex items-center gap-3 mb-3">
            <label className="text-sm text-gray-600">Rating:</label>
            <select
              value={newRating}
              onChange={(e) => setNewRating(parseInt(e.target.value))}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-btg-terracotta/40"
            >
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>{'★'.repeat(r)}{'☆'.repeat(5 - r)} ({r})</option>
              ))}
            </select>
          </div>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            placeholder="Write a review comment..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent mb-3"
          />
          <button
            onClick={addReview}
            disabled={addingReview}
            className="flex items-center gap-2 px-4 py-2 bg-btg-terracotta text-white rounded-lg hover:bg-btg-terracotta disabled:opacity-50 text-sm font-medium"
          >
            {addingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add Review
          </button>
        </div>

        {/* Existing Reviews */}
        {guide.reviews.length === 0 ? (
          <p className="text-sm text-gray-500">No reviews yet</p>
        ) : (
          <div className="space-y-3">
            {guide.reviews.map((review) => (
              <div key={review.id} className="flex items-start justify-between border border-gray-100 rounded-lg p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">by {review.customer.name}</span>
                    <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-700">{review.comment}</p>
                </div>
                <button
                  onClick={() => deleteReview(review.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete review"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Products */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-btg-terracotta" />
          Packages ({guide.products.length})
        </h2>

        {guide.products.length === 0 ? (
          <p className="text-sm text-gray-500">No packages created yet</p>
        ) : (
          <div className="space-y-3">
            {guide.products.map((product) => (
              <div key={product.id} className="flex items-center justify-between border border-gray-100 rounded-lg p-4">
                <div>
                  <p className="font-medium text-gray-900">{product.title}</p>
                  <p className="text-xs text-gray-500">
                    {product.destination.name}, {product.destination.city.state.name} • {product.durationDays} days • {product.activityType.replace('_', ' ')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">{product._count.bookings} bookings</span>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      product.status === 'APPROVED'
                        ? 'bg-green-50 text-green-700'
                        : product.status === 'PENDING_REVIEW'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {product.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
