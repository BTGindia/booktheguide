'use client';

import { useEffect, useState } from 'react';
import { Calendar, MapPin, Users, Plus, Loader2, Clock, X, Eye } from 'lucide-react';
import { formatCurrency, formatDate, formatDateRange } from '@/lib/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  title: string;
  durationDays: number;
  isPetFriendly: boolean;
  destination: {
    name: string;
    city: { name: string; state: { name: string } };
  };
}

interface PricingTier {
  type: string;
  label: string;
  price: number;
}

interface PetPricing {
  personWithoutPet: number;
  personWithOnePet: number;
  perAdditionalPet: number;
}

interface Departure {
  id: string;
  startDate: string;
  endDate: string;
  totalSeats: number;
  bookedSeats: number;
  pricePerPerson: number;
  meetingPoint: string;
  endingPoint?: string;
  meetingTime: string;
  notes: string | null;
  isActive: boolean;
  approvalStatus: string;
  reviewNotes?: string;
  maxGroupSize?: number;
  minGroupSize?: number;
  genderPolicy?: string;
  pricingTiers?: PricingTier[];
  petPricing?: PetPricing;
  product: Product;
  bookings: { id: string; bookingNumber: string; status: string; numberOfGuests: number }[];
}

const GENDER_POLICIES = [
  { value: 'MIXED', label: 'Mixed (Everyone welcome)' },
  { value: 'FEMALE_ONLY', label: 'Female Only' },
  { value: 'MALE_ONLY', label: 'Male Only' },
  { value: 'COUPLES_ONLY', label: 'Couples Only' },
  { value: 'SOLO_ONLY', label: 'Solo Only' },
];

const DEFAULT_PRICING_TIERS: PricingTier[] = [
  { type: 'privateRoom', label: 'Private Room', price: 0 },
  { type: 'dormBed', label: 'Dormitory', price: 0 },
  { type: 'doubleSharing', label: 'Double / Twin / Couple Sharing', price: 0 },
  { type: 'tripleSharing', label: 'Triple Sharing', price: 0 },
  { type: 'quadSharing', label: 'Quad Sharing', price: 0 },
];

