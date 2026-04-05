'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Plus, X } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { DIFFICULTY_LABELS } from '@/lib/utils';
import { MultiImageUpload } from '@/components/ui/ImageUpload';

interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  meals: string;
  accommodation: string;
}

interface CancellationRule {
  hours: number;
  refundPercent: number;
}

interface Destination {
  id: string;
  name: string;
  city: { name: string; state: { name: string } };
}

const SPECIALIZATION_TO_ACTIVITY: Record<string, string> = {
  'Trekking': 'TREK',
  'City Tour': 'CITY_TOUR',
  'Hill Station': 'HILL_STATION',
  'Pilgrimage': 'PILGRIMAGE',
  'Wildlife Safari': 'WILDLIFE_SAFARI',
  'Adventure Sport': 'ADVENTURE_SPORT',
  'Cultural Tour': 'CULTURAL_TOUR',
  'Food Tour': 'FOOD_TOUR',
  'Photography Tour': 'PHOTOGRAPHY_TOUR',
  'Mountaineering': 'TREK',
  'Camping': 'TREK',
  'Rafting': 'ADVENTURE_SPORT',
  'Skiing': 'ADVENTURE_SPORT',
  'Rock Climbing': 'ADVENTURE_SPORT',
  'Pet Friendly': 'PET_FRIENDLY',
};

