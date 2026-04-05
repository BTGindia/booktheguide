'use client';

import { useState, useEffect } from 'react';
import { PenTool, Plus, Trash2, Eye, EyeOff, Edit2, X, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

interface Blog {
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
  author: { name: string | null; email: string };
}

const CONTENT_TYPES = ['BLOG', 'VIDEO', 'PODCAST'] as const;

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Form state
  const [title, setTitle] = useState('');
  const [type, setType] = useState<string>('BLOG');
  const [content, setContent] = useState('');
  const [embedUrl, setEmbedUrl] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBlogs();
  }, []);

  async function fetchBlogs() {
    try {
      const res = await fetch('/api/ui-manager/blogs');
      const data = await res.json();
      if (data.blogs) setBlogs(data.blogs);
    } catch {
      toast.error('Failed to load blogs');
    } finally {
      setLoading(false);
    }
  }

  function openEditor(blog?: Blog) {
    if (blog) {
      setEditingBlog(blog);
      setTitle(blog.title);
      setType(blog.type);
      setContent(blog.content || '');
      setEmbedUrl(blog.embedUrl || '');
      setThumbnail(blog.thumbnail || '');
      setExcerpt(blog.excerpt || '');
      setTagsInput(blog.tags.join(', '));
      setIsPublished(blog.isPublished);
    } else {
      setEditingBlog(null);
      setTitle('');
      setType('BLOG');
      setContent('');
      setEmbedUrl('');
      setThumbnail('');
      setExcerpt('');
      setTagsInput('');
      setIsPublished(false);
    }
    setShowEditor(true);
  }

  function closeEditor() {
    setShowEditor(false);
    setEditingBlog(null);
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      const payload = { title, type, content, embedUrl: embedUrl || null, thumbnail: thumbnail || null, excerpt: excerpt || null, tags, destinations: [], activityTypes: [], isPublished };

      if (editingBlog) {
        const res = await fetch('/api/ui-manager/blogs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingBlog.id, ...payload }),
        });
        if (!res.ok) throw new Error();
        toast.success('Blog updated');
      } else {
        const res = await fetch('/api/ui-manager/blogs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        toast.success('Blog created');
      }
      closeEditor();
      fetchBlogs();
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this blog post? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/ui-manager/blogs?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Blog deleted');
      fetchBlogs();
    } catch {
      toast.error('Failed to delete');
    }
  }

  async function togglePublish(blog: Blog) {
    try {
      const res = await fetch('/api/ui-manager/blogs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: blog.id, isPublished: !blog.isPublished }),
      });
      if (!res.ok) throw new Error();
      toast.success(blog.isPublished ? 'Unpublished' : 'Published');
      fetchBlogs();
    } catch {
      toast.error('Failed to update');
    }
  }

  const filtered = blogs.filter(b => {
    if (filterType !== 'ALL' && b.type !== filterType) return false;
    if (searchQuery && !b.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

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
            <PenTool className="w-6 h-6 text-[#58bdae]" />
            Blogs & Content
          </h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage blog posts, videos, and podcasts</p>
        </div>
        <button
          onClick={() => openEditor()}
          className="flex items-center gap-2 px-4 py-2 bg-[#58bdae] text-white rounded-lg hover:bg-[#4aa89a] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Post
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#58bdae]/20 focus:border-[#58bdae]"
          />
        </div>
        <div className="flex gap-1">
          {['ALL', ...CONTENT_TYPES].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterType === t
                  ? 'bg-[#58bdae] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t === 'ALL' ? 'All' : t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-2xl font-bold text-btg-dark">{blogs.length}</p>
          <p className="text-xs text-gray-500">Total Posts</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-2xl font-bold text-green-600">{blogs.filter(b => b.isPublished).length}</p>
          <p className="text-xs text-gray-500">Published</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-2xl font-bold text-yellow-600">{blogs.filter(b => !b.isPublished).length}</p>
          <p className="text-xs text-gray-500">Drafts</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-2xl font-bold text-blue-600">{blogs.filter(b => b.type === 'VIDEO').length}</p>
          <p className="text-xs text-gray-500">Videos</p>
        </div>
      </div>

      {/* Blog List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <PenTool className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No posts found</p>
          <p className="text-sm text-gray-400 mt-1">Create your first blog post to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(blog => (
            <div key={blog.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                {blog.thumbnail && (
                  <img src={blog.thumbnail} alt="" className="w-20 h-14 object-cover rounded-lg flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      blog.type === 'BLOG' ? 'bg-blue-50 text-blue-700' :
                      blog.type === 'VIDEO' ? 'bg-purple-50 text-purple-700' :
                      'bg-orange-50 text-orange-700'
                    }`}>
                      {blog.type}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      blog.isPublished ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                    }`}>
                      {blog.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-btg-dark truncate">{blog.title}</h3>
                  {blog.excerpt && (
                    <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">{blog.excerpt}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    by {blog.author?.name || blog.author?.email} · {new Date(blog.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => togglePublish(blog)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title={blog.isPublished ? 'Unpublish' : 'Publish'}
                  >
                    {blog.isPublished ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-green-500" />}
                  </button>
                  <button
                    onClick={() => openEditor(blog)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4 text-blue-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(blog.id)}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-lg font-bold text-btg-dark">
                {editingBlog ? 'Edit Post' : 'New Post'}
              </h2>
              <button onClick={closeEditor} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Type selector */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Content Type</label>
                <div className="flex gap-2">
                  {CONTENT_TYPES.map(t => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        type === t
                          ? 'bg-[#58bdae] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {t.charAt(0) + t.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Enter post title..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#58bdae]/20 focus:border-[#58bdae]"
                />
              </div>

              {/* Excerpt */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Excerpt</label>
                <textarea
                  value={excerpt}
                  onChange={e => setExcerpt(e.target.value)}
                  placeholder="Short summary of the post..."
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#58bdae]/20 focus:border-[#58bdae] resize-none"
                />
              </div>

              {/* Content */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Content</label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Write your content here... (supports HTML)"
                  rows={10}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-[#58bdae]/20 focus:border-[#58bdae] resize-y"
                />
              </div>

              {/* Embed URL (Video/Podcast) */}
              {type !== 'BLOG' && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Embed URL</label>
                  <input
                    type="url"
                    value={embedUrl}
                    onChange={e => setEmbedUrl(e.target.value)}
                    placeholder="https://youtube.com/embed/..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#58bdae]/20 focus:border-[#58bdae]"
                  />
                </div>
              )}

              {/* Thumbnail */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Thumbnail URL</label>
                <input
                  type="url"
                  value={thumbnail}
                  onChange={e => setThumbnail(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#58bdae]/20 focus:border-[#58bdae]"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Tags (comma separated)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                  placeholder="travel, adventure, himachal..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#58bdae]/20 focus:border-[#58bdae]"
                />
              </div>

              {/* Publish toggle */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPublished(!isPublished)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${isPublished ? 'bg-[#58bdae]' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${isPublished ? 'translate-x-5' : ''}`} />
                </button>
                <span className="text-sm text-gray-700">{isPublished ? 'Published' : 'Draft'}</span>
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
                {saving ? 'Saving...' : editingBlog ? 'Update Post' : 'Create Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
