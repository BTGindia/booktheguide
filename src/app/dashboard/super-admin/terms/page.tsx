'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import toast from 'react-hot-toast';
import { Plus, Edit3, Trash2, FileText, X } from 'lucide-react';

const GUIDE_TYPES = [
  { value: '', label: 'All Guide Types' },
  { value: 'TREK_GUIDE', label: 'Trek Guide' },
  { value: 'ADVENTURE_SPORTS_GUIDE', label: 'Adventure Sports Guide' },
  { value: 'GROUP_TRIP_LEADER', label: 'Group Trip Leader' },
];

interface TermsItem {
  id: string;
  title: string;
  content: string;
  state: string | null;
  guideType: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SuperAdminTermsPage() {
  const { data: session } = useSession();
  const [terms, setTerms] = useState<TermsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [states, setStates] = useState<{ id: string; name: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    content: '',
    state: '',
    guideType: '',
  });

  const fetchTerms = async () => {
    try {
      const res = await fetch('/api/super-admin/terms');
      const data = await res.json();
      setTerms(data.terms || []);
    } catch {
      toast.error('Failed to fetch terms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerms();
    fetch('/api/geography/states')
      .then((r) => r.json())
      .then((data) => setStates(data.states || []))
      .catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({ title: '', content: '', state: '', guideType: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    setSaving(true);
    try {
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { ...form, id: editingId } : form;

      const res = await fetch('/api/super-admin/terms', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to save');
        return;
      }

      toast.success(editingId ? 'Terms updated' : 'Terms created');
      resetForm();
      fetchTerms();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: TermsItem) => {
    setForm({
      title: item.title,
      content: item.content,
      state: item.state || '',
      guideType: item.guideType || '',
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this terms document?')) return;
    try {
      const res = await fetch(`/api/super-admin/terms?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        toast.error('Failed to delete');
        return;
      }
      toast.success('Terms deleted');
      fetchTerms();
    } catch {
      toast.error('Something went wrong');
    }
  };

  const toggleActive = async (item: TermsItem) => {
    try {
      const res = await fetch('/api/super-admin/terms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, isActive: !item.isActive }),
      });
      if (!res.ok) {
        toast.error('Failed to update');
        return;
      }
      toast.success(item.isActive ? 'Terms deactivated' : 'Terms activated');
      fetchTerms();
    } catch {
      toast.error('Something went wrong');
    }
  };

  const stateOptions = [
    { value: '', label: 'All States' },
    ...states.map((s) => ({ value: s.name, label: s.name })),
  ];

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-heading text-btg-dark">Guide Terms & Conditions</h1>
          <p className="text-gray-600 mt-1">Manage terms and conditions for guides by state and guide type</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Add Terms
        </Button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-btg-dark">{editingId ? 'Edit Terms' : 'Create New Terms'}</h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input id="title" name="title" label="Title" value={form.title} onChange={handleChange} placeholder="e.g., General Guide Terms & Conditions" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select id="state" name="state" label="State (optional)" value={form.state} onChange={handleChange} placeholder="All States" options={stateOptions} />
                <Select id="guideType" name="guideType" label="Guide Type (optional)" value={form.guideType} onChange={handleChange} placeholder="All Guide Types" options={GUIDE_TYPES} />
              </div>
              <p className="text-xs text-gray-500">Leave state and guide type empty for global terms. Set one or both for targeted terms.</p>
              <Textarea id="content" name="content" label="Terms Content" value={form.content} onChange={handleChange} placeholder="Enter the full terms and conditions text..." rows={12} />
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit" isLoading={saving}>{editingId ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Terms List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : terms.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No terms and conditions created yet.</p>
            <p className="text-sm text-gray-400 mt-1">Click &quot;Add Terms&quot; to create terms for your guides.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {terms.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-btg-dark">{item.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${item.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex gap-3 text-xs text-gray-500 mb-2">
                      <span>State: {item.state || 'All'}</span>
                      <span>Guide Type: {item.guideType ? GUIDE_TYPES.find(g => g.value === item.guideType)?.label || item.guideType : 'All'}</span>
                      <span>Updated: {new Date(item.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-3 whitespace-pre-wrap">{item.content}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => toggleActive(item)} className={`text-xs px-2.5 py-1 rounded border ${item.isActive ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}>
                      {item.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => handleEdit(item)} className="p-1.5 text-gray-400 hover:text-btg-terracotta rounded">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
