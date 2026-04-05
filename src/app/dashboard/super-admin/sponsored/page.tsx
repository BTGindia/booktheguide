'use client';

import { useState, useEffect } from 'react';
import { Star, Plus, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface SponsoredItem {
  id: string;
  entityType: string;
  entityId: string;
  entityName: string;
  rank: number;
  context: string;
  isActive: boolean;
}

interface EntityOption {
  id: string;
  label: string;
}

export default function SponsoredItemsPage() {
  const [items, setItems] = useState<SponsoredItem[]>([]);
  const [products, setProducts] = useState<EntityOption[]>([]);
  const [guides, setGuides] = useState<EntityOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const [form, setForm] = useState({
    entityType: 'PRODUCT',
    entityId: '',
    rank: '0',
    context: 'both',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/super-admin/sponsored');
      const data = await res.json();
      setItems(data.items || []);
      setProducts(data.products || []);
      setGuides(data.guides || []);
    } catch {
      toast.error('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!form.entityId) { toast.error('Select an item'); return; }
    setSaving('add');
    try {
      const res = await fetch('/api/super-admin/sponsored', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Sponsored item added');
      setForm({ entityType: 'PRODUCT', entityId: '', rank: '0', context: 'both' });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add');
    } finally {
      setSaving(null);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Remove this sponsored item?')) return;
    setSaving(id);
    try {
      await fetch(`/api/super-admin/sponsored?id=${id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success('Removed');
    } catch {
      toast.error('Failed to remove');
    } finally {
      setSaving(null);
    }
  };

  const entityOptions = form.entityType === 'PRODUCT' ? products : guides;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-btg-terracotta" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-btg-dark flex items-center gap-2">
          <Star className="w-6 h-6" />
          Sponsored &amp; Recommended Items
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Select products or guides to sponsor. They appear with a &quot;Recommended&quot; badge and are ranked higher in search results.
        </p>
      </div>

      {/* Add Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-medium text-btg-dark mb-3">Add Sponsored Item</h3>
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Type</label>
            <select
              value={form.entityType}
              onChange={(e) => setForm({ ...form, entityType: e.target.value, entityId: '' })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="PRODUCT">Product / Trip</option>
              <option value="GUIDE">Guide</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-gray-600 block mb-1">Item</label>
            <select
              value={form.entityId}
              onChange={(e) => setForm({ ...form, entityId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Select an item</option>
              {entityOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="w-20">
            <label className="text-xs font-medium text-gray-600 block mb-1">Rank</label>
            <input
              type="number"
              value={form.rank}
              onChange={(e) => setForm({ ...form, rank: e.target.value })}
              min={0}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Show in</label>
            <select
              value={form.context}
              onChange={(e) => setForm({ ...form, context: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="both">Both</option>
              <option value="search">Search only</option>
              <option value="homepage">Homepage only</option>
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

      {/* Items List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700">Sponsored Items ({items.length})</h3>
          <p className="text-xs text-gray-500 mt-0.5">Lower rank number = higher priority. Items marked &quot;Recommended&quot; with dark border.</p>
        </div>

        {items.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No sponsored items yet. Add items above to feature them.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Rank</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Context</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <span className="w-7 h-7 rounded-full bg-btg-cream text-btg-terracotta text-xs font-bold flex items-center justify-center">
                      {item.rank}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.entityType === 'GUIDE' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {item.entityType}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm font-medium text-btg-dark">{item.entityName}</td>
                  <td className="px-5 py-3 text-sm text-gray-500 capitalize">{item.context}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleRemove(item.id)}
                      disabled={saving === item.id}
                      className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      {saving === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
