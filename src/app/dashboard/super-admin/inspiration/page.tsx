'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import {
  FileText, Video, Headphones, Plus, Edit2, Trash2,
  Eye, EyeOff, X, Search, Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface InspirationItem {
  id: string;
  title: string;
  slug: string;
  type: string;
  content: string | null;
  embedUrl: string | null;
  thumbnail: string | null;
  excerpt: string | null;
  tags: string[];
  destinations: string[];
  activityTypes: string[];
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  author: { name: string; email: string };
}

const CONTENT_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'BLOG', label: 'Blog' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'PODCAST', label: 'Podcast' },
];

const TYPE_ICONS: Record<string, any> = {
  BLOG: FileText,
  VIDEO: Video,
  PODCAST: Headphones,
};

const TYPE_COLORS: Record<string, string> = {
  BLOG: 'text-blue-600 bg-blue-50',
  VIDEO: 'text-red-600 bg-red-50',
  PODCAST: 'text-purple-600 bg-purple-50',
};

export default function InspirationPage() {
  const [content, setContent] = useState<InspirationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<InspirationItem | null>(null);
  const [filterType, setFilterType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    type: 'BLOG',
    content: '',
    embedUrl: '',
    thumbnail: '',
    excerpt: '',
    tags: '',
    isPublished: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.set('type', filterType);
      const res = await fetch(`/api/admin/inspiration?${params}`);
      const data = await res.json();
      setContent(data.content || []);
    } catch { toast.error('Failed to load content'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchContent(); }, [filterType]);

  const resetForm = () => {
    setFormData({ title: '', type: 'BLOG', content: '', embedUrl: '', thumbnail: '', excerpt: '', tags: '', isPublished: false });
    setEditing(null);
    setShowForm(false);
  };

  const openEdit = (item: InspirationItem) => {
    setFormData({
      title: item.title,
      type: item.type,
      content: item.content || '',
      embedUrl: item.embedUrl || '',
      thumbnail: item.thumbnail || '',
      excerpt: item.excerpt || '',
      tags: item.tags.join(', '),
      isPublished: item.isPublished,
    });
    setEditing(item);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) { toast.error('Title is required'); return; }
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      };
      const url = editing ? `/api/admin/inspiration/${editing.id}` : '/api/admin/inspiration';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      toast.success(editing ? 'Updated successfully' : 'Created successfully');
      resetForm();
      fetchContent();
    } catch (err: any) { toast.error(err.message || 'Failed to save'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this content?')) return;
    try {
      const res = await fetch(`/api/admin/inspiration/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Deleted');
      fetchContent();
    } catch { toast.error('Failed to delete'); }
  };

  const togglePublish = async (item: InspirationItem) => {
    try {
      const res = await fetch(`/api/admin/inspiration/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !item.isPublished }),
      });
      if (!res.ok) throw new Error();
      toast.success(item.isPublished ? 'Unpublished' : 'Published');
      fetchContent();
    } catch { toast.error('Failed to update'); }
  };

  const filtered = content.filter(item =>
    !searchQuery || item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-heading text-btg-dark">Inspiration Content</h1>
          <p className="text-gray-600 mt-1">Manage blogs, videos, and podcasts</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" /> New Content
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-btg-terracotta/20 focus:border-btg-terracotta"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-btg-terracotta/20"
        >
          {CONTENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        {['All', 'BLOG', 'VIDEO', 'PODCAST'].map((type) => {
          const count = type === 'All' ? content.length : content.filter(c => c.type === type).length;
          const Icon = type === 'All' ? FileText : TYPE_ICONS[type];
          return (
            <Card key={type}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${type === 'All' ? 'bg-gray-100 text-gray-600' : TYPE_COLORS[type]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{count}</p>
                  <p className="text-xs text-gray-500">{type === 'All' ? 'Total' : `${type.charAt(0)}${type.slice(1).toLowerCase()}s`}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-btg-dark">{editing ? 'Edit Content' : 'New Content'}</h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Input label="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
              <Select label="Type" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} options={[
                { value: 'BLOG', label: 'Blog' },
                { value: 'VIDEO', label: 'Video' },
                { value: 'PODCAST', label: 'Podcast' },
              ]} />
              {formData.type === 'BLOG' && (
                <Textarea label="Content" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={8} />
              )}
              {(formData.type === 'VIDEO' || formData.type === 'PODCAST') && (
                <Input label="Embed URL" value={formData.embedUrl} onChange={(e) => setFormData({ ...formData, embedUrl: e.target.value })} placeholder="https://youtube.com/embed/..." />
              )}
              <Input label="Thumbnail URL" value={formData.thumbnail} onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })} placeholder="Upload via image upload or paste URL" />
              <Textarea label="Excerpt" value={formData.excerpt} onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })} rows={2} />
              <Input label="Tags (comma-separated)" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} placeholder="trekking, himalayas, adventure" />
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.isPublished} onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })} className="rounded border-gray-300" />
                <span className="text-sm text-gray-700">Publish immediately</span>
              </label>
              <div className="flex gap-3 pt-2">
                <Button type="submit" isLoading={submitting}>{editing ? 'Update' : 'Create'}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Content List */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-btg-terracotta"></div></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-gray-500">No content found. Create your first inspiration piece.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const Icon = TYPE_ICONS[item.type] || FileText;
            return (
              <Card key={item.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center ${TYPE_COLORS[item.type] || 'bg-gray-100 text-gray-600'}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          by {item.author.name} • {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                        {item.excerpt && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.excerpt}</p>}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <Badge size="sm" variant={item.isPublished ? 'success' : 'warning'}>
                            {item.isPublished ? 'Published' : 'Draft'}
                          </Badge>
                          <Badge size="sm" variant="info">{item.type}</Badge>
                          {item.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} size="sm" variant="outline">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => togglePublish(item)} className="p-2 text-gray-400 hover:text-btg-terracotta rounded-lg hover:bg-gray-50" title={item.isPublished ? 'Unpublish' : 'Publish'}>
                        {item.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button onClick={() => openEdit(item)} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-50">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
