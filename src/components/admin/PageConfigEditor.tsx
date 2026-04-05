'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2, Save, GripVertical, Eye, EyeOff, Plus, Trash2, ArrowUp, ArrowDown,
  CheckCircle2, AlertCircle,
} from 'lucide-react';

interface SectionOrder {
  sectionKey: string;
  visible: boolean;
  sortBy: string;
  limit: number;
}

interface FeaturedItem {
  section: string;
  itemId: string;
  position: number;
}

interface DisplaySetting {
  settingKey: string;
  settingValue: string;
}

interface PageConfig {
  sectionOrder: SectionOrder[];
  featuredItems: FeaturedItem[];
  displaySettings: DisplaySetting[];
  updatedAt?: string;
}

interface SectionDefinition {
  key: string;
  label: string;
  description: string;
  supportsSorting?: boolean;
  supportsLimit?: boolean;
  maxLimit?: number;
}

interface PageConfigEditorProps {
  pageSlug: string;
  pageTitle: string;
  sections: SectionDefinition[];
  sortOptions?: { value: string; label: string }[];
}

const DEFAULT_SORT_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'highest_booked', label: 'Highest Booked First' },
  { value: 'best_rated', label: 'Best Rated First' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'most_reviewed', label: 'Most Reviewed First' },
];

