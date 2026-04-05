'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, X, Save, Loader2, Check, Ban } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { DIFFICULTY_LABELS } from '@/lib/utils';
import { MultiImageUpload } from '@/components/ui/ImageUpload';

interface CancellationRule {
  hours: number;
  refundPercent: number;
}

interface Destination {
  id: string;
  name: string;
  city: { name: string; state: { name: string } };
}

// ---- Smart Inclusions / Exclusions Picker ----
interface PickerItem { label: string; }
interface PickerCategory { name: string; items: PickerItem[]; }

const INCLUSION_CATEGORIES: PickerCategory[] = [
  { name: 'Meals', items: [{ label: 'Breakfast' }, { label: 'Lunch' }, { label: 'Dinner' }, { label: 'Snacks' }, { label: 'Evening Tea / Soup' }] },
  { name: 'Accommodation', items: [{ label: 'Hotel Stay' }, { label: 'Guesthouse' }, { label: 'Camping / Tents' }, { label: 'Homestay' }, { label: 'Dormitory' }] },
  { name: 'Transport', items: [{ label: 'Travel (Meeting Point to Ending Point)' }, { label: 'Local Transport' }, { label: 'Airport / Station Pickup' }, { label: 'Airport / Station Drop' }] },
  { name: 'Permits & Entry', items: [{ label: 'Forest / Park Permits' }, { label: 'Entry Tickets' }, { label: 'Camping Permits' }] },
  { name: 'Equipment & Gear', items: [{ label: 'Trekking Gear' }, { label: 'Sleeping Bags' }, { label: 'Tents' }, { label: 'First Aid Kit' }, { label: 'Safety Equipment' }] },
  { name: 'Guide & Support', items: [{ label: 'Certified Guide' }, { label: 'Support Staff / Porters' }, { label: 'Cook' }] },
  { name: 'Insurance', items: [{ label: 'Travel Insurance' }, { label: 'Medical Insurance' }] },
  { name: 'Others', items: [{ label: 'Drinking Water' }, { label: 'Bonfire / Campfire' }, { label: 'Photography' }] },
];

// Activity types will be loaded from the DB via /api/categories

