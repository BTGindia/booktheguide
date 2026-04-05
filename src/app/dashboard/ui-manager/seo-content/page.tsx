'use client';

import { useState, useEffect } from 'react';
import { Globe, Search, MapPin, Mountain, Save, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface State {
  id: string;
  name: string;
  slug: string;
}

interface Destination {
  id: string;
  name: string;
  slug: string;
  city: { state: { name: string } };
}

interface PageContentEntry {
  id: string;
  pageType: string;
  entityId: string;
  entityName: string | null;
  content: any;
  updatedAt: string;
}

type Tab = 'states' | 'destinations';

export default function SEOContentPage() {
  const [tab, setTab] = useState<Tab>('states');
  const [states, setStates] = useState<State[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [contents, setContents] = useState<PageContentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Editor state
  const [selectedEntity, setSelectedEntity] = useState<{ id: string; name: string; type: string } | null>(null);
  const [editorContent, setEditorContent] = useState({
    metaTitle: '',
    metaDescription: '',
    heading: '',
    introduction: '',
    body: '',
    tips: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/states').then(r => r.json()),
      fetch('/api/destinations').then(r => r.json()),
      fetch('/api/ui-manager/content').then(r => r.json()),
    ]).then(([stateData, destData, contentData]) => {
      setStates(stateData.states || []);
      setDestinations(destData.destinations || []);
      setContents(contentData.contents || []);
    }).catch(() => {
      toast.error('Failed to load data');
    }).finally(() => setLoading(false));
  }, []);

  function selectEntity(id: string, name: string, type: string) {
    setSelectedEntity({ id, name, type });
    const existing = contents.find(c => c.entityId === id && c.pageType === type);
    if (existing?.content) {
      const c = existing.content;
      setEditorContent({
        metaTitle: c.metaTitle || '',
        metaDescription: c.metaDescription || '',
        heading: c.heading || '',
        introduction: c.introduction || '',
        body: c.body || '',
        tips: c.tips || '',
      });
    } else {
      setEditorContent({ metaTitle: '', metaDescription: '', heading: '', introduction: '', body: '', tips: '' });
    }
  }

  async function handleSave() {
    if (!selectedEntity) return;
    setSaving(true);
    try {
      const res = await fetch('/api/ui-manager/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageType: selectedEntity.type,
          entityId: selectedEntity.id,
          entityName: selectedEntity.name,
          content: editorContent,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Content saved');
      // Refresh contents
      const data = await fetch('/api/ui-manager/content').then(r => r.json());
      setContents(data.contents || []);
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  function hasContent(entityId: string, type: string) {
    return contents.some(c => c.entityId === entityId && c.pageType === type);
  }

  const filteredStates = states.filter(s =>
    !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDestinations = destinations.filter(d =>
    !searchQuery || d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <div>
        <h1 className="text-2xl font-bold font-heading text-btg-dark flex items-center gap-2">
          <Globe className="w-6 h-6 text-[#58bdae]" />
          SEO Content
        </h1>
        <p className="text-sm text-gray-500 mt-1">Write SEO descriptions, meta tags, and content for all states and destinations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-2xl font-bold text-btg-dark">{states.length}</p>
          <p className="text-xs text-gray-500">States</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-2xl font-bold text-btg-dark">{destinations.length}</p>
          <p className="text-xs text-gray-500">Destinations</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-2xl font-bold text-green-600">{contents.filter(c => c.pageType === 'STATE').length}</p>
          <p className="text-xs text-gray-500">States with Content</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-2xl font-bold text-green-600">{contents.filter(c => c.pageType === 'DESTINATION').length}</p>
          <p className="text-xs text-gray-500">Destinations with Content</p>
        </div>
      </div>

      <div className="flex gap-6 min-h-[500px]">
        {/* Sidebar - Entity List */}
        <div className="w-80 flex-shrink-0 bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => { setTab('states'); setSelectedEntity(null); setSearchQuery(''); }}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                tab === 'states' ? 'text-[#58bdae] border-b-2 border-[#58bdae]' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Mountain className="w-4 h-4" /> States
            </button>
            <button
              onClick={() => { setTab('destinations'); setSelectedEntity(null); setSearchQuery(''); }}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                tab === 'destinations' ? 'text-[#58bdae] border-b-2 border-[#58bdae]' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <MapPin className="w-4 h-4" /> Destinations
            </button>
          </div>

          {/* Search */}
          <div className="p-3 border-b border-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${tab}...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#58bdae]/20 focus:border-[#58bdae]"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {tab === 'states' ? (
              filteredStates.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No states found</p>
              ) : (
                filteredStates.map(s => (
                  <button
                    key={s.id}
                    onClick={() => selectEntity(s.id, s.name, 'STATE')}
                    className={`w-full text-left px-4 py-3 text-sm border-b border-gray-50 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                      selectedEntity?.id === s.id ? 'bg-[#58bdae]/5 border-l-2 border-l-[#58bdae]' : ''
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Mountain className="w-3.5 h-3.5 text-gray-400" />
                      {s.name}
                    </span>
                    <span className="flex items-center gap-1">
                      {hasContent(s.id, 'STATE') && (
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                      )}
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                    </span>
                  </button>
                ))
              )
            ) : (
              filteredDestinations.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No destinations found</p>
              ) : (
                filteredDestinations.map(d => (
                  <button
                    key={d.id}
                    onClick={() => selectEntity(d.id, d.name, 'DESTINATION')}
                    className={`w-full text-left px-4 py-3 text-sm border-b border-gray-50 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                      selectedEntity?.id === d.id ? 'bg-[#58bdae]/5 border-l-2 border-l-[#58bdae]' : ''
                    }`}
                  >
                    <span className="flex flex-col">
                      <span className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        {d.name}
                      </span>
                      <span className="text-[10px] text-gray-400 ml-5.5">{d.city?.state?.name}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      {hasContent(d.id, 'DESTINATION') && (
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                      )}
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                    </span>
                  </button>
                ))
              )
            )}
          </div>
        </div>

        {/* Editor Panel */}
        <div className="flex-1 bg-white rounded-xl border border-gray-100 overflow-hidden">
          {!selectedEntity ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <Globe className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Select a state or destination</p>
                <p className="text-sm text-gray-400 mt-1">Choose from the list to write SEO content</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Editor Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div>
                  <h2 className="font-bold text-btg-dark">{selectedEntity.name}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{selectedEntity.type} SEO Content</p>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-[#58bdae] text-white text-sm font-medium rounded-lg hover:bg-[#4aa89a] disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Content'}
                </button>
              </div>

              {/* Editor Fields */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Meta Title</label>
                    <input
                      type="text"
                      value={editorContent.metaTitle}
                      onChange={e => setEditorContent({ ...editorContent, metaTitle: e.target.value })}
                      placeholder={`Best of ${selectedEntity.name} | Book The Guide`}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#58bdae]/20 focus:border-[#58bdae]"
                    />
                    <p className="text-xs text-gray-400 mt-1">{editorContent.metaTitle.length}/60 characters</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Page Heading (H1)</label>
                    <input
                      type="text"
                      value={editorContent.heading}
                      onChange={e => setEditorContent({ ...editorContent, heading: e.target.value })}
                      placeholder={`Explore ${selectedEntity.name}`}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#58bdae]/20 focus:border-[#58bdae]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Meta Description</label>
                  <textarea
                    value={editorContent.metaDescription}
                    onChange={e => setEditorContent({ ...editorContent, metaDescription: e.target.value })}
                    placeholder="Discover the best experiences, local guides, and hidden gems..."
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#58bdae]/20 focus:border-[#58bdae] resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">{editorContent.metaDescription.length}/160 characters</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Introduction</label>
                  <textarea
                    value={editorContent.introduction}
                    onChange={e => setEditorContent({ ...editorContent, introduction: e.target.value })}
                    placeholder={`Write an engaging introduction about ${selectedEntity.name}...`}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#58bdae]/20 focus:border-[#58bdae] resize-y"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Main Content</label>
                  <textarea
                    value={editorContent.body}
                    onChange={e => setEditorContent({ ...editorContent, body: e.target.value })}
                    placeholder="Detailed description, highlights, best time to visit, things to do... (supports HTML)"
                    rows={8}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-[#58bdae]/20 focus:border-[#58bdae] resize-y"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Travel Tips</label>
                  <textarea
                    value={editorContent.tips}
                    onChange={e => setEditorContent({ ...editorContent, tips: e.target.value })}
                    placeholder="Pro tips for travelers visiting this area..."
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#58bdae]/20 focus:border-[#58bdae] resize-y"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
