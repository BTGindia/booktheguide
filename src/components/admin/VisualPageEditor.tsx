'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2, Save, Eye, EyeOff, ArrowUp, ArrowDown, GripVertical,
  CheckCircle2, AlertCircle, Type, Image, FileText, List,
  Layout, Palette, ChevronDown, ChevronRight, Edit3, X, Plus,
  Monitor, Smartphone, RotateCcw,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────

interface ContentBlock {
  id: string;
  type: 'heading' | 'text' | 'image' | 'hero' | 'features' | 'cta' | 'faq' | 'gallery' | 'stats' | 'cards';
  label: string;
  visible: boolean;
  content: Record<string, any>;
}

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

interface PageConfig {
  sectionOrder: SectionOrder[];
  featuredItems: FeaturedItem[];
  displaySettings: { settingKey: string; settingValue: string }[];
  contentBlocks: ContentBlock[];
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

interface VisualPageEditorProps {
  pageSlug: string;
  pageTitle: string;
  sections: SectionDefinition[];
  sortOptions?: { value: string; label: string }[];
}

// ── Block Templates ──────────────────────────────────────────────────────────

const BLOCK_TEMPLATES: { type: ContentBlock['type']; label: string; icon: any; defaultContent: Record<string, any> }[] = [
  { type: 'heading', label: 'Heading', icon: Type, defaultContent: { title: 'Section Title', subtitle: '' } },
  { type: 'text', label: 'Text Block', icon: FileText, defaultContent: { body: 'Enter your content here...' } },
  { type: 'image', label: 'Image', icon: Image, defaultContent: { url: '', alt: '', caption: '' } },
  { type: 'hero', label: 'Hero Banner', icon: Layout, defaultContent: { title: 'Page Title', subtitle: 'Description text', ctaText: 'Explore', ctaLink: '/', backgroundImage: '' } },
  { type: 'features', label: 'Feature Cards', icon: List, defaultContent: { items: [{ title: 'Feature 1', description: 'Description', icon: '' }] } },
  { type: 'cta', label: 'Call to Action', icon: Palette, defaultContent: { title: 'Ready to explore?', subtitle: '', buttonText: 'Get Started', buttonLink: '/' } },
  { type: 'faq', label: 'FAQ Section', icon: List, defaultContent: { title: 'Frequently Asked Questions', items: [{ question: 'Question?', answer: 'Answer.' }] } },
  { type: 'stats', label: 'Statistics', icon: List, defaultContent: { items: [{ label: 'Stat', value: '100+' }] } },
];

const DEFAULT_SORT_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'highest_booked', label: 'Highest Booked First' },
  { value: 'best_rated', label: 'Best Rated First' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'most_reviewed', label: 'Most Reviewed First' },
];

// ── Inline Editor Components ──────────────────────────────────────────────────

function InlineTextEditor({ value, onChange, placeholder, multiline, className }: {
  value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean; className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    return multiline ? (
      <textarea
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { onChange(draft); setEditing(false); }}
        onKeyDown={(e) => { if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
        className={`w-full bg-white border-2 border-[#58bdae] rounded-lg px-3 py-2 text-sm focus:outline-none resize-y min-h-[80px] ${className || ''}`}
        placeholder={placeholder}
      />
    ) : (
      <input
        autoFocus
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { onChange(draft); setEditing(false); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { onChange(draft); setEditing(false); }
          if (e.key === 'Escape') { setDraft(value); setEditing(false); }
        }}
        className={`w-full bg-white border-2 border-[#58bdae] rounded-lg px-3 py-2 text-sm focus:outline-none ${className || ''}`}
        placeholder={placeholder}
      />
    );
  }

  return (
    <div
      onClick={() => { setDraft(value); setEditing(true); }}
      className={`cursor-text rounded-lg px-3 py-2 border border-dashed border-transparent hover:border-[#58bdae]/40 hover:bg-[#58bdae]/5 transition-all group ${className || ''}`}
    >
      <span className={value ? 'text-gray-900' : 'text-gray-400 italic'}>
        {value || placeholder || 'Click to edit...'}
      </span>
      <Edit3 className="w-3 h-3 text-[#58bdae] opacity-0 group-hover:opacity-100 inline ml-2 transition-opacity" />
    </div>
  );
}

// ── Block Renderers (Visual Preview) ──────────────────────────────────────────

