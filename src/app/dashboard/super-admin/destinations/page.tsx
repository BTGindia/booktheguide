'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Globe, Plus, Loader2, Search, MapPin, Mountain, ChevronDown, ChevronRight,
  Edit2, Trash2, X, Check,
  Building2, Map as MapIcon,
  Package, AlertTriangle, Eye, EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/Badge';
import { ACTIVITY_LABELS } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────

interface DestinationData {
  id: string;
  name: string;
  description: string | null;
  altitude: number | null;
  bestMonths: string[];
  openMonths: string[];
  avoidMonths: string[];
  coverImage: string | null;
  images: string[];
  isActive: boolean;
  productCount: number;
  approvedProductCount: number;
  activityTypes: string[];
}

interface CityData {
  id: string;
  name: string;
  isActive: boolean;
  destinationCount: number;
  productCount: number;
  activityTypes: string[];
  destinations: DestinationData[];
}

interface StateData {
  id: string;
  name: string;
  code: string;
  isNorthIndia: boolean;
  commissionPercent: number;
  isActive: boolean;
  cityCount: number;
  destinationCount: number;
  productCount: number;
  activityTypes: string[];
  cities: CityData[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ─── Main Component ──────────────────────────────────────────────────

export default function SuperAdminDestinationsPage() {
  const [hierarchy, setHierarchy] = useState<StateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalSearch, setGlobalSearch] = useState('');

  // Expand tracking
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set());
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set());

  // Modals
  const [showStateModal, setShowStateModal] = useState(false);
  const [editingState, setEditingState] = useState<StateData | null>(null);
  const [showDestModal, setShowDestModal] = useState(false);
  const [editingDest, setEditingDest] = useState<DestinationData | null>(null);
  const [destModalCityId, setDestModalCityId] = useState('');
  const [destModalCityName, setDestModalCityName] = useState('');
  const [destModalStateName, setDestModalStateName] = useState('');

  // Inline city add
  const [addingCityForState, setAddingCityForState] = useState<string | null>(null);
  const [newCityName, setNewCityName] = useState('');

  // Inline city edit
  const [editingCityId, setEditingCityId] = useState<string | null>(null);
  const [editingCityName, setEditingCityName] = useState('');

  // Delete confirmations
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'state' | 'city' | 'destination'; id: string; name: string } | null>(null);

  // Submitting state
  const [submitting, setSubmitting] = useState(false);

  // ─── Fetch Data ──────────────────────────────────────────────

  const fetchHierarchy = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/destinations/hierarchy');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setHierarchy(data.hierarchy || []);
    } catch {
      toast.error('Failed to load hierarchy');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHierarchy();
  }, [fetchHierarchy]);

  // ─── Search Filtering ────────────────────────────────────────

  const filteredHierarchy = useMemo(() => {
    if (!globalSearch.trim()) return hierarchy;
    const q = globalSearch.toLowerCase();

    return hierarchy
      .map((state) => {
        const stateMatch = state.name.toLowerCase().includes(q) || state.code.toLowerCase().includes(q);

        const filteredCities = state.cities
          .map((city) => {
            const cityMatch = city.name.toLowerCase().includes(q);

            const filteredDests = city.destinations.filter(
              (d) =>
                d.name.toLowerCase().includes(q) ||
                d.activityTypes.some((t) => (ACTIVITY_LABELS[t] || t).toLowerCase().includes(q))
            );

            if (cityMatch || filteredDests.length > 0) {
              return { ...city, destinations: cityMatch ? city.destinations : filteredDests };
            }
            return null;
          })
          .filter(Boolean) as CityData[];

        if (stateMatch || filteredCities.length > 0) {
          return { ...state, cities: stateMatch ? state.cities : filteredCities };
        }
        return null;
      })
      .filter(Boolean) as StateData[];
  }, [hierarchy, globalSearch]);

  // Auto-expand when searching
  useEffect(() => {
    if (globalSearch.trim()) {
      const stateIds = new Set<string>();
      const cityIds = new Set<string>();
      filteredHierarchy.forEach((s) => {
        stateIds.add(s.id);
        s.cities.forEach((c) => cityIds.add(c.id));
      });
      setExpandedStates(stateIds);
      setExpandedCities(cityIds);
    }
  }, [filteredHierarchy, globalSearch]);

  // ─── Toggle Helpers ──────────────────────────────────────────

  const toggleState = (id: string) => {
    setExpandedStates((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCity = (id: string) => {
    setExpandedCities((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ─── State CRUD ──────────────────────────────────────────────

  const handleSaveState = async (formData: { name: string; code: string; isNorthIndia: boolean; commissionPercent: number }) => {
    setSubmitting(true);
    try {
      const method = editingState ? 'PUT' : 'POST';
      const body = editingState ? { id: editingState.id, ...formData } : formData;
      const res = await fetch('/api/admin/manage/states', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(editingState ? 'State updated' : 'State created');
      setShowStateModal(false);
      setEditingState(null);
      await fetchHierarchy();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save state');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStateActive = async (state: StateData) => {
    try {
      const res = await fetch('/api/admin/manage/states', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: state.id, isActive: !state.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`State ${state.isActive ? 'deactivated' : 'activated'}`);
      await fetchHierarchy();
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle state');
    }
  };

  const handleDeleteState = async (id: string) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/manage/states?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('State deleted');
      setDeleteConfirm(null);
      await fetchHierarchy();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete state');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── City CRUD ───────────────────────────────────────────────

  const handleAddCity = async (stateId: string) => {
    if (!newCityName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/manage/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCityName.trim(), stateId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('City added');
      setAddingCityForState(null);
      setNewCityName('');
      await fetchHierarchy();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add city');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveCityEdit = async (cityId: string) => {
    if (!editingCityName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/manage/cities', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cityId, name: editingCityName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('City updated');
      setEditingCityId(null);
      setEditingCityName('');
      await fetchHierarchy();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update city');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleCityActive = async (city: CityData) => {
    try {
      const res = await fetch('/api/admin/manage/cities', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: city.id, isActive: !city.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`City ${city.isActive ? 'deactivated' : 'activated'}`);
      await fetchHierarchy();
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle city');
    }
  };

  const handleDeleteCity = async (id: string) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/manage/cities?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('City deleted');
      setDeleteConfirm(null);
      await fetchHierarchy();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete city');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Destination CRUD ────────────────────────────────────────

  const handleSaveDestination = async (formData: {
    name: string;
    description: string;
    altitude: string;
    bestMonths: string[];
    openMonths: string[];
    avoidMonths: string[];
  }) => {
    setSubmitting(true);
    try {
      const method = editingDest ? 'PUT' : 'POST';
      const body = editingDest
        ? { id: editingDest.id, ...formData, cityId: destModalCityId }
        : { ...formData, cityId: destModalCityId };
      const res = await fetch('/api/admin/destinations', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(editingDest ? 'Destination updated' : 'Destination created');
      setShowDestModal(false);
      setEditingDest(null);
      await fetchHierarchy();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save destination');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleDestActive = async (dest: DestinationData) => {
    try {
      const res = await fetch('/api/admin/destinations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: dest.id, isActive: !dest.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Destination ${dest.isActive ? 'deactivated' : 'activated'}`);
      await fetchHierarchy();
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle destination');
    }
  };

  const handleDeleteDest = async (id: string) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/destinations?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Destination deleted');
      setDeleteConfirm(null);
      await fetchHierarchy();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete destination');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Summary Stats ───────────────────────────────────────────

  const stats = useMemo(() => {
    const totalStates = hierarchy.length;
    let totalCities = 0;
    let totalDestinations = 0;
    let totalProducts = 0;
    hierarchy.forEach((s) => {
      totalCities += s.cityCount;
      totalDestinations += s.destinationCount;
      totalProducts += s.productCount;
    });
    return { totalStates, totalCities, totalDestinations, totalProducts };
  }, [hierarchy]);

  // ─── Render ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-btg-terracotta" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading text-btg-dark mb-1">
            <Globe className="w-6 h-6 inline-block mr-2 text-btg-terracotta" />
            Manage Destinations
          </h1>
          <p className="text-gray-500 text-sm">
            {stats.totalStates} states &bull; {stats.totalCities} cities &bull; {stats.totalDestinations} destinations &bull; {stats.totalProducts} packages
          </p>
        </div>
        <button
          onClick={() => { setEditingState(null); setShowStateModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-btg-terracotta text-white rounded-lg hover:opacity-90 transition font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Add State
        </button>
      </div>

      {/* Global Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          placeholder="Search states, cities, destinations, or experience types..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-btg-terracotta text-sm"
        />
        {globalSearch && (
          <button onClick={() => setGlobalSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* No results */}
      {filteredHierarchy.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Globe className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No results found</p>
          {globalSearch && <p className="text-sm mt-1">Try a different search term</p>}
          {!globalSearch && (
            <button onClick={() => setShowStateModal(true)} className="mt-3 text-btg-terracotta font-medium text-sm hover:underline">
              Add your first state
            </button>
          )}
        </div>
      )}

      {/* Hierarchy */}
      <div className="space-y-3">
        {filteredHierarchy.map((state) => (
          <StateCard
            key={state.id}
            state={state}
            isExpanded={expandedStates.has(state.id)}
            onToggle={() => toggleState(state.id)}
            expandedCities={expandedCities}
            onToggleCity={toggleCity}
            onEditState={() => { setEditingState(state); setShowStateModal(true); }}
            onToggleActive={() => handleToggleStateActive(state)}
            onDeleteState={() => setDeleteConfirm({ type: 'state', id: state.id, name: state.name })}
            onAddCity={() => { setAddingCityForState(state.id); setNewCityName(''); }}
            addingCityForState={addingCityForState}
            newCityName={newCityName}
            onNewCityNameChange={setNewCityName}
            onSubmitCity={() => handleAddCity(state.id)}
            onCancelAddCity={() => setAddingCityForState(null)}
            editingCityId={editingCityId}
            editingCityName={editingCityName}
            onStartEditCity={(city: CityData) => { setEditingCityId(city.id); setEditingCityName(city.name); }}
            onEditCityNameChange={setEditingCityName}
            onSaveCityEdit={(cityId: string) => handleSaveCityEdit(cityId)}
            onCancelCityEdit={() => { setEditingCityId(null); setEditingCityName(''); }}
            onToggleCityActive={handleToggleCityActive}
            onDeleteCity={(city: CityData) => setDeleteConfirm({ type: 'city', id: city.id, name: city.name })}
            onAddDest={(city: CityData) => {
              setEditingDest(null);
              setDestModalCityId(city.id);
              setDestModalCityName(city.name);
              setDestModalStateName(state.name);
              setShowDestModal(true);
            }}
            onEditDest={(dest: DestinationData, city: CityData) => {
              setEditingDest(dest);
              setDestModalCityId(city.id);
              setDestModalCityName(city.name);
              setDestModalStateName(state.name);
              setShowDestModal(true);
            }}
            onToggleDestActive={handleToggleDestActive}
            onDeleteDest={(dest: DestinationData) => setDeleteConfirm({ type: 'destination', id: dest.id, name: dest.name })}
            submitting={submitting}
          />
        ))}
      </div>

      {/* State Modal */}
      {showStateModal && (
        <StateModal
          state={editingState}
          onSave={handleSaveState}
          onClose={() => { setShowStateModal(false); setEditingState(null); }}
          submitting={submitting}
        />
      )}

      {/* Destination Modal */}
      {showDestModal && (
        <DestinationModal
          destination={editingDest}
          cityName={destModalCityName}
          stateName={destModalStateName}
          onSave={handleSaveDestination}
          onClose={() => { setShowDestModal(false); setEditingDest(null); }}
          submitting={submitting}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <DeleteConfirmModal
          type={deleteConfirm.type}
          name={deleteConfirm.name}
          onConfirm={() => {
            if (deleteConfirm.type === 'state') handleDeleteState(deleteConfirm.id);
            else if (deleteConfirm.type === 'city') handleDeleteCity(deleteConfirm.id);
            else handleDeleteDest(deleteConfirm.id);
          }}
          onCancel={() => setDeleteConfirm(null)}
          submitting={submitting}
        />
      )}
    </div>
  );
}

// ─── State Card Component ────────────────────────────────────────────

interface StateCardProps {
  state: StateData;
  isExpanded: boolean;
  onToggle: () => void;
  expandedCities: Set<string>;
  onToggleCity: (id: string) => void;
  onEditState: () => void;
  onToggleActive: () => void;
  onDeleteState: () => void;
  onAddCity: () => void;
  addingCityForState: string | null;
  newCityName: string;
  onNewCityNameChange: (v: string) => void;
  onSubmitCity: () => void;
  onCancelAddCity: () => void;
  editingCityId: string | null;
  editingCityName: string;
  onStartEditCity: (city: CityData) => void;
  onEditCityNameChange: (v: string) => void;
  onSaveCityEdit: (cityId: string) => void;
  onCancelCityEdit: () => void;
  onToggleCityActive: (city: CityData) => void;
  onDeleteCity: (city: CityData) => void;
  onAddDest: (city: CityData) => void;
  onEditDest: (dest: DestinationData, city: CityData) => void;
  onToggleDestActive: (dest: DestinationData) => void;
  onDeleteDest: (dest: DestinationData) => void;
  submitting: boolean;
}

function StateCard({
  state, isExpanded, onToggle, expandedCities, onToggleCity,
  onEditState, onToggleActive, onDeleteState,
  onAddCity, addingCityForState, newCityName, onNewCityNameChange, onSubmitCity, onCancelAddCity,
  editingCityId, editingCityName, onStartEditCity, onEditCityNameChange, onSaveCityEdit, onCancelCityEdit,
  onToggleCityActive, onDeleteCity,
  onAddDest, onEditDest, onToggleDestActive, onDeleteDest,
  submitting,
}: StateCardProps) {
  return (
    <div className={`rounded-xl border ${state.isActive ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-50 opacity-75'}`}>
      {/* State Header */}
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none"
        onClick={onToggle}
      >
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-bold text-btg-dark text-lg">{state.name}</h2>
            <Badge variant="outline" size="sm">{state.code}</Badge>
            {state.isNorthIndia && <Badge variant="info" size="sm">North India</Badge>}
            <Badge variant="default" size="sm">{state.commissionPercent}% commission</Badge>
            {!state.isActive && <Badge variant="danger" size="sm">Inactive</Badge>}
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3" /> {state.cityCount} cities
            </span>
            <span className="flex items-center gap-1">
              <MapIcon className="w-3 h-3" /> {state.destinationCount} destinations
            </span>
            <span className="flex items-center gap-1">
              <Package className="w-3 h-3" /> {state.productCount} packages
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onToggleActive}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition"
            title={state.isActive ? 'Deactivate' : 'Activate'}
          >
            {state.isActive ? (
              <Eye className="w-4 h-4 text-green-600" />
            ) : (
              <EyeOff className="w-4 h-4 text-gray-400" />
            )}
          </button>
          <button
            onClick={onEditState}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition"
            title="Edit state"
          >
            <Edit2 className="w-4 h-4 text-blue-600" />
          </button>
          <button
            onClick={onDeleteState}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition"
            title="Delete state"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>

      {/* Expanded: Cities */}
      {isExpanded && (
        <div className="border-t border-gray-100 px-5 py-3 space-y-2">
          {/* Experience Categories Summary */}
          {state.activityTypes.length > 0 && (
            <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
              <h4 className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Package className="w-3 h-3" /> Experience Categories
              </h4>
              <div className="flex flex-wrap gap-2">
                {state.activityTypes.map((type) => (
                  <span 
                    key={type} 
                    className="px-2 py-1 bg-white rounded-full text-xs font-medium text-purple-700 border border-purple-200"
                  >
                    {ACTIVITY_LABELS[type] || type}
                  </span>
                ))}
              </div>
              {/* City-wise experience breakdown */}
              <div className="mt-3 pt-3 border-t border-purple-100">
                <p className="text-xs text-purple-600 font-medium mb-2">By City:</p>
                <div className="space-y-1">
                  {state.cities.filter(c => c.activityTypes.length > 0).map((city) => (
                    <div key={city.id} className="flex items-start gap-2 text-xs">
                      <span className="font-medium text-gray-700 min-w-[80px]">{city.name}:</span>
                      <div className="flex flex-wrap gap-1">
                        {city.activityTypes.map((type) => (
                          <span key={type} className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px]">
                            {ACTIVITY_LABELS[type] || type}
                          </span>
                        ))}
                        <span className="text-gray-400">({city.productCount} packages)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Add City button */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cities</span>
            {addingCityForState !== state.id && (
              <button
                onClick={onAddCity}
                className="flex items-center gap-1 text-xs text-btg-terracotta hover:underline font-medium"
              >
                <Plus className="w-3 h-3" /> Add City
              </button>
            )}
          </div>

          {/* Inline new city form */}
          {addingCityForState === state.id && (
            <div className="flex items-center gap-2 p-2 bg-btg-cream/30 rounded-lg border border-btg-sand/40">
              <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={newCityName}
                onChange={(e) => onNewCityNameChange(e.target.value)}
                placeholder="City name..."
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-btg-terracotta/40 focus:border-btg-terracotta"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSubmitCity();
                  if (e.key === 'Escape') onCancelAddCity();
                }}
              />
              <button
                onClick={onSubmitCity}
                disabled={submitting || !newCityName.trim()}
                className="p-1.5 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
              </button>
              <button onClick={onCancelAddCity} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {state.cities.length === 0 && addingCityForState !== state.id && (
            <p className="text-sm text-gray-400 py-2 text-center">No cities yet. Add one to get started.</p>
          )}

          {state.cities.map((city) => (
            <CityRow
              key={city.id}
              city={city}
              isExpanded={expandedCities.has(city.id)}
              onToggle={() => onToggleCity(city.id)}
              editingCityId={editingCityId}
              editingCityName={editingCityName}
              onStartEdit={() => onStartEditCity(city)}
              onEditNameChange={onEditCityNameChange}
              onSaveEdit={() => onSaveCityEdit(city.id)}
              onCancelEdit={onCancelCityEdit}
              onToggleActive={() => onToggleCityActive(city)}
              onDelete={() => onDeleteCity(city)}
              onAddDest={() => onAddDest(city)}
              onEditDest={(dest: DestinationData) => onEditDest(dest, city)}
              onToggleDestActive={onToggleDestActive}
              onDeleteDest={onDeleteDest}
              submitting={submitting}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── City Row Component ──────────────────────────────────────────────

interface CityRowProps {
  city: CityData;
  isExpanded: boolean;
  onToggle: () => void;
  editingCityId: string | null;
  editingCityName: string;
  onStartEdit: () => void;
  onEditNameChange: (v: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  onAddDest: () => void;
  onEditDest: (dest: DestinationData) => void;
  onToggleDestActive: (dest: DestinationData) => void;
  onDeleteDest: (dest: DestinationData) => void;
  submitting: boolean;
}

function CityRow({
  city, isExpanded, onToggle,
  editingCityId, editingCityName, onStartEdit, onEditNameChange, onSaveEdit, onCancelEdit,
  onToggleActive, onDelete, onAddDest, onEditDest, onToggleDestActive, onDeleteDest,
  submitting,
}: CityRowProps) {
  const isEditing = editingCityId === city.id;

  return (
    <div className={`rounded-lg border ${city.isActive ? 'border-gray-100 bg-gray-50/50' : 'border-gray-100 bg-gray-100/50 opacity-70'}`}>
      {/* City Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 cursor-pointer select-none" onClick={onToggle}>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}

        <Building2 className="w-4 h-4 text-btg-sage flex-shrink-0" />

        {isEditing ? (
          <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={editingCityName}
              onChange={(e) => onEditNameChange(e.target.value)}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-btg-terracotta/40"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveEdit();
                if (e.key === 'Escape') onCancelEdit();
              }}
            />
            <button onClick={onSaveEdit} disabled={submitting} className="p-1 text-green-600 hover:bg-green-50 rounded">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button onClick={onCancelEdit} className="p-1 text-gray-400 hover:bg-gray-100 rounded">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <span className="font-semibold text-btg-dark text-sm flex-1">{city.name}</span>
        )}

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{city.destinationCount} dest.</span>
          <span>{city.productCount} pkg</span>
          {!city.isActive && <Badge variant="danger" size="sm">Inactive</Badge>}
        </div>

        {!isEditing && (
          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <button onClick={onToggleActive} className="p-1 rounded hover:bg-gray-200 transition" title={city.isActive ? 'Deactivate' : 'Activate'}>
              {city.isActive ? <Eye className="w-3.5 h-3.5 text-green-600" /> : <EyeOff className="w-3.5 h-3.5 text-gray-400" />}
            </button>
            <button onClick={onStartEdit} className="p-1 rounded hover:bg-gray-200 transition" title="Rename">
              <Edit2 className="w-3.5 h-3.5 text-blue-600" />
            </button>
            <button onClick={onDelete} className="p-1 rounded hover:bg-gray-200 transition" title="Delete">
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
            </button>
          </div>
        )}
      </div>

      {/* Expanded: Destinations */}
      {isExpanded && (
        <div className="border-t border-gray-100 px-4 py-2 space-y-1.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Destinations</span>
            <button
              onClick={onAddDest}
              className="flex items-center gap-1 text-xs text-btg-terracotta hover:underline font-medium"
            >
              <Plus className="w-3 h-3" /> Add Destination
            </button>
          </div>

          {city.destinations.length === 0 && (
            <p className="text-xs text-gray-400 py-2 text-center">No destinations in this city yet.</p>
          )}

          {city.destinations.map((dest) => (
            <DestinationRow
              key={dest.id}
              dest={dest}
              onEdit={() => onEditDest(dest)}
              onToggleActive={() => onToggleDestActive(dest)}
              onDelete={() => onDeleteDest(dest)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Destination Row Component ───────────────────────────────────────

interface DestinationRowProps {
  dest: DestinationData;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}

function DestinationRow({ dest, onEdit, onToggleActive, onDelete }: DestinationRowProps) {
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition ${
        dest.isActive ? 'border-gray-100 bg-white hover:border-gray-200' : 'border-gray-100 bg-gray-50 opacity-60'
      }`}
    >
      <MapPin className="w-4 h-4 text-btg-terracotta flex-shrink-0" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm text-btg-dark">{dest.name}</span>
          {dest.altitude && (
            <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
              <Mountain className="w-3 h-3" /> {dest.altitude}m
            </span>
          )}
          {!dest.isActive && <Badge variant="danger" size="sm">Inactive</Badge>}
        </div>

        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          {/* Months */}
          {dest.bestMonths.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-400">Best:</span>
              <div className="flex flex-wrap gap-0.5">
                {dest.bestMonths.map((m) => (
                  <span key={m} className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-700 rounded">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
          {dest.avoidMonths.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-400">Avoid:</span>
              <div className="flex flex-wrap gap-0.5">
                {dest.avoidMonths.map((m) => (
                  <span key={m} className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-600 rounded">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Activity types / Experiences */}
          {dest.activityTypes.length > 0 && (
            <div className="flex flex-wrap gap-0.5">
              {dest.activityTypes.map((t) => (
                <span
                  key={t}
                  className="text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded font-medium"
                >
                  {ACTIVITY_LABELS[t] || t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Package count */}
      <div className="text-center flex-shrink-0">
        <span className="text-sm font-bold text-btg-dark">{dest.productCount}</span>
        <p className="text-[10px] text-gray-400">packages</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button onClick={onToggleActive} className="p-1 rounded hover:bg-gray-100 transition" title={dest.isActive ? 'Deactivate' : 'Activate'}>
          {dest.isActive ? <Eye className="w-3.5 h-3.5 text-green-600" /> : <EyeOff className="w-3.5 h-3.5 text-gray-400" />}
        </button>
        <button onClick={onEdit} className="p-1 rounded hover:bg-gray-100 transition" title="Edit">
          <Edit2 className="w-3.5 h-3.5 text-blue-600" />
        </button>
        <button onClick={onDelete} className="p-1 rounded hover:bg-gray-100 transition" title="Delete">
          <Trash2 className="w-3.5 h-3.5 text-red-500" />
        </button>
      </div>
    </div>
  );
}

// ─── State Modal ─────────────────────────────────────────────────────

interface StateModalProps {
  state: StateData | null;
  onSave: (data: { name: string; code: string; isNorthIndia: boolean; commissionPercent: number }) => void;
  onClose: () => void;
  submitting: boolean;
}

function StateModal({ state, onSave, onClose, submitting }: StateModalProps) {
  const [name, setName] = useState(state?.name || '');
  const [code, setCode] = useState(state?.code || '');
  const [isNorthIndia, setIsNorthIndia] = useState(state?.isNorthIndia ?? false);
  const [commission, setCommission] = useState(String(state?.commissionPercent ?? 15));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      toast.error('Name and code are required');
      return;
    }
    onSave({ name: name.trim(), code: code.trim(), isNorthIndia, commissionPercent: Number(commission) || 15 });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-btg-dark">{state ? 'Edit State' : 'Add New State'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Himachal Pradesh"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-btg-terracotta text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State Code * (2 letters)</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 2))}
              required
              maxLength={2}
              placeholder="HP"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-btg-terracotta text-sm uppercase"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Commission %</label>
            <input
              type="number"
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
              min="0"
              max="100"
              step="0.5"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-btg-terracotta text-sm"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isNorthIndia}
              onChange={(e) => setIsNorthIndia(e.target.checked)}
              className="w-4 h-4 text-btg-terracotta border-gray-300 rounded focus:ring-btg-terracotta/40"
            />
            <span className="text-sm text-gray-700">North India</span>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-btg-terracotta text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {state ? 'Update State' : 'Create State'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Destination Modal ───────────────────────────────────────────────

interface DestinationModalProps {
  destination: DestinationData | null;
  cityName: string;
  stateName: string;
  onSave: (data: {
    name: string;
    description: string;
    altitude: string;
    bestMonths: string[];
    openMonths: string[];
    avoidMonths: string[];
  }) => void;
  onClose: () => void;
  submitting: boolean;
}

function DestinationModal({ destination, cityName, stateName, onSave, onClose, submitting }: DestinationModalProps) {
  const [name, setName] = useState(destination?.name || '');
  const [description, setDescription] = useState(destination?.description || '');
  const [altitude, setAltitude] = useState(destination?.altitude ? String(destination.altitude) : '');
  const [bestMonths, setBestMonths] = useState<string[]>(destination?.bestMonths || []);
  const [openMonths, setOpenMonths] = useState<string[]>(destination?.openMonths || []);
  const [avoidMonths, setAvoidMonths] = useState<string[]>(destination?.avoidMonths || []);

  const toggleMonth = (list: string[], setList: (v: string[]) => void, month: string) => {
    setList(list.includes(month) ? list.filter((m) => m !== month) : [...list, month]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Destination name is required');
      return;
    }
    onSave({ name: name.trim(), description, altitude, bestMonths, openMonths, avoidMonths });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-btg-dark">
              {destination ? 'Edit Destination' : 'Add Destination'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              <MapPin className="w-3 h-3 inline mr-1" />
              {cityName}, {stateName}
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destination Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Triund, Hampta Pass"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-btg-terracotta text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Altitude (meters)</label>
            <input
              type="number"
              value={altitude}
              onChange={(e) => setAltitude(e.target.value)}
              placeholder="e.g. 2850"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-btg-terracotta text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief description of the destination..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40 focus:border-btg-terracotta text-sm"
            />
          </div>

          {/* Month selectors */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Best Months to Visit</label>
            <div className="flex flex-wrap gap-1.5">
              {MONTHS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleMonth(bestMonths, setBestMonths, m)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                    bestMonths.includes(m)
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-green-300'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Open Months <span className="text-gray-400 font-normal">(leave empty for year-round)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {MONTHS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleMonth(openMonths, setOpenMonths, m)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                    openMonths.includes(m)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Months to Avoid</label>
            <div className="flex flex-wrap gap-1.5">
              {MONTHS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleMonth(avoidMonths, setAvoidMonths, m)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                    avoidMonths.includes(m)
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-red-300'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-btg-terracotta text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {destination ? 'Update Destination' : 'Create Destination'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirmation Modal ───────────────────────────────────────

interface DeleteConfirmModalProps {
  type: 'state' | 'city' | 'destination';
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
  submitting: boolean;
}

function DeleteConfirmModal({ type, name, onConfirm, onCancel, submitting }: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-btg-dark">Delete {type}?</h3>
            <p className="text-sm text-gray-500">
              Are you sure you want to delete <strong>{name}</strong>? This action cannot be undone.
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Note: If this {type} has child items, deletion will be blocked.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
