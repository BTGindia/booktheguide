'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2, Save, CheckCircle, Plus, Trash2, Eye, EyeOff, ChevronDown,
  ChevronRight, Navigation, Upload, X, AlertCircle, Layers, Settings2,
  MapPin, Package,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface StateItem {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  isNorthIndia: boolean;
  commissionPercent: number;
  cityCount: number;
  guideCount: number;
  packageCount: number;
}

interface SubCategory {
  id: string;
  name: string;
  slug: string;
  isEnabled: boolean;
  sortOrder: number;
}

interface Category {
  id: string;
  slug: string;
  label: string;
  urlSlug: string;
  image: string | null;
  description: string | null;
  isEnabled: boolean;
  showInNav: boolean;
  navLabel: string | null;
  navOrder: number;
  sortOrder: number;
  subCategories: SubCategory[];
}

export default function SuperAdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [logoUrl, setLogoUrl] = useState('');
  const [logoSaving, setLogoSaving] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCat, setNewCat] = useState({ label: '', slug: '', urlSlug: '', description: '' });
  const [newSubName, setNewSubName] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'categories' | 'states' | 'navbar' | 'logo'>('categories');
  const [states, setStates] = useState<StateItem[]>([]);
  const [statesLoading, setStatesLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      if (data.categories?.length > 0) {
        setCategories(data.categories);
      } else {
        // Seed defaults first
        await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'seed' }),
        });
        const res2 = await fetch('/api/admin/categories');
        const data2 = await res2.json();
        setCategories(data2.categories || []);
      }
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLogo = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/platform-settings');
      const data = await res.json();
      setLogoUrl(data.settings?.logo_url || '');
    } catch {}
  }, []);

  const fetchStates = useCallback(async () => {
    setStatesLoading(true);
    try {
      const res = await fetch('/api/admin/states');
      const data = await res.json();
      setStates(data.states || []);
    } catch {
      toast.error('Failed to load states');
    } finally {
      setStatesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchLogo();
    fetchStates();
  }, [fetchCategories, fetchLogo, fetchStates]);

  const toggleExpand = (id: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Toggle state enabled/disabled
  const toggleState = async (st: StateItem) => {
    setSaving(`state-${st.id}`);
    try {
      const res = await fetch('/api/admin/states', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: st.id, isActive: !st.isActive }),
      });
      if (!res.ok) throw new Error();
      setStates((prev) =>
        prev.map((s) => (s.id === st.id ? { ...s, isActive: !s.isActive } : s))
      );
      toast.success(`${st.name} ${!st.isActive ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error('Failed to update state');
    } finally {
      setSaving(null);
    }
  };

  // Toggle category enabled/disabled
  const toggleCategory = async (cat: Category) => {
    setSaving(cat.id);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cat.id, type: 'category', isEnabled: !cat.isEnabled }),
      });
      if (!res.ok) throw new Error();
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, isEnabled: !c.isEnabled } : c))
      );
      toast.success(`${cat.label} ${!cat.isEnabled ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error('Failed to update');
    } finally {
      setSaving(null);
    }
  };

  // Toggle subcategory enabled/disabled
  const toggleSubCategory = async (catId: string, sub: SubCategory) => {
    setSaving(sub.id);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sub.id, type: 'subcategory', isEnabled: !sub.isEnabled }),
      });
      if (!res.ok) throw new Error();
      setCategories((prev) =>
        prev.map((c) =>
          c.id === catId
            ? {
                ...c,
                subCategories: c.subCategories.map((s) =>
                  s.id === sub.id ? { ...s, isEnabled: !s.isEnabled } : s
                ),
              }
            : c
        )
      );
      toast.success(`${sub.name} ${!sub.isEnabled ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error('Failed to update');
    } finally {
      setSaving(null);
    }
  };

  // Toggle show in nav
  const toggleNavVisibility = async (cat: Category) => {
    setSaving(`nav-${cat.id}`);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: cat.id,
          type: 'category',
          showInNav: !cat.showInNav,
          navOrder: cat.showInNav ? 0 : categories.filter((c) => c.showInNav).length + 1,
        }),
      });
      if (!res.ok) throw new Error();
      setCategories((prev) =>
        prev.map((c) =>
          c.id === cat.id ? { ...c, showInNav: !c.showInNav } : c
        )
      );
      toast.success(`${cat.label} ${!cat.showInNav ? 'added to' : 'removed from'} nav bar`);
    } catch {
      toast.error('Failed to update');
    } finally {
      setSaving(null);
    }
  };

  // Update nav label
  const updateNavLabel = async (cat: Category, navLabel: string) => {
    setSaving(`label-${cat.id}`);
    try {
      await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cat.id, type: 'category', navLabel: navLabel || null }),
      });
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, navLabel } : c))
      );
      toast.success('Nav label updated');
    } catch {
      toast.error('Failed to update');
    } finally {
      setSaving(null);
    }
  };

  // Update nav order
  const updateNavOrder = async (cat: Category, navOrder: number) => {
    try {
      await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cat.id, type: 'category', navOrder }),
      });
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, navOrder } : c))
      );
    } catch {
      toast.error('Failed to update order');
    }
  };

  // Add new category
  const addCategory = async () => {
    if (!newCat.label || !newCat.slug || !newCat.urlSlug) {
      toast.error('Label, slug, and URL slug are required');
      return;
    }
    setSaving('new-cat');
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCat),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Category created');
      setShowAddCategory(false);
      setNewCat({ label: '', slug: '', urlSlug: '', description: '' });
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create');
    } finally {
      setSaving(null);
    }
  };

  // Add subcategory
  const addSubCategory = async (catId: string) => {
    const name = newSubName[catId]?.trim();
    if (!name) return;
    setSaving(`sub-${catId}`);
    try {
      const res = await fetch('/api/admin/categories/subcategory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId: catId, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Subcategory added');
      setNewSubName((prev) => ({ ...prev, [catId]: '' }));
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add');
    } finally {
      setSaving(null);
    }
  };

  // Delete subcategory
  const deleteSubCategory = async (subId: string) => {
    if (!confirm('Delete this subcategory?')) return;
    setSaving(subId);
    try {
      const res = await fetch(`/api/admin/categories?id=${subId}&type=subcategory`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error();
      toast.success('Subcategory deleted');
      fetchCategories();
    } catch {
      toast.error('Failed to delete');
    } finally {
      setSaving(null);
    }
  };

  // Save logo
  const saveLogo = async () => {
    setLogoSaving(true);
    try {
      const res = await fetch('/api/admin/platform-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'logo_url', value: logoUrl }),
      });
      if (!res.ok) throw new Error();
      toast.success('Logo updated');
    } catch {
      toast.error('Failed to save logo');
    } finally {
      setLogoSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-btg-terracotta" />
      </div>
    );
  }

  const navCategories = categories
    .filter((c) => c.showInNav && c.isEnabled)
    .sort((a, b) => a.navOrder - b.navOrder);

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-heading text-btg-dark mb-1">
          Experience Categories
        </h1>
        <p className="text-gray-600">
          Enable/disable categories and subcategories, manage navigation bar, and upload logo.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {[
          { key: 'categories', label: 'Categories', icon: Layers },
          { key: 'states', label: 'States', icon: MapPin },
          { key: 'navbar', label: 'Navigation Bar', icon: Navigation },
          { key: 'logo', label: 'Logo', icon: Upload },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-btg-terracotta shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════ Categories Tab ═══════ */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`bg-white rounded-xl border transition-all ${
                cat.isEnabled ? 'border-gray-200' : 'border-red-200 bg-red-50/30'
              }`}
            >
              {/* Category Header */}
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => toggleExpand(cat.id)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {expandedCats.has(cat.id) ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-btg-dark truncate">{cat.label}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-mono">
                        {cat.slug}
                      </span>
                      {cat.showInNav && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#58bdae]/10 text-[#58bdae] font-semibold">
                          In Nav
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {cat.subCategories.length} subcategories · /experiences/{cat.urlSlug}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleCategory(cat)}
                    disabled={saving === cat.id}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      cat.isEnabled
                        ? 'bg-green-50 text-green-700 hover:bg-green-100'
                        : 'bg-red-50 text-red-700 hover:bg-red-100'
                    }`}
                  >
                    {saving === cat.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : cat.isEnabled ? (
                      <Eye className="w-3.5 h-3.5" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5" />
                    )}
                    {cat.isEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>

              {/* Expanded: Subcategories */}
              {expandedCats.has(cat.id) && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Subcategories
                  </div>
                  <div className="space-y-2">
                    {cat.subCategories.map((sub) => (
                      <div
                        key={sub.id}
                        className={`flex items-center justify-between px-4 py-2.5 rounded-lg transition-all ${
                          sub.isEnabled
                            ? 'bg-white border border-gray-100'
                            : 'bg-red-50/50 border border-red-100'
                        }`}
                      >
                        <span
                          className={`text-sm ${
                            sub.isEnabled ? 'text-gray-800' : 'text-gray-400 line-through'
                          }`}
                        >
                          {sub.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleSubCategory(cat.id, sub)}
                            disabled={saving === sub.id}
                            className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                              sub.isEnabled
                                ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                : 'bg-red-50 text-red-700 hover:bg-red-100'
                            }`}
                          >
                            {saving === sub.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : sub.isEnabled ? (
                              'Enabled'
                            ) : (
                              'Disabled'
                            )}
                          </button>
                          <button
                            onClick={() => deleteSubCategory(sub.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Subcategory */}
                  <div className="flex gap-2 mt-3">
                    <input
                      type="text"
                      placeholder="New subcategory name..."
                      value={newSubName[cat.id] || ''}
                      onChange={(e) =>
                        setNewSubName((prev) => ({ ...prev, [cat.id]: e.target.value }))
                      }
                      onKeyDown={(e) => e.key === 'Enter' && addSubCategory(cat.id)}
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-btg-terracotta/30 focus:border-transparent"
                    />
                    <button
                      onClick={() => addSubCategory(cat.id)}
                      disabled={saving === `sub-${cat.id}`}
                      className="flex items-center gap-1 px-3 py-2 bg-btg-terracotta text-white text-xs font-medium rounded-lg hover:bg-btg-terracotta/90 disabled:opacity-50"
                    >
                      {saving === `sub-${cat.id}` ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add Category Button */}
          {!showAddCategory ? (
            <button
              onClick={() => setShowAddCategory(true)}
              className="flex items-center gap-2 px-4 py-3 w-full border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-btg-terracotta hover:text-btg-terracotta transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add New Category
            </button>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-btg-dark">New Category</h3>
                <button onClick={() => setShowAddCategory(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Label *</label>
                  <input
                    type="text"
                    value={newCat.label}
                    onChange={(e) => {
                      const label = e.target.value;
                      setNewCat({
                        ...newCat,
                        label,
                        slug: label.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/(^_|_$)/g, ''),
                        urlSlug: label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-btg-terracotta/30"
                    placeholder="e.g. Camping Retreats"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Slug (auto)</label>
                  <input
                    type="text"
                    value={newCat.slug}
                    onChange={(e) => setNewCat({ ...newCat, slug: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 font-mono"
                    placeholder="CAMPING_RETREATS"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">URL Slug (auto)</label>
                  <input
                    type="text"
                    value={newCat.urlSlug}
                    onChange={(e) => setNewCat({ ...newCat, urlSlug: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 font-mono"
                    placeholder="camping-retreats"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={newCat.description}
                    onChange={(e) => setNewCat({ ...newCat, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Short description..."
                  />
                </div>
              </div>
              <button
                onClick={addCategory}
                disabled={saving === 'new-cat'}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-btg-terracotta text-white text-sm font-medium rounded-lg hover:bg-btg-terracotta/90 disabled:opacity-50"
              >
                {saving === 'new-cat' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Category
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══════ States Tab ═══════ */}
      {activeTab === 'states' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">State Management</p>
              <p>Enable or disable states to control which ones are visible on the website. Disabled states will be hidden from destinations, navigation, filters, and all public pages.</p>
            </div>
          </div>

          {statesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-btg-terracotta" />
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">State</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Code</th>
                    <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase">Packages</th>
                    <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase">Guides</th>
                    <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase">Cities</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {states.map((st) => (
                    <tr
                      key={st.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        !st.isActive ? 'bg-red-50/30' : ''
                      }`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <MapPin className={`w-4 h-4 ${st.isActive ? 'text-[#58bdae]' : 'text-gray-300'}`} />
                          <span className={`font-medium ${st.isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                            {st.name}
                          </span>
                          {st.isNorthIndia && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">
                              North
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs font-mono text-gray-500">{st.code}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 text-sm ${st.packageCount > 0 ? 'text-green-700 font-medium' : 'text-gray-400'}`}>
                          <Package className="w-3.5 h-3.5" />
                          {st.packageCount}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="text-sm text-gray-600">{st.guideCount}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="text-sm text-gray-600">{st.cityCount}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => toggleState(st)}
                          disabled={saving === `state-${st.id}`}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                            st.isActive
                              ? 'bg-green-50 text-green-700 hover:bg-green-100'
                              : 'bg-red-50 text-red-700 hover:bg-red-100'
                          }`}
                        >
                          {saving === `state-${st.id}` ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : st.isActive ? (
                            <Eye className="w-3.5 h-3.5" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5" />
                          )}
                          {st.isActive ? 'Enabled' : 'Disabled'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            <p>
              <strong>Note:</strong> Disabling a state hides it from the entire website — destinations, filters, homepage, navigation, and search.
              States with 0 packages are automatically hidden from public pages even if enabled.
            </p>
          </div>
        </div>
      )}

      {/* ═══════ Navigation Bar Tab ═══════ */}
      {activeTab === 'navbar' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">Navigation Bar Preview</p>
              <p>Select which categories appear in the top navigation bar and set their display order. Changes are reflected on the website immediately.</p>
            </div>
          </div>

          {/* Nav Preview */}
          <div className="bg-[#1A1A18] rounded-xl p-4 overflow-x-auto">
            <div className="flex items-center gap-6 min-w-max">
              <span className="text-white font-heading text-[10px] font-bold tracking-[0.2em] uppercase">
                {logoUrl ? '🏔️ BTG' : 'Book The Guide'}
              </span>
              {navCategories.map((cat) => (
                <span key={cat.id} className="text-white/80 text-[13px] font-medium whitespace-nowrap">
                  {cat.navLabel || cat.label}
                </span>
              ))}
              <span className="text-white/80 text-[13px]">Become a Guide</span>
              <span className="text-white/80 text-[13px]">♡</span>
              <span className="bg-[#58bdae] text-white text-[13px] px-4 py-1.5 rounded-full font-semibold">
                Account
              </span>
            </div>
          </div>

          {/* Category Nav Controls */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Show in Nav</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Nav Label</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories
                  .filter((c) => c.isEnabled)
                  .map((cat) => (
                    <tr key={cat.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <span className="font-medium text-gray-900">{cat.label}</span>
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => toggleNavVisibility(cat)}
                          disabled={saving === `nav-${cat.id}`}
                          className={`relative w-10 h-5 rounded-full transition-colors ${
                            cat.showInNav ? 'bg-[#58bdae]' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                              cat.showInNav ? 'translate-x-5' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <input
                          type="text"
                          value={cat.navLabel || ''}
                          onChange={(e) =>
                            setCategories((prev) =>
                              prev.map((c) =>
                                c.id === cat.id ? { ...c, navLabel: e.target.value } : c
                              )
                            )
                          }
                          onBlur={(e) => updateNavLabel(cat, e.target.value)}
                          placeholder={cat.label}
                          className="w-40 px-2 py-1 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-btg-terracotta/30"
                          disabled={!cat.showInNav}
                        />
                      </td>
                      <td className="px-5 py-3">
                        <input
                          type="number"
                          value={cat.navOrder}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setCategories((prev) =>
                              prev.map((c) =>
                                c.id === cat.id ? { ...c, navOrder: val } : c
                              )
                            );
                          }}
                          onBlur={(e) => updateNavOrder(cat, parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 text-sm border border-gray-200 rounded-md text-center"
                          disabled={!cat.showInNav}
                          min={0}
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            <p>
              <strong>Static nav items:</strong> Logo, selected categories above, &quot;Become a Guide&quot;, Wishlist icon,
              and Account button (Login/Signup) are always shown.
            </p>
          </div>
        </div>
      )}

      {/* ═══════ Logo Tab ═══════ */}
      {activeTab === 'logo' && (
        <div className="max-w-lg space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-btg-dark mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-btg-terracotta" />
              Site Logo
            </h3>

            {logoUrl && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg flex items-center gap-4">
                <img
                  src={logoUrl}
                  alt="Logo preview"
                  className="h-10 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <span className="text-xs text-gray-500 truncate flex-1">{logoUrl}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo URL
              </label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-btg-terracotta/30 focus:border-transparent"
                placeholder="https://example.com/logo.png"
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload your logo to an image hosting service and paste the URL here.
                Recommended size: 200×60px, PNG or SVG.
              </p>
            </div>

            <button
              onClick={saveLogo}
              disabled={logoSaving}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-btg-terracotta text-white text-sm font-medium rounded-lg hover:bg-btg-terracotta/90 disabled:opacity-50"
            >
              {logoSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Logo
            </button>
          </div>

          {/* Preview */}
          <div className="bg-[#1A1A18] rounded-xl p-4">
            <div className="flex items-center gap-4">
              <img src={logoUrl || '/images/btg-logo-cropped.png'} alt="Logo" className="h-10 object-contain" />
              <span className="text-white/40 text-xs">← Header preview</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