function BlockPreview({ block, onUpdate }: { block: ContentBlock; onUpdate: (content: Record<string, any>) => void }) {
  const { type, content } = block;

  switch (type) {
    case 'hero':
      return (
        <div className="relative bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl overflow-hidden">
          <div className="p-8 text-center">
            <InlineTextEditor
              value={content.title || ''}
              onChange={(v) => onUpdate({ ...content, title: v })}
              placeholder="Hero Title"
              className="!text-2xl !font-bold !text-white !bg-transparent !border-white/30"
            />
            <InlineTextEditor
              value={content.subtitle || ''}
              onChange={(v) => onUpdate({ ...content, subtitle: v })}
              placeholder="Hero subtitle..."
              className="!text-sm !text-white/70 !bg-transparent !border-white/20 mt-2"
            />
            <div className="mt-4 flex justify-center gap-3">
              <InlineTextEditor
                value={content.ctaText || ''}
                onChange={(v) => onUpdate({ ...content, ctaText: v })}
                placeholder="Button text"
                className="!bg-[#58bdae] !text-white !rounded-full !px-6 !py-2 !text-sm !font-bold !inline-block !w-auto"
              />
            </div>
            <div className="mt-3">
              <label className="text-xs text-white/40">CTA Link:</label>
              <InlineTextEditor
                value={content.ctaLink || ''}
                onChange={(v) => onUpdate({ ...content, ctaLink: v })}
                placeholder="/explore"
                className="!text-xs !text-white/50 !bg-transparent"
              />
            </div>
          </div>
        </div>
      );

    case 'heading':
      return (
        <div className="py-4">
          <InlineTextEditor
            value={content.title || ''}
            onChange={(v) => onUpdate({ ...content, title: v })}
            placeholder="Section Heading"
            className="!text-xl !font-bold !text-gray-900"
          />
          {(content.subtitle || true) && (
            <InlineTextEditor
              value={content.subtitle || ''}
              onChange={(v) => onUpdate({ ...content, subtitle: v })}
              placeholder="Optional subtitle..."
              className="!text-sm !text-gray-500 mt-1"
            />
          )}
        </div>
      );

    case 'text':
      return (
        <div className="py-3">
          <InlineTextEditor
            value={content.body || ''}
            onChange={(v) => onUpdate({ ...content, body: v })}
            placeholder="Enter your text content here..."
            multiline
            className="!text-sm !text-gray-700 !leading-relaxed"
          />
        </div>
      );

    case 'image':
      return (
        <div className="py-3">
          <div className="bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 p-6 text-center">
            {content.url ? (
              <img src={content.url} alt={content.alt || ''} className="max-h-40 mx-auto rounded-lg object-cover" />
            ) : (
              <div className="text-gray-400">
                <Image className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Image placeholder</p>
              </div>
            )}
            <InlineTextEditor
              value={content.url || ''}
              onChange={(v) => onUpdate({ ...content, url: v })}
              placeholder="Enter image URL..."
              className="!text-xs !text-gray-500 mt-3"
            />
            <InlineTextEditor
              value={content.alt || ''}
              onChange={(v) => onUpdate({ ...content, alt: v })}
              placeholder="Alt text..."
              className="!text-xs !text-gray-400 mt-1"
            />
          </div>
        </div>
      );

    case 'features':
      return (
        <div className="py-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(content.items || []).map((item: any, idx: number) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100 group relative">
                <InlineTextEditor
                  value={item.title || ''}
                  onChange={(v) => {
                    const items = [...(content.items || [])];
                    items[idx] = { ...items[idx], title: v };
                    onUpdate({ ...content, items });
                  }}
                  placeholder="Feature title"
                  className="!font-bold !text-sm"
                />
                <InlineTextEditor
                  value={item.description || ''}
                  onChange={(v) => {
                    const items = [...(content.items || [])];
                    items[idx] = { ...items[idx], description: v };
                    onUpdate({ ...content, items });
                  }}
                  placeholder="Feature description"
                  className="!text-xs !text-gray-500 mt-1"
                />
                <button
                  onClick={() => {
                    const items = (content.items || []).filter((_: any, i: number) => i !== idx);
                    onUpdate({ ...content, items });
                  }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              const items = [...(content.items || []), { title: '', description: '', icon: '' }];
              onUpdate({ ...content, items });
            }}
            className="mt-3 flex items-center gap-1 text-xs text-[#58bdae] font-medium hover:underline"
          >
            <Plus className="w-3 h-3" /> Add Feature
          </button>
        </div>
      );

    case 'cta':
      return (
        <div className="bg-gradient-to-r from-[#58bdae]/10 to-[#FF7F50]/10 rounded-xl p-6 text-center">
          <InlineTextEditor
            value={content.title || ''}
            onChange={(v) => onUpdate({ ...content, title: v })}
            placeholder="CTA Title"
            className="!text-lg !font-bold"
          />
          <InlineTextEditor
            value={content.subtitle || ''}
            onChange={(v) => onUpdate({ ...content, subtitle: v })}
            placeholder="Subtitle text..."
            className="!text-sm !text-gray-500 mt-1"
          />
          <div className="mt-3 flex justify-center gap-3">
            <InlineTextEditor
              value={content.buttonText || ''}
              onChange={(v) => onUpdate({ ...content, buttonText: v })}
              placeholder="Button"
              className="!bg-[#FF7F50] !text-white !rounded-full !px-5 !py-2 !text-sm !font-bold !inline-block !w-auto"
            />
          </div>
          <InlineTextEditor
            value={content.buttonLink || ''}
            onChange={(v) => onUpdate({ ...content, buttonLink: v })}
            placeholder="/link"
            className="!text-xs !text-gray-400 mt-2"
          />
        </div>
      );

    case 'faq':
      return (
        <div className="py-3">
          <InlineTextEditor
            value={content.title || ''}
            onChange={(v) => onUpdate({ ...content, title: v })}
            placeholder="FAQ Section Title"
            className="!text-lg !font-bold mb-3"
          />
          <div className="space-y-2">
            {(content.items || []).map((item: any, idx: number) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100 group relative">
                <InlineTextEditor
                  value={item.question || ''}
                  onChange={(v) => {
                    const items = [...(content.items || [])];
                    items[idx] = { ...items[idx], question: v };
                    onUpdate({ ...content, items });
                  }}
                  placeholder="Question?"
                  className="!font-semibold !text-sm"
                />
                <InlineTextEditor
                  value={item.answer || ''}
                  onChange={(v) => {
                    const items = [...(content.items || [])];
                    items[idx] = { ...items[idx], answer: v };
                    onUpdate({ ...content, items });
                  }}
                  placeholder="Answer..."
                  multiline
                  className="!text-sm !text-gray-600 mt-2"
                />
                <button
                  onClick={() => {
                    const items = (content.items || []).filter((_: any, i: number) => i !== idx);
                    onUpdate({ ...content, items });
                  }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              const items = [...(content.items || []), { question: '', answer: '' }];
              onUpdate({ ...content, items });
            }}
            className="mt-3 flex items-center gap-1 text-xs text-[#58bdae] font-medium hover:underline"
          >
            <Plus className="w-3 h-3" /> Add FAQ
          </button>
        </div>
      );

    case 'stats':
      return (
        <div className="py-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(content.items || []).map((item: any, idx: number) => (
              <div key={idx} className="bg-[#58bdae]/5 rounded-xl p-4 text-center border border-[#58bdae]/10 group relative">
                <InlineTextEditor
                  value={item.value || ''}
                  onChange={(v) => {
                    const items = [...(content.items || [])];
                    items[idx] = { ...items[idx], value: v };
                    onUpdate({ ...content, items });
                  }}
                  placeholder="100+"
                  className="!text-2xl !font-bold !text-[#58bdae]"
                />
                <InlineTextEditor
                  value={item.label || ''}
                  onChange={(v) => {
                    const items = [...(content.items || [])];
                    items[idx] = { ...items[idx], label: v };
                    onUpdate({ ...content, items });
                  }}
                  placeholder="Label"
                  className="!text-xs !text-gray-500"
                />
                <button
                  onClick={() => {
                    const items = (content.items || []).filter((_: any, i: number) => i !== idx);
                    onUpdate({ ...content, items });
                  }}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              const items = [...(content.items || []), { label: '', value: '' }];
              onUpdate({ ...content, items });
            }}
            className="mt-3 flex items-center gap-1 text-xs text-[#58bdae] font-medium hover:underline"
          >
            <Plus className="w-3 h-3" /> Add Stat
          </button>
        </div>
      );

    default:
      return <div className="py-3 text-gray-400 text-sm">Unknown block type: {type}</div>;
  }
}

