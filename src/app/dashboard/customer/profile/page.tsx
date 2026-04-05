'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User, Camera, Phone, Mail, Calendar, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CustomerProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', image: '' });

  useEffect(() => {
    fetch('/api/customer/profile')
      .then(r => r.json())
      .then(data => {
        setProfile(data.user);
        setFormData({
          name: data.user.name || '',
          phone: data.user.phone || '',
          image: data.user.image || '',
        });
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      const data = await res.json();
      setProfile(data.user);
      toast.success('Profile updated');
    } catch (err: any) { toast.error(err.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024) { toast.error('Image must be under 100KB'); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast.error('Only JPEG, PNG, WebP allowed'); return; }

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formDataUpload });
      const data = await res.json();
      if (data.url) {
        setFormData({ ...formData, image: data.url });
        toast.success('Image uploaded');
      }
    } catch { toast.error('Upload failed'); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-btg-terracotta"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-heading text-btg-dark">My Profile</h1>
        <p className="text-gray-600 mt-1">Manage your personal information</p>
      </div>

      <Card>
        <CardContent className="p-6">
          {/* Avatar */}
          <div className="flex items-center gap-6 mb-8">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-btg-sand flex items-center justify-center overflow-hidden">
                {formData.image ? (
                  <img src={formData.image} alt={formData.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-btg-terracotta" />
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-btg-terracotta text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-btg-dark transition-colors shadow-lg">
                <Camera className="w-3.5 h-3.5" />
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
            <div>
              <h2 className="font-bold text-btg-dark text-lg">{profile?.name}</h2>
              <p className="text-sm text-gray-500">{profile?.email}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : ''}
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <Input
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl text-sm text-gray-500">
                <Mail className="w-4 h-4" />
                {profile?.email}
                <span className="text-xs text-gray-400 ml-auto">Cannot be changed</span>
              </div>
            </div>
            <Input
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 XXXXX XXXXX"
            />
            <div className="pt-2">
              <Button type="submit" isLoading={saving}>
                <Save className="w-4 h-4 mr-2" /> Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