export default function PageConfigEditor({ pageSlug, pageTitle, sections, sortOptions }: PageConfigEditorProps) {
  const [config, setConfig] = useState<PageConfig>({
    sectionOrder: [],
    featuredItems: [],
    displaySettings: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [featuredInput, setFeaturedInput] = useState({ section: '', itemId: '' });

  const sorts = sortOptions || DEFAULT_SORT_OPTIONS;

  useEffect(() => {
    fetch(`/api/ui-manager/configs/${pageSlug}`)
      .then((res) => res.json())
      .then((data) => {
        const c = data.config;
        // Initialize sections if empty
        if (!c.sectionOrder || c.sectionOrder.length === 0) {
          c.sectionOrder = sections.map((s) => ({
            sectionKey: s.key,
            visible: true,
            sortBy: 'default',
            limit: s.maxLimit || 12,
          }));
        }
        setConfig({
          sectionOrder: c.sectionOrder || [],
          featuredItems: c.featuredItems || [],
          displaySettings: c.displaySettings || [],
          updatedAt: c.updatedAt,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [pageSlug, sections]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveStatus('idle');
    try {
      const res = await fetch(`/api/ui-manager/configs/${pageSlug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionOrder: config.sectionOrder,
          featuredItems: config.featuredItems,
          displaySettings: config.displaySettings,
        }),
      });
      if (res.ok) {
        setSaveStatus('success');
        const data = await res.json();
        setConfig((prev) => ({ ...prev, updatedAt: data.config.updatedAt }));
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    }
    setSaving(false);
    setTimeout(() => setSaveStatus('idle'), 3000);
  }, [config, pageSlug]);

  const moveSection = (idx: number, dir: -1 | 1) => {
    const newOrder = [...config.sectionOrder];
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= newOrder.length) return;
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
    setConfig((prev) => ({ ...prev, sectionOrder: newOrder }));
  };

  const toggleVisibility = (idx: number) => {
    const newOrder = [...config.sectionOrder];
    newOrder[idx] = { ...newOrder[idx], visible: !newOrder[idx].visible };
    setConfig((prev) => ({ ...prev, sectionOrder: newOrder }));
  };

  const updateSort = (idx: number, sortBy: string) => {
    const newOrder = [...config.sectionOrder];
    newOrder[idx] = { ...newOrder[idx], sortBy };
    setConfig((prev) => ({ ...prev, sectionOrder: newOrder }));
  };

  const updateLimit = (idx: number, limit: number) => {
    const newOrder = [...config.sectionOrder];
    newOrder[idx] = { ...newOrder[idx], limit };
    setConfig((prev) => ({ ...prev, sectionOrder: newOrder }));
  };

  const addFeaturedItem = () => {
    if (!featuredInput.section || !featuredInput.itemId) return;
    const nextPosition = config.featuredItems.filter((f) => f.section === featuredInput.section).length;
    setConfig((prev) => ({
      ...prev,
      featuredItems: [...prev.featuredItems, { ...featuredInput, position: nextPosition }],
    }));
    setFeaturedInput({ section: '', itemId: '' });
  };

  const removeFeaturedItem = (idx: number) => {
    setConfig((prev) => ({
      ...prev,
      featuredItems: prev.featuredItems.filter((_, i) => i !== idx),
    }));
  };

  const getSectionDef = (key: string) => sections.find((s) => s.key === key);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-btg-dark">{pageTitle}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure section order, sorting, and featured items.
            {config.updatedAt && (
              <span className="ml-2 text-xs text-gray-400">
                Last saved: {new Date(config.updatedAt).toLocaleString()}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#58bdae] text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-[#4aa99a] disabled:opacity-50 transition-all"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      {saveStatus === 'success' && (
        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm">
          <CheckCircle2 className="w-4 h-4" /> Configuration saved successfully.
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">
          <AlertCircle className="w-4 h-4" /> Failed to save. Please try again.
        </div>
      )}

      {/* Section Order */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-heading text-lg font-bold text-gray-900">Section Order &amp; Sorting</h2>
          <p className="text-sm text-gray-500 mt-0.5">Drag sections to reorder. Choose sort criteria for each section.</p>
        </div>
        <div className="divide-y divide-gray-50">
          {config.sectionOrder.map((section, idx) => {
            const def = getSectionDef(section.sectionKey);
            if (!def) return null;
            return (
              <div
                key={section.sectionKey}
                className={`p-5 flex items-start gap-4 ${!section.visible ? 'opacity-50 bg-gray-50/50' : ''}`}
              >
                <div className="flex flex-col gap-1 pt-1">
                  <button
                    onClick={() => moveSection(idx, -1)}
                    disabled={idx === 0}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <GripVertical className="w-4 h-4 text-gray-300" />
                  <button
                    onClick={() => moveSection(idx, 1)}
                    disabled={idx === config.sectionOrder.length - 1}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-bold text-[#58bdae] bg-[#58bdae]/10 px-2 py-0.5 rounded">#{idx + 1}</span>
                    <h3 className="font-heading font-bold text-gray-900">{def.label}</h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{def.description}</p>

                  <div className="flex flex-wrap gap-4">
                    {(def.supportsSorting !== false) && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Sort By</label>
                        <select
                          value={section.sortBy}
                          onChange={(e) => updateSort(idx, e.target.value)}
                          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#58bdae]/40"
                        >
                          {sorts.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {(def.supportsLimit !== false) && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Items to Show</label>
                        <input
                          type="number"
                          min={1}
                          max={def.maxLimit || 50}
                          value={section.limit}
                          onChange={(e) => updateLimit(idx, Math.max(1, Math.min(def.maxLimit || 50, parseInt(e.target.value) || 1)))}
                          className="text-sm border border-gray-200 rounded-lg px-3 py-2 w-20 bg-white focus:outline-none focus:ring-2 focus:ring-[#58bdae]/40"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => toggleVisibility(idx)}
                  className={`p-2 rounded-lg transition-colors ${section.visible ? 'text-[#58bdae] hover:bg-[#58bdae]/10' : 'text-gray-400 hover:bg-gray-100'}`}
                  title={section.visible ? 'Hide section' : 'Show section'}
                >
                  {section.visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Featured Items */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-heading text-lg font-bold text-gray-900">Featured Items</h2>
          <p className="text-sm text-gray-500 mt-0.5">Pin specific items to top positions in any section.</p>
        </div>
        <div className="p-5">
          {config.featuredItems.length > 0 ? (
            <div className="space-y-3 mb-5">
              {config.featuredItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                  <span className="text-xs font-bold text-[#FF7F50]">#{item.position + 1}</span>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">{item.itemId}</span>
                    <span className="text-xs text-gray-400 ml-2">in {item.section}</span>
                  </div>
                  <button onClick={() => removeFeaturedItem(idx)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 mb-5">No featured items configured yet.</p>
          )}

          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 block mb-1">Section</label>
              <select
                value={featuredInput.section}
                onChange={(e) => setFeaturedInput((prev) => ({ ...prev, section: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#58bdae]/40"
              >
                <option value="">Select section...</option>
                {sections.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 block mb-1">Item ID (slug or ID)</label>
              <input
                type="text"
                value={featuredInput.itemId}
                onChange={(e) => setFeaturedInput((prev) => ({ ...prev, itemId: e.target.value }))}
                placeholder="e.g. coorg-coffee-trail"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#58bdae]/40"
              />
            </div>
            <button
              onClick={addFeaturedItem}
              disabled={!featuredInput.section || !featuredInput.itemId}
              className="flex items-center gap-1 bg-[#FF7F50] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#e5673e] disabled:opacity-40 transition-all"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