// ── Main Visual Editor ──────────────────────────────────────────────────

export default function VisualPageEditor({ pageSlug, pageTitle, sections, sortOptions }: VisualPageEditorProps) {
  const [config, setConfig] = useState<PageConfig>({
    sectionOrder: [],
    featuredItems: [],
    displaySettings: [],
    contentBlocks: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState<'visual' | 'sections'>('visual');
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  const sorts = sortOptions || DEFAULT_SORT_OPTIONS;

  useEffect(() => {
    fetch(`/api/ui-manager/configs/${pageSlug}`)
      .then((res) => res.json())
      .then((data) => {
        const c = data.config;
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
          contentBlocks: c.contentBlocks || [],
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
          contentBlocks: config.contentBlocks,
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

  // ── Section Handlers ──────

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

  const getSectionDef = (key: string) => sections.find((s) => s.key === key);

  // ── Block Handlers ──────

  const addBlock = (type: ContentBlock['type']) => {
    const template = BLOCK_TEMPLATES.find((t) => t.type === type);
    if (!template) return;
    const newBlock: ContentBlock = {
      id: `block_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      label: template.label,
      visible: true,
      content: { ...template.defaultContent },
    };
    setConfig((prev) => ({ ...prev, contentBlocks: [...prev.contentBlocks, newBlock] }));
    setShowAddBlock(false);
  };

  const updateBlock = (blockId: string, content: Record<string, any>) => {
    setConfig((prev) => ({
      ...prev,
      contentBlocks: prev.contentBlocks.map((b) => b.id === blockId ? { ...b, content } : b),
    }));
  };

  const removeBlock = (blockId: string) => {
    setConfig((prev) => ({
      ...prev,
      contentBlocks: prev.contentBlocks.filter((b) => b.id !== blockId),
    }));
  };

  const moveBlock = (blockId: string, dir: -1 | 1) => {
    setConfig((prev) => {
      const blocks = [...prev.contentBlocks];
      const idx = blocks.findIndex((b) => b.id === blockId);
      const swapIdx = idx + dir;
      if (idx < 0 || swapIdx < 0 || swapIdx >= blocks.length) return prev;
      [blocks[idx], blocks[swapIdx]] = [blocks[swapIdx], blocks[idx]];
      return { ...prev, contentBlocks: blocks };
    });
  };

  const toggleBlockVisibility = (blockId: string) => {
    setConfig((prev) => ({
      ...prev,
      contentBlocks: prev.contentBlocks.map((b) => b.id === blockId ? { ...b, visible: !b.visible } : b),
    }));
  };

  const toggleSectionExpand = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-6">
      {/* ── Toolbar ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between sticky top-20 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold font-heading text-btg-dark">{pageTitle}</h1>
          {config.updatedAt && (
            <span className="text-xs text-gray-400">
              Last saved: {new Date(config.updatedAt).toLocaleString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Tab Switcher */}
          <div className="bg-gray-100 rounded-xl p-1 flex">
            <button
              onClick={() => setActiveTab('visual')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'visual' ? 'bg-white text-[#58bdae] shadow-sm' : 'text-gray-500'
              }`}
            >
              <Layout className="w-3.5 h-3.5 inline mr-1" />
              Visual Editor
            </button>
            <button
              onClick={() => setActiveTab('sections')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'sections' ? 'bg-white text-[#58bdae] shadow-sm' : 'text-gray-500'
              }`}
            >
              <List className="w-3.5 h-3.5 inline mr-1" />
              Section Config
            </button>
          </div>

          {/* Preview Toggle */}
          <div className="bg-gray-100 rounded-lg p-1 flex">
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`p-1.5 rounded ${previewMode === 'desktop' ? 'bg-white shadow-sm' : ''}`}
            >
              <Monitor className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`p-1.5 rounded ${previewMode === 'mobile' ? 'bg-white shadow-sm' : ''}`}
            >
              <Smartphone className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-[#58bdae] text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-[#4aa99a] disabled:opacity-50 transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>
      </div>

      {/* Save Status */}
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

      {/* ── Visual Editor Tab ── */}
      {activeTab === 'visual' && (
        <div className={`mx-auto transition-all ${previewMode === 'mobile' ? 'max-w-[390px]' : 'max-w-full'}`}>
          {/* Page Canvas */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-lg">
            {/* Browser Chrome */}
            <div className="bg-gray-100 px-4 py-2 flex items-center gap-2 border-b border-gray-200">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 bg-white rounded-lg px-3 py-1 text-xs text-gray-400 text-center">
                booktheguide.com/{pageSlug === 'homepage' ? '' : pageSlug}
              </div>
              <RotateCcw className="w-3.5 h-3.5 text-gray-400" />
            </div>

            {/* Content Blocks */}
            <div className="min-h-[400px]">
              {config.contentBlocks.length === 0 && config.sectionOrder.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Layout className="w-12 h-12 mb-3" />
                  <p className="text-lg font-medium">Start building your page</p>
                  <p className="text-sm mt-1">Add content blocks or configure section ordering below.</p>
                </div>
              ) : (
                <>
                  {/* Content Blocks */}
                  {config.contentBlocks.map((block, idx) => (
                    <div
                      key={block.id}
                      className={`group relative border-b border-dashed border-gray-200 transition-all ${
                        !block.visible ? 'opacity-40' : ''
                      }`}
                    >
                      {/* Block Controls */}
                      <div className="absolute -left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-gray-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 z-10">
                        <button onClick={() => moveBlock(block.id, -1)} disabled={idx === 0} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30">
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <GripVertical className="w-3.5 h-3.5 text-gray-300" />
                        <button onClick={() => moveBlock(block.id, 1)} disabled={idx === config.contentBlocks.length - 1} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30">
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Block Label */}
                      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <span className="text-[10px] bg-[#58bdae] text-white px-2 py-0.5 rounded-full font-bold">{block.label}</span>
                        <button onClick={() => toggleBlockVisibility(block.id)} className="p-1 hover:bg-gray-100 rounded">
                          {block.visible ? <Eye className="w-3.5 h-3.5 text-gray-500" /> : <EyeOff className="w-3.5 h-3.5 text-gray-400" />}
                        </button>
                        <button onClick={() => removeBlock(block.id)} className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Block Content */}
                      <div className="px-6 py-2 ml-8">
                        <BlockPreview block={block} onUpdate={(content) => updateBlock(block.id, content)} />
                      </div>
                    </div>
                  ))}

                  {/* Section Indicators */}
                  {config.sectionOrder.filter(s => s.visible).map((section) => {
                    const def = getSectionDef(section.sectionKey);
                    if (!def) return null;
                    return (
                      <div key={section.sectionKey} className="border-b border-dashed border-gray-200 px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#FF7F50]/10 flex items-center justify-center">
                            <Layout className="w-4 h-4 text-[#FF7F50]" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-700">{def.label}</p>
                            <p className="text-xs text-gray-400">
                              Dynamic section — {section.sortBy !== 'default' ? `Sorted by ${section.sortBy}` : 'Default order'}
                              {section.limit ? ` · Max ${section.limit} items` : ''}
                            </p>
                          </div>
                          <span className="ml-auto text-[10px] bg-[#FF7F50]/10 text-[#FF7F50] px-2 py-0.5 rounded-full font-bold">
                            Auto-populated
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {/* Add Block Button */}
              <div className="p-4 text-center border-t border-dashed border-gray-200">
                <button
                  onClick={() => setShowAddBlock(!showAddBlock)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-50 hover:bg-[#58bdae]/5 border-2 border-dashed border-gray-300 hover:border-[#58bdae] rounded-xl text-sm font-medium text-gray-500 hover:text-[#58bdae] transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add Content Block
                </button>
              </div>

              {/* Block Picker */}
              {showAddBlock && (
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                  <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Choose a block type:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {BLOCK_TEMPLATES.map((template) => (
                      <button
                        key={template.type}
                        onClick={() => addBlock(template.type)}
                        className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:border-[#58bdae] hover:shadow-md transition-all group"
                      >
                        <template.icon className="w-6 h-6 text-gray-400 group-hover:text-[#58bdae] transition-colors" />
                        <span className="text-xs font-medium text-gray-600 group-hover:text-[#58bdae]">{template.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Section Config Tab ── */}
      {activeTab === 'sections' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-heading text-lg font-bold text-gray-900">Section Order &amp; Sorting</h2>
            <p className="text-sm text-gray-500 mt-0.5">Reorder sections and configure sort criteria for dynamic content.</p>
          </div>
          <div className="divide-y divide-gray-50">
            {config.sectionOrder.map((section, idx) => {
              const def = getSectionDef(section.sectionKey);
              if (!def) return null;
              const isExpanded = expandedSections.has(section.sectionKey);
              return (
                <div
                  key={section.sectionKey}
                  className={`transition-all ${!section.visible ? 'opacity-50 bg-gray-50/50' : ''}`}
                >
                  <div className="p-5 flex items-center gap-4 cursor-pointer" onClick={() => toggleSectionExpand(section.sectionKey)}>
                    <div className="flex flex-col gap-1">
                      <button onClick={(e) => { e.stopPropagation(); moveSection(idx, -1); }} disabled={idx === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <GripVertical className="w-4 h-4 text-gray-300" />
                      <button onClick={(e) => { e.stopPropagation(); moveSection(idx, 1); }} disabled={idx === config.sectionOrder.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-[#58bdae] bg-[#58bdae]/10 px-2 py-0.5 rounded">#{idx + 1}</span>
                        <h3 className="font-heading font-bold text-gray-900">{def.label}</h3>
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{def.description}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleVisibility(idx); }}
                      className={`p-2 rounded-lg transition-colors ${section.visible ? 'text-[#58bdae] hover:bg-[#58bdae]/10' : 'text-gray-400 hover:bg-gray-100'}`}
                    >
                      {section.visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="px-5 pb-5 pl-16 flex flex-wrap gap-4">
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
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
