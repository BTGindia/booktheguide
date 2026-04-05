'use client';

import { useState, useEffect } from 'react';
import { Home, Plus, Trash2, Loader2, Save, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';

const SECTIONS = [
  { key: 'trending', label: 'Trending Experiences' },
  { key: 'weekend', label: 'Weekend Getaways / Group Trips' },
  { key: 'adventure', label: 'Adventure Picks' },
  { key: 'heritage', label: 'Heritage Walks' },
  { key: 'influencers', label: 'Travel with Influencers' },
  { key: 'destinations', label: 'Top Destinations' },
  { key: 'categories', label: 'Experience Categories' },
];

interface Selection {
  id: string;
  section: string;
  entityType: string;
  entityId: string;
  sortOrder: number;
  isActive: boolean;
}

interface EntityOption {
  id: string;
  label: string;
}

export default function HomepageControlPage() {
  const [selections, setSelections] = useState<Selection[]>([]);
  const [products, setProducts] = useState<EntityOption[]>([]);
  const [destinations, setDestinations] = useState<EntityOption[]>([]);
  const [categories, setCategories] = useState<EntityOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('trending');

  // Add form
  const [addEntityType, setAddEntityType] = useState('PRODUCT');
  const [addEntityId, setAddEntityId] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [selRes, prodRes, destRes, catRes] = await Promise.all([
        fetch('/api/super-admin/homepage'),
        fetch('/api/super-admin/homepage?action=products'),
        fetch('/api/super-admin/homepage?action=destinations'),
        fetch('/api/super-admin/homepage?action=categories'),
      ]);
      const [selData, prodData, destData, catData] = await Promise.all([
        selRes.json(), prodRes.json(), destRes.json(), catRes.json(),
      ]);
      setSelections(selData.selections || []);
      setProducts((prodData.products || []).map((p: any) => ({ id: p.id, label: `${p.title} (${p.packageCategory})` })));
      setDestinations((destData.destinations || []).map((d: any) => ({ id: d.id, label: d.name })));
      setCategories((catData.categories || []).map((c: any) => ({ id: c.id, label: c.label })));
    } catch {
      toast.error('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const sectionSelections = selections
    .filter((s) => s.section === activeSection)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const getEntityName = (entityType: string, entityId: string): string => {
    const list = entityType === 'PRODUCT' ? products : entityType === 'DESTINATION' ? destinations : categories;
    return list.find((e) => e.id === entityId)?.label || entityId;
  };

  const getEntityOptions = (): EntityOption[] => {
    if (addEntityType === 'PRODUCT') return products;
    if (addEntityType === 'DESTINATION') return destinations;
    return categories;
  };

  const handleAdd = async () => {
    if (!addEntityId) { toast.error('Select an item to add'); return; }
    setSaving('add');
    try {
      const nextOrder = sectionSelections.length;
      const res = await fetch('/api/super-admin/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: activeSection,
          entityType: addEntityType,
          entityId: addEntityId,
          sortOrder: nextOrder,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Added to homepage');
      setAddEntityId('');
      const refreshRes = await fetch('/api/super-admin/homepage');
      const refreshData = await refreshRes.json();
      setSelections(refreshData.selections || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add');
    } finally {
      setSaving(null);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Remove this item from the homepage?')) return;
    setSaving(id);
    try {
      await fetch(`/api/super-admin/homepage?id=${id}`, { method: 'DELETE' });
      setSelections((prev) => prev.filter((s) => s.id !== id));
      toast.success('Removed');
    } catch {
      toast.error('Failed to remove');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-btg-terracotta" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-btg-dark flex items-center gap-2">
          <Home className="w-6 h-6" />
          Homepage Content Control
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manually select which products, destinations, and categories appear in each homepage section.
        </p>
      </div>

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-1 bg-gray-100 rounded-xl p-1">
        {SECTIONS.map((sec) => {
          const count = selections.filter((s) => s.section === sec.key).length;
          return (
            <button
              key={sec.key}
              onClick={() => setActiveSection(sec.key)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeSection === sec.key
                  ? 'bg-white text-btg-terracotta shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {sec.label} {count > 0 && <span className="ml-1 text-[10px] bg-btg-terracotta/10 text-btg-terracotta px-1.5 py-0.5 rounded-full">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Add Item */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-medium text-btg-dark mb-3">
          Add to "{SECTIONS.find((s) => s.key === activeSection)?.label}"
        </h3>
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Type</label>
            <select
              value={addEntityType}
              onChange={(e) => { setAddEntityType(e.target.value); setAddEntityId(''); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="PRODUCT">Product / Trip</option>
              <option value="DESTINATION">Destination</option>
              <option value="CATEGORY">Category</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-gray-600 block mb-1">Item</label>
            <select
              value={addEntityId}
              onChange={(e) => setAddEntityId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Select an item</option>
              {getEntityOptions().map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAdd}
            disabled={saving === 'add'}
            className="flex items-center gap-1.5 px-4 py-2 bg-btg-terracotta text-white text-sm rounded-lg hover:bg-btg-terracotta/90 disabled:opacity-50"
          >
            {saving === 'add' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add
          </button>
        </div>
      </div>

      {/* Current Selections */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700">
            Selected Items — {SECTIONS.find((s) => s.key === activeSection)?.label}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {sectionSelections.length} items selected. These will be shown on the homepage in this section.
          </p>
        </div>

        {sectionSelections.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No items selected for this section. Add items above to control what appears on the homepage.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sectionSelections.map((sel, idx) => (
              <div key={sel.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                <GripVertical className="w-4 h-4 text-gray-300" />
                <span className="w-6 h-6 rounded-full bg-btg-cream text-btg-terracotta text-xs font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <span className="text-sm font-medium text-btg-dark">
                    {getEntityName(sel.entityType, sel.entityId)}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 ml-2">
                    {sel.entityType}
                  </span>
                </div>
                <button
                  onClick={() => handleRemove(sel.id)}
                  disabled={saving === sel.id}
                  className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                >
                  {saving === sel.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