export default function GuideDeparturesPage() {
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'pending' | 'past'>('upcoming');

  // Form state
  const [productId, setProductId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [totalSeats, setTotalSeats] = useState(15);
  const [meetingPoint, setMeetingPoint] = useState('');
  const [endingPoint, setEndingPoint] = useState('');
  const [meetingTime, setMeetingTime] = useState('06:00');
  const [notes, setNotes] = useState('');
  const [minGroupSize, setMinGroupSize] = useState(1);
  const [maxGroupSize, setMaxGroupSize] = useState(15);
  const [genderPolicy, setGenderPolicy] = useState('MIXED');
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>(
    DEFAULT_PRICING_TIERS.map((t) => ({ ...t }))
  );
  const [petPricing, setPetPricing] = useState<PetPricing>({
    personWithoutPet: 0,
    personWithOnePet: 0,
    perAdditionalPet: 0,
  });

  const selectedProduct = products.find((p) => p.id === productId);
  const computedEndDate = (() => {
    if (!startDate || !selectedProduct) return '';
    const d = new Date(startDate);
    d.setDate(d.getDate() + selectedProduct.durationDays - 1);
    return d.toISOString().split('T')[0];
  })();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [deptRes, prodRes] = await Promise.all([
        fetch('/api/guide/departures'),
        fetch('/api/guide/products'),
      ]);
      const deptData = await deptRes.json();
      const prodData = await prodRes.json();
      setDepartures(deptData.departures || []);
      const approvedProducts = (prodData.products || []).filter(
        (p: any) => p.status === 'APPROVED'
      );
      setProducts(approvedProducts);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const updatePricingTier = (index: number, price: number) => {
    setPricingTiers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], price };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) { toast.error('Select a product'); return; }
    if (!startDate) { toast.error('Set start date'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/guide/departures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          startDate,
          totalSeats,
          pricePerPerson: 0,
          meetingPoint,
          endingPoint: endingPoint.trim() || null,
          meetingTime,
          notes: notes.trim() || null,
          minGroupSize,
          maxGroupSize,
          genderPolicy,
          pricingTiers: pricingTiers.filter((t) => t.price > 0),
          petPricing: selectedProduct?.isPetFriendly ? petPricing : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Fixed departure created!');
      setShowForm(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create departure');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setProductId('');
    setStartDate('');
    setTotalSeats(15);
    setMeetingPoint('');
    setEndingPoint('');
    setMeetingTime('06:00');
    setNotes('');
    setMinGroupSize(1);
    setMaxGroupSize(15);
    setGenderPolicy('MIXED');
    setPricingTiers(DEFAULT_PRICING_TIERS.map((t) => ({ ...t })));
    setPetPricing({ personWithoutPet: 0, personWithOnePet: 0, perAdditionalPet: 0 });
  };

  const upcomingDepartures = departures.filter((d) => new Date(d.startDate) > new Date() && d.approvalStatus === 'APPROVED');
  const pendingDepartures = departures.filter((d) => d.approvalStatus === 'PENDING_APPROVAL');
  const pastDepartures = departures.filter((d) => new Date(d.startDate) <= new Date());

  const getFilteredDepartures = () => {
    switch (activeTab) {
      case 'upcoming': return upcomingDepartures;
      case 'pending': return pendingDepartures;
      case 'past': return pastDepartures;
      default: return upcomingDepartures;
    }
  };

  const filteredDepartures = getFilteredDepartures();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-btg-terracotta"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fixed Departures</h1>
          <p className="text-gray-600 mt-1">Schedule group trips with fixed dates and seats</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-btg-terracotta text-white px-4 py-2 rounded-lg hover:bg-btg-terracotta transition-colors"
        >
          <Plus className="h-5 w-5" />
          Schedule Departure
        </button>
      </div>

      {products.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-amber-800 text-sm">
            You need at least one <strong>approved</strong> tour package to create fixed departures.
            Create a package first and wait for admin approval.
          </p>
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule New Departure</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Package & Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tour Package *</label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40"
                  required
                >
                  <option value="">Select an approved package</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} — {p.destination.name} ({p.durationDays} days)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date (Auto)</label>
                <input
                  type="date"
                  value={computedEndDate}
                  readOnly
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                />
                {selectedProduct && (
                  <p className="text-xs text-gray-500 mt-1">Auto-calculated: {selectedProduct.durationDays} days from start date</p>
                )}
              </div>
            </div>

            {/* Group Size & Gender */}
            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Group Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Group Size</label>
                  <input
                    type="number"
                    min={1}
                    value={minGroupSize}
                    onChange={(e) => setMinGroupSize(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Group Size / Total Seats</label>
                  <input
                    type="number"
                    min={1}
                    value={maxGroupSize}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setMaxGroupSize(val);
                      setTotalSeats(val);
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender Policy</label>
                  <select
                    value={genderPolicy}
                    onChange={(e) => setGenderPolicy(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40"
                  >
                    {GENDER_POLICIES.map((gp) => (
                      <option key={gp.value} value={gp.value}>{gp.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Meeting & Ending Points */}
            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Meeting Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Point</label>
                  <input
                    type="text"
                    value={meetingPoint}
                    onChange={(e) => setMeetingPoint(e.target.value)}
                    placeholder="e.g., Dehradun Railway Station"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ending Point</label>
                  <input
                    type="text"
                    value={endingPoint}
                    onChange={(e) => setEndingPoint(e.target.value)}
                    placeholder="e.g., Dehradun Railway Station"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Time</label>
                  <input
                    type="time"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40"
                  />
                </div>
              </div>
            </div>

            {/* Pricing Tiers */}
            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-1">Pricing Tiers</h3>
              <p className="text-xs text-gray-500 mb-3">Set price per person based on accommodation/stay type. Leave at 0 if not applicable.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pricingTiers.map((tier, i) => (
                  <div key={tier.type} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700 flex-1">{tier.label}</span>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-500">₹</span>
                      <input
                        type="number"
                        min={0}
                        value={tier.price || ''}
                        onChange={(e) => updatePricingTier(i, parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="w-28 pl-7 pr-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-btg-terracotta/40"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pet Pricing */}
            {selectedProduct?.isPetFriendly && (
              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-1">🐾 Pet Pricing</h3>
                <p className="text-xs text-gray-500 mb-3">This package is pet-friendly. Set pet-specific pricing.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Person without pet (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={petPricing.personWithoutPet || ''}
                      onChange={(e) => setPetPricing((prev) => ({ ...prev, personWithoutPet: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-btg-terracotta/40"
                    />
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Person with 1 pet (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={petPricing.personWithOnePet || ''}
                      onChange={(e) => setPetPricing((prev) => ({ ...prev, personWithOnePet: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-btg-terracotta/40"
                    />
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Per additional pet (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={petPricing.perAdditionalPet || ''}
                      onChange={(e) => setPetPricing((prev) => ({ ...prev, perAdditionalPet: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-btg-terracotta/40"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="border-t border-gray-100 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Special instructions for this departure..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); resetForm(); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 bg-btg-terracotta text-white rounded-lg hover:bg-btg-terracotta disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Departure
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: 'upcoming', label: 'Upcoming', count: upcomingDepartures.length },
          { key: 'pending', label: 'Pending Approval', count: pendingDepartures.length },
          { key: 'past', label: 'Past', count: pastDepartures.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-btg-terracotta text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
            <span className="ml-2 text-xs">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Departures List */}
      <div>
        {filteredDepartures.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Calendar className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">
              {activeTab === 'upcoming' && 'No upcoming departures scheduled'}
              {activeTab === 'pending' && 'No departures pending approval'}
              {activeTab === 'past' && 'No past departures'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDepartures.map((dept) => (
              <DepartureCard key={dept.id} departure={dept} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DepartureCard({ departure }: { departure: Departure }) {
  const remaining = departure.totalSeats - departure.bookedSeats;
  const fillPct = (departure.bookedSeats / departure.totalSeats) * 100;
  const isPast = new Date(departure.startDate) <= new Date();
  const isPendingApproval = departure.approvalStatus === 'PENDING_APPROVAL';
  const isRejected = departure.approvalStatus === 'REJECTED';

  const genderLabel = departure.genderPolicy
    ? { MIXED: 'Mixed', FEMALE_ONLY: 'Female Only', MALE_ONLY: 'Male Only', COUPLES_ONLY: 'Couples Only', SOLO_ONLY: 'Solo Only' }[departure.genderPolicy] || departure.genderPolicy
    : null;

  return (
    <div className={`bg-white rounded-xl border p-5 hover:shadow-md transition-shadow ${isRejected ? 'border-red-200' : isPendingApproval ? 'border-amber-200' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{departure.product.title}</h3>
          <p className="text-sm text-gray-600 mt-1">
            <MapPin className="h-3.5 w-3.5 inline mr-1" />
            {departure.product.destination.name} • {departure.product.destination.city.name},{' '}
            {departure.product.destination.city.state.name}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              isRejected ? 'bg-red-50 text-red-700' : isPendingApproval ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
            }`}
          >
            {isRejected ? '❌ Rejected' : isPendingApproval ? '⏳ Pending Approval' : '✅ Approved'}
          </span>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              isPast ? 'bg-gray-100 text-gray-600' : remaining === 0 ? 'bg-red-50 text-red-700' : remaining <= 3 ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
            }`}
          >
            {isPast ? 'Completed' : remaining === 0 ? 'Full' : `${remaining} seats left`}
          </span>
        </div>
      </div>

      {departure.reviewNotes && isRejected && (
        <div className="mt-3 text-sm text-red-700 bg-red-50 p-3 rounded-lg">
          <strong>Admin feedback:</strong> {departure.reviewNotes}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-600">
        <span className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4" />
          {formatDateRange(departure.startDate, departure.endDate)}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          {departure.meetingTime}
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="h-4 w-4" />
          {departure.bookedSeats}/{departure.totalSeats} booked
        </span>
        {genderLabel && (
          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
            {genderLabel}
          </span>
        )}
      </div>

      {/* Pricing tiers display */}
      {departure.pricingTiers && departure.pricingTiers.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {departure.pricingTiers.map((tier: PricingTier) => (
            <span key={tier.type} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md">
              {tier.label}: {formatCurrency(tier.price)}
            </span>
          ))}
        </div>
      )}

      {/* Booking progress bar */}
      <div className="mt-3">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              fillPct >= 100 ? 'bg-red-500' : fillPct >= 70 ? 'bg-amber-500' : 'bg-btg-terracotta'
            }`}
            style={{ width: `${Math.min(fillPct, 100)}%` }}
          />
        </div>
      </div>

      {departure.meetingPoint && (
        <p className="text-xs text-gray-500 mt-2">
          Meeting: {departure.meetingPoint}
          {departure.endingPoint && ` → End: ${departure.endingPoint}`}
        </p>
      )}

      {/* View Bookings link */}
      {departure.bookings && departure.bookings.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <Link 
            href="/dashboard/guide/bookings"
            className="inline-flex items-center gap-1.5 text-sm text-btg-terracotta hover:text-btg-dark transition-colors"
          >
            <Eye className="h-4 w-4" />
            View {departure.bookings.length} booking{departure.bookings.length > 1 ? 's' : ''}
          </Link>
        </div>
      )}
    </div>
  );
}