interface CategoryOption {
  id: string;
  slug: string;
  label: string;
  subCategories: { id: string; name: string; slug: string }[];
}

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loadingDest, setLoadingDest] = useState(true);
  const [customActivityType, setCustomActivityType] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [statesList, setStatesList] = useState<{ id: string; name: string }[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [durationValue, setDurationValue] = useState(3);
  const [durationType, setDurationType] = useState<'days' | 'hours'>('days');
  const [durationNights, setDurationNights] = useState(2);
  const [packageCategory, setPackageCategory] = useState('');
  const [activityType, setActivityType] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState('MODERATE');
  const [minAge, setMinAge] = useState<number | ''>('');
  const [maxAge, setMaxAge] = useState<number | ''>('');
  const [isPetFriendly, setIsPetFriendly] = useState(false);
  const [coverImage, setCoverImage] = useState('');
  const [images, setImages] = useState<string[]>([]);

  // Cancellation Policy (per package)
  const [cancellationRules, setCancellationRules] = useState<CancellationRule[]>([
    { hours: 72, refundPercent: 100 },
    { hours: 48, refundPercent: 50 },
    { hours: 24, refundPercent: 0 },
  ]);

  // Dynamic lists
  const [highlights, setHighlights] = useState<string[]>(['']);
  // Inclusions / Exclusions — driven by smart picker
  const [inclusions, setInclusions] = useState<string[]>([]);
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [customInclusionText, setCustomInclusionText] = useState('');
  const [customExclusionText, setCustomExclusionText] = useState('');
  const [itinerary, setItinerary] = useState('');

  useEffect(() => {
    fetchDestinations();
    fetchStates();
    fetchCategories();
  }, []);

  // Reset destination when state changes
  useEffect(() => {
    setDestinationId('');
  }, [selectedState]);

  // Sync nights with days when duration type is days
  useEffect(() => {
    if (durationType === 'days') {
      setDurationNights(Math.max(0, durationValue - 1));
    }
  }, [durationValue, durationType]);

  // Reset activity type when category changes
  useEffect(() => {
    setActivityType('');
    setCustomActivityType('');
  }, [packageCategory]);

  const fetchDestinations = async () => {
    try {
      const res = await fetch('/api/geography/destinations');
      const data = await res.json();
      setDestinations(data.destinations || []);
    } catch {
      // Destinations not loaded
    } finally {
      setLoadingDest(false);
    }
  };

  const fetchStates = async () => {
    try {
      const res = await fetch('/api/states');
      const data = await res.json();
      setStatesList(data.states || []);
    } catch {
      // States not loaded
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategoryOptions(data.categories || []);
    } catch {
      // Categories not loaded — form still usable with custom input
    }
  };

  // Filter destinations by selected state
  const filteredDestinations = selectedState
    ? destinations.filter((d) => d.city.state.name === selectedState)
    : destinations;

  // Get activity types for the selected category from DB categories
  const selectedCategoryObj = categoryOptions.find((c) => c.slug === packageCategory);
  const activityTypesForCategory: string[] = selectedCategoryObj
    ? selectedCategoryObj.subCategories.map((sc) => sc.name)
    : [];

  const addListItem = (list: string[], setList: (val: string[]) => void) => {
    setList([...list, '']);
  };

  const updateListItem = (list: string[], setList: (val: string[]) => void, index: number, value: string) => {
    const updated = [...list];
    updated[index] = value;
    setList(updated);
  };

  const removeListItem = (list: string[], setList: (val: string[]) => void, index: number) => {
    if (list.length <= 0) return;
    setList(list.filter((_, i) => i !== index));
  };

  const addCustomActivity = () => {
    const text = customActivityType.trim();
    if (!text) return;
    setActivityType(text);
    setCustomActivityType('');
  };

  const updateCancellationRule = (index: number, field: keyof CancellationRule, value: number) => {
    setCancellationRules((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: Math.min(value, field === 'refundPercent' ? 100 : value) };
      return updated;
    });
  };

  // ---- Smart picker helpers ----
  const getItemState = (label: string): 'none' | 'included' | 'excluded' => {
    if (inclusions.includes(label)) return 'included';
    if (exclusions.includes(label)) return 'excluded';
    return 'none';
  };

  const cycleItemState = (label: string) => {
    const state = getItemState(label);
    if (state === 'none') {
      setInclusions((prev) => [...prev, label]);
    } else if (state === 'included') {
      setInclusions((prev) => prev.filter((i) => i !== label));
      setExclusions((prev) => [...prev, label]);
    } else {
      setExclusions((prev) => prev.filter((e) => e !== label));
    }
  };

  const addCustomInclusion = () => {
    const text = customInclusionText.trim();
    if (!text) return;
    if (!inclusions.includes(text)) {
      setInclusions((prev) => [...prev, text]);
    }
    setCustomInclusionText('');
  };

  const addCustomExclusion = () => {
    const text = customExclusionText.trim();
    if (!text) return;
    if (!exclusions.includes(text)) {
      setExclusions((prev) => [...prev, text]);
    }
    setCustomExclusionText('');
  };

  // ---- Prevent Enter from submitting form ----
  const preventEnterSubmit = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
      e.preventDefault();
    }
  };

  const saveAsDraft = async () => {
    if (!title.trim()) { toast.error('Title is required to save draft'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/guide/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          destinationId: destinationId || null,
          durationValue,
          durationType,
          durationDays: durationType === 'days' ? durationValue : null,
          durationNights: durationType === 'days' ? durationNights : null,
          durationHours: durationType === 'hours' ? durationValue : null,
          packageCategory: packageCategory || null,
          activityType: activityType || null,
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
          itinerary: itinerary.trim(),
          saveAsDraft: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Draft saved successfully!');
      router.push('/dashboard/guide/products');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('Title is required'); return; }
    if (!description.trim()) { toast.error('Description is required'); return; }
    if (!destinationId) { toast.error('Please select a destination'); return; }
    if (!packageCategory) { toast.error('Please select an experience category'); return; }
    if (!activityType || activityType === '__custom__') { toast.error('Please select or enter an activity type'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/guide/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          destinationId,
          durationValue,
          durationType,
          durationDays: durationType === 'days' ? durationValue : null,
          durationNights: durationType === 'days' ? durationNights : null,
          durationHours: durationType === 'hours' ? durationValue : null,
          packageCategory,
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
          itinerary: itinerary.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Package submitted for review!');
      router.push('/dashboard/guide/products');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create package');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/dashboard/guide/products"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-btg-terracotta mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create New Tour Package</h1>
        <p className="text-gray-600 mt-1">
          Fill in the details for your tour package. It will be reviewed by a state admin before going live.
        </p>
      </div>

      <form onSubmit={handleSubmit} onKeyDown={preventEnterSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Package Title *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Kedarkantha Summit Trek" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} placeholder="Describe this tour package in detail..." className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
              <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent" required>
                <option value="">Select state first</option>
                {statesList.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destination *</label>
              <select value={destinationId} onChange={(e) => setDestinationId(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent" required disabled={!selectedState}>
                <option value="">{selectedState ? 'Select destination' : 'Select a state first'}</option>
                {filteredDestinations.map((dest) => (
                  <option key={dest.id} value={dest.id}>{dest.name} — {dest.city.name}</option>
                ))}
              </select>
              {selectedState && filteredDestinations.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">No destinations found for this state.</p>
              )}
            </div>
          </div>
        </div>

        {/* Package Images */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Package Images</h2>
          <p className="text-sm text-gray-500 mb-4">Upload destination photos for this package. Select one as the cover photo shown on cards.</p>
          <MultiImageUpload folder="products" values={images} onChange={setImages} coverImage={coverImage} onCoverSelect={setCoverImage} maxImages={8} label="" />
        </div>

        {/* Trip Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Trip Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration *</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  min={1} 
                  max={durationType === 'days' ? 30 : 24} 
                  value={durationValue || ''} 
                  onChange={(e) => setDurationValue(parseInt(e.target.value) || 1)} 
                  placeholder={durationType === 'days' ? '3' : '4'}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent" 
                />
                <select 
                  value={durationType} 
                  onChange={(e) => setDurationType(e.target.value as 'days' | 'hours')}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent bg-white"
                >
                  <option value="days">Days</option>
                  <option value="hours">Hours</option>
                </select>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {durationType === 'days' ? 'For multi-day trips and treks' : 'For short tours, walks, monument visits'}
              </p>
            </div>
            {durationType === 'days' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nights</label>
                <input type="number" value={durationNights} readOnly className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experience Category *</label>
              <select value={packageCategory} onChange={(e) => setPackageCategory(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent">
                <option value="">Select experience category</option>
                {categoryOptions.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>{cat.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Choose the main category for your experience.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type *</label>
              <select 
                value={activityTypesForCategory.includes(activityType) ? activityType : ''} 
                onChange={(e) => setActivityType(e.target.value)} 
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent"
                disabled={!packageCategory}
              >
                <option value="">Select activity type</option>
                {activityTypesForCategory.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
                {packageCategory && <option value="__custom__">+ Add Custom</option>}
              </select>
              {!packageCategory && (
                <p className="text-xs text-amber-600 mt-1">Select an Experience Category first</p>
              )}
              {packageCategory && activityTypesForCategory.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">No predefined types for this category. Use Add Custom.</p>
              )}
            </div>
            {(activityType === '__custom__' || (activityType && !activityTypesForCategory.includes(activityType))) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom Activity Type</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={activityType === '__custom__' ? customActivityType : activityType}
                    onChange={(e) => {
                      if (activityType === '__custom__') {
                        setCustomActivityType(e.target.value);
                      } else {
                        setActivityType(e.target.value);
                      }
                    }}
                    placeholder="Enter custom activity type"
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent"
                  />
                  {activityType === '__custom__' && customActivityType.trim() && (
                    <button 
                      type="button" 
                      onClick={addCustomActivity}
                      className="px-3 py-2.5 bg-btg-terracotta text-white rounded-lg hover:bg-btg-terracotta/90"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty Level *</label>
              <select value={difficultyLevel} onChange={(e) => setDifficultyLevel(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent">
                {Object.entries(DIFFICULTY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Age</label>
              <input type="number" min={1} max={100} value={minAge} onChange={(e) => setMinAge(e.target.value ? parseInt(e.target.value) : '')} placeholder="e.g., 18" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Age</label>
              <input type="number" min={1} max={100} value={maxAge} onChange={(e) => setMaxAge(e.target.value ? parseInt(e.target.value) : '')} placeholder="e.g., 60" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent" />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input 
                type="checkbox" 
                id="isPetFriendly" 
                checked={isPetFriendly} 
                onChange={(e) => setIsPetFriendly(e.target.checked)} 
                className="w-5 h-5 text-btg-terracotta border-gray-300 rounded focus:ring-btg-terracotta/40"
              />
              <label htmlFor="isPetFriendly" className="text-sm font-medium text-gray-700 cursor-pointer">
                Pet-Friendly Trip 🐕
              </label>
            </div>
          </div>
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
                <input type="text" value={item} onChange={(e) => updateListItem(highlights, setHighlights, i, e.target.value)} placeholder="e.g., Summit at 12,500 ft" className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent" />
                <button type="button" onClick={() => removeListItem(highlights, setHighlights, i)} className="p-2.5 text-gray-400 hover:text-red-600"><X className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Itinerary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Itinerary</h2>
          <p className="text-sm text-gray-500 mb-4">
            Describe the tour itinerary, schedule, and activities. You can include day-wise breakdown if applicable.
          </p>
          <textarea 
            value={itinerary} 
            onChange={(e) => setItinerary(e.target.value)} 
            rows={8} 
            placeholder="Example:
Day 1: Arrival at base camp, acclimatization walk, evening briefing
Day 2: Trek to Camp 1 (6 km, 5-6 hours), lunch en route
Day 3: Summit day! Early morning start, return to base camp

Or for shorter tours:
9:00 AM - Meet at main gate
9:30 AM - Begin heritage walk
12:00 PM - Conclude at museum cafe"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-transparent"
          />
        </div>

        {/* ===== Smart Inclusions / Exclusions Picker ===== */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Inclusions &amp; Exclusions</h2>
          <p className="text-sm text-gray-500 mb-5">
            Click an item to mark it as <span className="text-emerald-600 font-medium">Included</span>.
            Click again to mark as <span className="text-red-500 font-medium">Excluded</span>.
            Click once more to remove.
          </p>

          <div className="space-y-5">
            {INCLUSION_CATEGORIES.map((cat) => (
              <div key={cat.name}>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">{cat.name}</h3>
                <div className="flex flex-wrap gap-2">
                  {cat.items.map((item) => {
                    const state = getItemState(item.label);
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => cycleItemState(item.label)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                          state === 'included'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700 ring-1 ring-emerald-200'
                            : state === 'excluded'
                              ? 'bg-red-50 border-red-300 text-red-700 ring-1 ring-red-200'
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300'
                        }`}
                      >
                        {state === 'included' && <Check className="h-3.5 w-3.5" />}
                        {state === 'excluded' && <Ban className="h-3.5 w-3.5" />}
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Summary + custom additions */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Included summary */}
            <div>
              <h3 className="text-sm font-semibold text-emerald-700 mb-2 flex items-center gap-1">
                <Check className="h-4 w-4" /> Included ({inclusions.length})
              </h3>
              <div className="space-y-1.5 mb-3">
                {inclusions.length === 0 && <p className="text-xs text-gray-400 italic">No items included yet</p>}
                {inclusions.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-emerald-700">
                    <Check className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="flex-1">{item}</span>
                    <button type="button" onClick={() => setInclusions((prev) => prev.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customInclusionText}
                  onChange={(e) => setCustomInclusionText(e.target.value)}
                  placeholder="Add custom inclusion..."
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-300/40 focus:border-transparent"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomInclusion(); } }}
                />
                <button type="button" onClick={addCustomInclusion} className="px-3 py-1.5 text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Excluded summary */}
            <div>
              <h3 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-1">
                <Ban className="h-4 w-4" /> Excluded ({exclusions.length})
              </h3>
              <div className="space-y-1.5 mb-3">
                {exclusions.length === 0 && <p className="text-xs text-gray-400 italic">No items excluded yet</p>}
                {exclusions.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-red-600">
                    <Ban className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="flex-1">{item}</span>
                    <button type="button" onClick={() => setExclusions((prev) => prev.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customExclusionText}
                  onChange={(e) => setCustomExclusionText(e.target.value)}
                  placeholder="Add custom exclusion..."
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-300/40 focus:border-transparent"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomExclusion(); } }}
                />
                <button type="button" onClick={addCustomExclusion} className="px-3 py-1.5 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Cancellation Policy */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Cancellation Policy</h2>
              <p className="text-sm text-gray-500">Define refund rules for this package (max 100% refund cap)</p>
            </div>
            <button type="button" onClick={() => setCancellationRules((prev) => [...prev, { hours: 12, refundPercent: 0 }])} className="text-sm text-btg-terracotta hover:text-btg-terracotta flex items-center gap-1"><Plus className="h-4 w-4" /> Add Rule</button>
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
                  <button type="button" onClick={() => setCancellationRules((prev) => prev.filter((_, idx) => idx !== i))} className="ml-auto text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Link href="/dashboard/guide/products" className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancel</Link>
          <button 
            type="button" 
            onClick={saveAsDraft}
            disabled={loading} 
            className="flex items-center gap-2 px-6 py-3 border border-btg-terracotta text-btg-terracotta rounded-lg hover:bg-btg-terracotta/10 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            Save as Draft
          </button>
          <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-3 bg-btg-terracotta text-white rounded-lg hover:bg-btg-terracotta disabled:opacity-50 transition-colors">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            Submit for Review
          </button>
        </div>
      </form>
    </div>
  );
}
