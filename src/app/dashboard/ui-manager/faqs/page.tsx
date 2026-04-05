'use client';

import { useState, useEffect } from 'react';
import { HelpCircle, Plus, Trash2, Edit2, X, ChevronDown, ChevronUp, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  entityId: string | null;
  entityName: string | null;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
}

const FAQ_CATEGORIES = ['GENERAL', 'STATE', 'DESTINATION', 'EXPERIENCE', 'BOOKING'] as const;

export default function FAQsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState<string>('GENERAL');
  const [entityId, setEntityId] = useState('');
  const [entityName, setEntityName] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchFaqs();
  }, []);

  async function fetchFaqs() {
    try {
      const res = await fetch('/api/ui-manager/faqs');
      const data = await res.json();
      if (data.faqs) setFaqs(data.faqs);
    } catch {
      toast.error('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  }

  function openEditor(faq?: FAQ) {
    if (faq) {
      setEditingFaq(faq);
      setQuestion(faq.question);
      setAnswer(faq.answer);
      setCategory(faq.category);
      setEntityId(faq.entityId || '');
      setEntityName(faq.entityName || '');
      setSortOrder(faq.sortOrder);
    } else {
      setEditingFaq(null);
      setQuestion('');
      setAnswer('');
      setCategory('GENERAL');
      setEntityId('');
      setEntityName('');
      setSortOrder(0);
    }
    setShowEditor(true);
  }

  function closeEditor() {
    setShowEditor(false);
    setEditingFaq(null);
  }

  async function handleSave() {
    if (!question.trim() || !answer.trim()) {
      toast.error('Question and answer are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        question,
        answer,
        category,
        entityId: entityId || null,
        entityName: entityName || null,
        sortOrder,
      };

      if (editingFaq) {
        const res = await fetch('/api/ui-manager/faqs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingFaq.id, ...payload }),
        });
        if (!res.ok) throw new Error();
        toast.success('FAQ updated');
      } else {
        const res = await fetch('/api/ui-manager/faqs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        toast.success('FAQ created');
      }
      closeEditor();
      fetchFaqs();
    } catch {
      toast.error('Failed to save FAQ');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this FAQ? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/ui-manager/faqs?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('FAQ deleted');
      fetchFaqs();
    } catch {
      toast.error('Failed to delete');
    }
  }

  const filtered = faqs.filter(f => {
    if (filterCategory !== 'ALL' && f.category !== filterCategory) return false;
    if (searchQuery && !f.question.toLowerCase().includes(searchQuery.toLowerCase()) && !f.answer.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Group by category
  const grouped = filtered.reduce<Record<string, FAQ[]>>((acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = [];
    acc[faq.category].push(faq);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#58bdae]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-btg-dark flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-[#58bdae]" />
            FAQ Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage frequently asked questions across all pages</p>
        </div>
        <button
          onClick={() => openEditor()}
          className="flex items-center gap-2 px-4 py-2 bg-[#58bdae] text-white rounded-lg hover:bg-[#4aa89a] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New FAQ
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#58bdae]/20 focus:border-[#58bdae]"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {['ALL', ...FAQ_CATEGORIES].map(c => (
            <button
              key={c}
              onClick={() => setFilterCategory(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterCategory === c
                  ? 'bg-[#58bdae] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {c === 'ALL' ? 'All' : c.charAt(0) + c.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {['ALL', ...FAQ_CATEGORIES].map(cat => (
          <div key={cat} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-2xl font-bold text-btg-dark">
              {cat === 'ALL' ? faqs.length : faqs.filter(f => f.category === cat).length}
            </p>
            <p className="text-xs text-gray-500">{cat === 'ALL' ? 'Total' : cat.charAt(0) + cat.slice(1).toLowerCase()}</p>
          </div>
        ))}
      </div>

      {/* FAQ List grouped by category */}
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No FAQs found</p>
          <p className="text-sm text-gray-400 mt-1">Create your first FAQ to get started</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-sm text-btg-dark">
                  {cat.charAt(0) + cat.slice(1).toLowerCase()} FAQs
                  <span className="ml-2 text-xs text-gray-400 font-normal">({items.length})</span>
                </h3>
              </div>
              <div className="divide-y divide-gray-50">
                {items.map(faq => (
                  <div key={faq.id} className="px-5 py-3">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                        className="p-1 mt-0.5 hover:bg-gray-100 rounded"
                      >
                        {expandedId === faq.id ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-btg-dark">{faq.question}</p>
                        {expandedId === faq.id && (
                          <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{faq.answer}</p>
                        )}
                        {faq.entityName && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded-full">
                            {faq.entityName}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => openEditor(faq)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(faq.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-lg font-bold text-btg-dark">
                {editingFaq ? 'Edit FAQ' : 'New FAQ'}
              </h2>
              <button onClick={closeEditor} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Category */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Category *</label>
                <div className="flex gap-2 flex-wrap">
                  {FAQ_CATEGORIES.map(c => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        category === c
                          ? 'bg-[#58bdae] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {c.charAt(0) + c.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Entity (for STATE/DESTINATION/EXPERIENCE) */}
              {category !== 'GENERAL' && category !== 'BOOKING' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Entity ID</label>
                    <input
                      type="text"
                      value={entityId}
                      onChange={e => setEntityId(e.target.value)}
                      placeholder="e.g. himachal-pradesh"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#58bdae]/20 focus:border-[#58bdae]"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Entity Name</label>
                    <input
                      type="text"
                      value={entityName}
                      onChange={e => setEntityName(e.target.value)}
                      placeholder="e.g. Himachal Pradesh"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#58bdae]/20 focus:border-[#58bdae]"
                    />
                  </div>
                </div>
              )}

              {/* Question */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Question *</label>
                <input
                  type="text"
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="What is the best time to visit...?"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#58bdae]/20 focus:border-[#58bdae]"
                />
              </div>

              {/* Answer */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Answer *</label>
                <textarea
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder="Write a detailed answer..."
                  rows={5}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#58bdae]/20 focus:border-[#58bdae] resize-y"
                />
              </div>

              {/* Sort Order */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Sort Order</label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={e => setSortOrder(parseInt(e.target.value) || 0)}
                  min={0}
                  className="w-24 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#58bdae]/20 focus:border-[#58bdae]"
                />
                <p className="text-xs text-gray-400 mt-1">Lower numbers appear first</p>
              </div>
            </div>

            <div className="border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
              <button onClick={closeEditor} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-[#58bdae] text-white text-sm font-medium rounded-lg hover:bg-[#4aa89a] disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : editingFaq ? 'Update FAQ' : 'Create FAQ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