const ACTIVITY_LABEL_MAP: Record<string, string> = {
  'TREK': 'Trek',
  'CITY_TOUR': 'City Tour',
  'HILL_STATION': 'Hill Station',
  'PILGRIMAGE': 'Pilgrimage',
  'WILDLIFE_SAFARI': 'Wildlife Safari',
  'ADVENTURE_SPORT': 'Adventure Sport',
  'CULTURAL_TOUR': 'Cultural Tour',
  'FOOD_TOUR': 'Food Tour',
  'PHOTOGRAPHY_TOUR': 'Photography Tour',
  'PET_FRIENDLY': 'Pet Friendly',
  'OTHER': 'Other',
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [guideSpecializations, setGuideSpecializations] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState('');
  const [statesList, setStatesList] = useState<{ id: string; name: string }[]>([]);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [durationDays, setDurationDays] = useState(3);
  const [durationNights, setDurationNights] = useState(2);
  const [activityType, setActivityType] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState('MODERATE');
  const [isPetFriendly, setIsPetFriendly] = useState(false);
  const [minAge, setMinAge] = useState<number | ''>('');
  const [maxAge, setMaxAge] = useState<number | ''>('');
  const [coverImage, setCoverImage] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [cancellationRules, setCancellationRules] = useState<CancellationRule[]>([
    { hours: 72, refundPercent: 100 },
    { hours: 48, refundPercent: 50 },
    { hours: 24, refundPercent: 0 },
  ]);
  const [highlights, setHighlights] = useState<string[]>(['']);
  const [inclusions, setInclusions] = useState<string[]>(['']);
  const [exclusions, setExclusions] = useState<string[]>(['']);
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);

  useEffect(() => {
    Promise.all([fetchProduct(), fetchDestinations(), fetchGuideProfile(), fetchStates()]).finally(() => setLoading(false));
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/guide/products/${productId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const p = data.product;

      setTitle(p.title || '');
      setDescription(p.description || '');
      setDestinationId(p.destinationId || '');
      setDurationDays(p.durationDays || 3);
      setDurationNights(p.durationNights || 2);
      setActivityType(p.activityType || '');
      setDifficultyLevel(p.difficultyLevel || 'MODERATE');
      setIsPetFriendly(p.isPetFriendly || false);
      setMinAge(p.minAge ?? '');
      setMaxAge(p.maxAge ?? '');
      setCoverImage(p.coverImage || '');
      setImages(p.images || []);
      setHighlights(p.highlights?.length ? p.highlights : ['']);
      setInclusions(p.inclusions?.length ? p.inclusions : ['']);
      setExclusions(p.exclusions?.length ? p.exclusions : ['']);

      // Parse cancellation policy
      try {
        const cp = typeof p.cancellationPolicy === 'string' ? JSON.parse(p.cancellationPolicy) : p.cancellationPolicy;
        if (Array.isArray(cp) && cp.length > 0) setCancellationRules(cp);
      } catch {}

      // Parse itinerary
      try {
        const it = typeof p.itinerary === 'string' ? JSON.parse(p.itinerary) : p.itinerary;
        if (Array.isArray(it) && it.length > 0) setItinerary(it);
        else {
          const days: ItineraryDay[] = [];
          for (let i = 1; i <= (p.durationDays || 3); i++) {
            days.push({ day: i, title: '', description: '', meals: '', accommodation: '' });
          }
          setItinerary(days);
        }
      } catch {
        const days: ItineraryDay[] = [];
        for (let i = 1; i <= (p.durationDays || 3); i++) {
          days.push({ day: i, title: '', description: '', meals: '', accommodation: '' });
        }
        setItinerary(days);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load product');
    }
  };

  const fetchDestinations = async () => {
    try {
      const res = await fetch('/api/geography/destinations');
      const data = await res.json();
      setDestinations(data.destinations || []);
    } catch {}
  };

  const fetchStates = async () => {
    try {
      const res = await fetch('/api/states');
      const data = await res.json();
      setStatesList(data.states || []);
    } catch {}
  };

  // Set initial state from loaded destination
  useEffect(() => {
    if (destinationId && destinations.length > 0 && !selectedState) {
      const dest = destinations.find(d => d.id === destinationId);
      if (dest) setSelectedState(dest.city.state.name);
    }
  }, [destinationId, destinations]);

  const filteredDestinations = selectedState
    ? destinations.filter((d) => d.city.state.name === selectedState)
    : destinations;

  const fetchGuideProfile = async () => {
    try {
      const res = await fetch('/api/guide/profile');
      const data = await res.json();
      if (data.profile?.specializations) {
        setGuideSpecializations(data.profile.specializations);
      }
    } catch {}
  };

  const availableActivities = (() => {
    const activities = new Set<string>();
    guideSpecializations.forEach(spec => {
      const activity = SPECIALIZATION_TO_ACTIVITY[spec];
      if (activity) activities.add(activity);
    });
    activities.add('OTHER');
    return Array.from(activities);
  })();

  useEffect(() => {
    setDurationNights(Math.max(0, durationDays - 1));
    setItinerary((prev) => {
      if (prev.length < durationDays) {
        const newDays: ItineraryDay[] = [];
        for (let i = prev.length + 1; i <= durationDays; i++) {
          newDays.push({ day: i, title: '', description: '', meals: '', accommodation: '' });
        }
        return [...prev, ...newDays];
      }
      return prev.slice(0, durationDays);
    });
  }, [durationDays]);

  const addListItem = (list: string[], setList: (val: string[]) => void) => setList([...list, '']);
  const updateListItem = (list: string[], setList: (val: string[]) => void, i: number, v: string) => {
    const u = [...list]; u[i] = v; setList(u);
  };
  const removeListItem = (list: string[], setList: (val: string[]) => void, i: number) => {
    if (list.length <= 1) return;
    setList(list.filter((_, idx) => idx !== i));
  };

  const updateItinerary = (index: number, field: keyof ItineraryDay, value: string) => {
    setItinerary((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const updateCancellationRule = (index: number, field: keyof CancellationRule, value: number) => {
    setCancellationRules((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: Math.min(value, field === 'refundPercent' ? 100 : value) };
      return updated;
    });
  };

  const isLastDay = (index: number) => index === itinerary.length - 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('Title is required'); return; }
    if (!description.trim()) { toast.error('Description is required'); return; }

    setSaving(true);
    try {
      const res = await fetch(`/api/guide/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          destinationId,
          durationDays,
          durationNights,
          activityType,
          difficultyLevel,
          isPetFriendly,
          minAge: minAge !== '' ? minAge : null,
          maxAge: maxAge !== '' ? maxAge : null,
          coverImage: coverImage.trim(),
          images: images.filter(Boolean),
          highlights: highlights.filter((h) => h.trim()),
          inclusions: inclusions.filter((i) => i.trim()),
          exclusions: exclusions.filter((e) => e.trim()),
          cancellationPolicy: cancellationRules,
          itinerary: itinerary.map((d, idx) => ({
            ...d,
            title: d.title.trim(),
            description: d.description.trim(),
            accommodation: idx === itinerary.length - 1 ? '' : d.accommodation,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Package updated & resubmitted for review!');
      router.push('/dashboard/guide/products');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update package');
    } finally {
      setSaving(false);
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
        <Link href="/dashboard/guide/products" className="inline-flex items-center gap-2 text-gray-600 hover:text-btg-terracotta mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Products
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Tour Package</h1>
        <p className="text-gray-600 mt-1">Update your package details. Changes will be resubmitted for admin review.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Package Title *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <select value={selectedState} onChange={(e) => { setSelectedState(e.target.value); setDestinationId(''); }} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent">
                <option value="">Select state first</option>
                {statesList.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
              <select value={destinationId} onChange={(e) => setDestinationId(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent" disabled={!selectedState}>
                <option value="">{selectedState ? 'Select destination' : 'Select a state first'}</option>
                {filteredDestinations.map((dest) => (
                  <option key={dest.id} value={dest.id}>{dest.name} — {dest.city.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Package Images</h2>
          <MultiImageUpload folder="products" values={images} onChange={setImages} coverImage={coverImage} onCoverSelect={setCoverImage} maxImages={8} label="" />
        </div>

        {/* Trip Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Trip Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Days)</label>
              <input type="number" min={1} max={30} value={durationDays || ''} onChange={(e) => setDurationDays(parseInt(e.target.value) || 0)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nights</label>
              <input type="number" value={durationNights} readOnly className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
              <select value={activityType} onChange={(e) => setActivityType(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent">
                <option value="">Select</option>
                {availableActivities.map((key) => (
                  <option key={key} value={key}>{ACTIVITY_LABEL_MAP[key] || key}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select value={difficultyLevel} onChange={(e) => setDifficultyLevel(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent">
                {Object.entries(DIFFICULTY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Age</label>
              <input type="number" min={1} max={100} value={minAge} onChange={(e) => setMinAge(e.target.value ? parseInt(e.target.value) : '')} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Age</label>
              <input type="number" min={1} max={100} value={maxAge} onChange={(e) => setMaxAge(e.target.value ? parseInt(e.target.value) : '')} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent" />
            </div>
          </div>

          {guideSpecializations.includes('Pet Friendly') && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={isPetFriendly} onChange={(e) => setIsPetFriendly(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-btg-terracotta focus:ring-btg-terracotta/40" />
                <div>
                  <span className="font-medium text-gray-900">🐾 Pet Friendly Trip</span>
                  <p className="text-xs text-gray-600 mt-0.5">Pet pricing can be set when scheduling departures.</p>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Highlights */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Highlights</h2>
            <button type="button" onClick={() => addListItem(highlights, setHighlights)} className="text-sm text-btg-terracotta hover:text-btg-terracotta flex items-center gap-1"><Plus className="h-4 w-4" /> Add</button>
          </div>
          <div className="space-y-3">
            {highlights.map((item, i) => (
              <div key={i} className="flex gap-2">
                <input type="text" value={item} onChange={(e) => updateListItem(highlights, setHighlights, i, e.target.value)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent" />
                <button type="button" onClick={() => removeListItem(highlights, setHighlights, i)} className="p-2.5 text-gray-400 hover:text-red-600"><X className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Itinerary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Day-by-Day Itinerary</h2>
          <div className="space-y-6">
            {itinerary.map((day, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-btg-terracotta mb-3">
                  Day {day.day}
                  {isLastDay(i) && <span className="text-xs text-gray-500 ml-2">(Last day — no accommodation)</span>}
                </h3>
                <div className="space-y-3">
                  <input type="text" value={day.title} onChange={(e) => updateItinerary(i, 'title', e.target.value)} placeholder="Day title" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent" />
                  <textarea value={day.description} onChange={(e) => updateItinerary(i, 'description', e.target.value)} rows={3} placeholder="Day description" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent" />
                  <div className={`grid ${isLastDay(i) ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
                    <input type="text" value={day.meals} onChange={(e) => updateItinerary(i, 'meals', e.target.value)} placeholder="Meals included" className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent" />
                    {!isLastDay(i) && <input type="text" value={day.accommodation} onChange={(e) => updateItinerary(i, 'accommodation', e.target.value)} placeholder="Accommodation" className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inclusions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">What&apos;s Included</h2>
            <button type="button" onClick={() => addListItem(inclusions, setInclusions)} className="text-sm text-btg-terracotta hover:text-btg-terracotta flex items-center gap-1"><Plus className="h-4 w-4" /> Add</button>
          </div>
          <div className="space-y-3">
            {inclusions.map((item, i) => (
              <div key={i} className="flex gap-2">
                <input type="text" value={item} onChange={(e) => updateListItem(inclusions, setInclusions, i, e.target.value)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent" />
                <button type="button" onClick={() => removeListItem(inclusions, setInclusions, i)} className="p-2.5 text-gray-400 hover:text-red-600"><X className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Exclusions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">What&apos;s Not Included</h2>
            <button type="button" onClick={() => addListItem(exclusions, setExclusions)} className="text-sm text-btg-terracotta hover:text-btg-terracotta flex items-center gap-1"><Plus className="h-4 w-4" /> Add</button>
          </div>
          <div className="space-y-3">
            {exclusions.map((item, i) => (
              <div key={i} className="flex gap-2">
                <input type="text" value={item} onChange={(e) => updateListItem(exclusions, setExclusions, i, e.target.value)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent" />
                <button type="button" onClick={() => removeListItem(exclusions, setExclusions, i)} className="p-2.5 text-gray-400 hover:text-red-600"><X className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Cancellation Policy */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Cancellation Policy</h2>
              <p className="text-sm text-gray-500">Max 100% refund cap</p>
            </div>
            <button type="button" onClick={() => setCancellationRules((p) => [...p, { hours: 12, refundPercent: 0 }])} className="text-sm text-btg-terracotta hover:text-btg-terracotta flex items-center gap-1"><Plus className="h-4 w-4" /> Add Rule</button>
          </div>
          <div className="space-y-3">
            {cancellationRules.map((rule, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600 whitespace-nowrap">If cancelled</span>
                <input type="number" value={rule.hours} onChange={(e) => updateCancellationRule(i, 'hours', Number(e.target.value))} min={1} className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-btg-terracotta/40" />
                <span className="text-sm text-gray-600 whitespace-nowrap">hrs before →</span>
                <input type="number" value={rule.refundPercent} onChange={(e) => updateCancellationRule(i, 'refundPercent', Number(e.target.value))} min={0} max={100} className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-btg-terracotta/40" />
                <span className="text-sm text-gray-600">% refund</span>
                {cancellationRules.length > 1 && (
                  <button type="button" onClick={() => setCancellationRules((p) => p.filter((_, idx) => idx !== i))} className="ml-auto text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Link href="/dashboard/guide/products" className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancel</Link>
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-btg-terracotta text-white rounded-lg hover:bg-btg-terracotta disabled:opacity-50 transition-colors">
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
