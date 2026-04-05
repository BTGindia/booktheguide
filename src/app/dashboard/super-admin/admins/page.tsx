'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, UserPlus, Shield, MapPin, Users, Trash2, Filter, Clock, CheckCircle, XCircle, Palette } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Admin {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  adminProfile: {
    managedStates: { id: string; name: string }[];
  } | null;
  guideManagerProfile: {
    designation: string | null;
  } | null;
}

interface State {
  id: string;
  name: string;
}

export default function SuperAdminManagePage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'GUIDE_MANAGER' | 'UI_MANAGER'>('ALL');

  // Form fields
  const [accountType, setAccountType] = useState<'ADMIN' | 'GUIDE_MANAGER' | 'UI_MANAGER'>('ADMIN');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedStates, setSelectedStates] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [adminsRes, statesRes] = await Promise.all([
        fetch('/api/admin/manage'),
        fetch('/api/states'),
      ]);
      const adminsData = await adminsRes.json();
      const statesData = await statesRes.json();
      setAdmins(adminsData.admins || []);
      setStates(statesData.states || []);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;

    try {
      const res = await fetch('/api/admin/manage', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Account deleted successfully');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete account');
    }
  };

  const toggleActiveStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/admin/manage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isActive: !currentStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(currentStatus ? 'Account deactivated' : 'Account activated');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Name, email and password are required');
      return;
    }
    if (accountType === 'ADMIN' && selectedStates.length === 0) {
      toast.error('Please select a state for this admin');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          phone: phone || null,
          accountType,
          managedStateIds: accountType === 'ADMIN' ? selectedStates : [],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`${accountType === 'ADMIN' ? 'Admin' : accountType === 'GUIDE_MANAGER' ? 'Guide Manager' : 'UI Manager'} created successfully!`);
      setShowForm(false);
      setAccountType('ADMIN');
      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
      setSelectedStates([]);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create admin');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-btg-terracotta" />
      </div>
    );
  }

  const filteredAdmins = admins.filter((admin) => {
    if (roleFilter === 'ALL') return true;
    return admin.role === roleFilter;
  });

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-heading text-btg-dark mb-1">
            Manage All Accounts
          </h1>
          <p className="text-gray-600">Create and manage admin, guide manager, and UI manager accounts</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-btg-terracotta text-white rounded-lg hover:bg-btg-terracotta transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          {showForm ? 'Cancel' : 'Create Account'}
        </button>
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center gap-3 mb-6">
        <Filter className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-600">Filter:</span>
        <button
          onClick={() => setRoleFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            roleFilter === 'ALL'
              ? 'bg-btg-terracotta text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All ({admins.length})
        </button>
        <button
          onClick={() => setRoleFilter('ADMIN')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            roleFilter === 'ADMIN'
              ? 'bg-btg-terracotta text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          State Admins ({admins.filter(a => a.role === 'ADMIN').length})
        </button>
        <button
          onClick={() => setRoleFilter('GUIDE_MANAGER')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            roleFilter === 'GUIDE_MANAGER'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Guide Managers ({admins.filter(a => a.role === 'GUIDE_MANAGER').length})
        </button>
        <button
          onClick={() => setRoleFilter('UI_MANAGER')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            roleFilter === 'UI_MANAGER'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          UI Managers ({admins.filter(a => a.role === 'UI_MANAGER').length})
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 mb-8 space-y-4">
          <h2 className="font-bold text-lg text-btg-dark flex items-center gap-2">
            <Plus className="w-5 h-5" />
            New Account
          </h2>

          {/* Account Type Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Account Type *</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setAccountType('ADMIN')}
                className={`flex-1 p-3 rounded-lg border-2 text-center transition-colors ${
                  accountType === 'ADMIN'
                    ? 'border-btg-terracotta bg-btg-cream text-btg-terracotta'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Shield className="w-5 h-5 mx-auto mb-1" />
                <p className="font-medium text-sm">State Admin</p>
                <p className="text-xs text-gray-500">Approves packages for a state</p>
              </button>
              <button
                type="button"
                onClick={() => setAccountType('GUIDE_MANAGER')}
                className={`flex-1 p-3 rounded-lg border-2 text-center transition-colors ${
                  accountType === 'GUIDE_MANAGER'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Users className="w-5 h-5 mx-auto mb-1" />
                <p className="font-medium text-sm">Guide Manager</p>
                <p className="text-xs text-gray-500">Manages & verifies all guides</p>
              </button>
              <button
                type="button"
                onClick={() => setAccountType('UI_MANAGER')}
                className={`flex-1 p-3 rounded-lg border-2 text-center transition-colors ${
                  accountType === 'UI_MANAGER'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Palette className="w-5 h-5 mx-auto mb-1" />
                <p className="font-medium text-sm">UI Manager</p>
                <p className="text-xs text-gray-500">Manages website content & pages</p>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40"
              />
            </div>
          </div>

          {accountType === 'ADMIN' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Managed State (one admin per state only)
              </label>
              <select
                value={selectedStates[0] || ''}
                onChange={(e) => setSelectedStates(e.target.value ? [e.target.value] : [])}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-btg-terracotta/40"
              >
                <option value="">Select state</option>
                {states.map((state) => (
                  <option key={state.id} value={state.id}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Create {accountType === 'ADMIN' ? 'Admin' : accountType === 'GUIDE_MANAGER' ? 'Guide Manager' : 'UI Manager'} Account
          </button>
        </form>
      )}

      {/* Existing Accounts */}
      <div className="space-y-4">
        <h2 className="font-bold text-lg text-btg-dark">
          Existing Accounts ({filteredAdmins.length})
        </h2>
        {filteredAdmins.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500">
              {admins.length === 0
                ? 'No admin accounts yet. Create one above.'
                : 'No accounts match the current filter.'}
            </p>
          </div>
        ) : (
          filteredAdmins.map((admin) => (
            <div key={admin.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    admin.role === 'GUIDE_MANAGER' ? 'bg-indigo-100' : admin.role === 'UI_MANAGER' ? 'bg-purple-100' : 'bg-btg-sand'
                  }`}>
                    {admin.role === 'GUIDE_MANAGER' 
                      ? <Users className="w-5 h-5 text-indigo-600" />
                      : admin.role === 'UI_MANAGER'
                      ? <Palette className="w-5 h-5 text-purple-600" />
                      : <Shield className="w-5 h-5 text-btg-terracotta" />
                    }
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900">{admin.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        admin.role === 'GUIDE_MANAGER'
                          ? 'bg-indigo-50 text-indigo-700'
                          : admin.role === 'UI_MANAGER'
                          ? 'bg-purple-50 text-purple-700'
                          : 'bg-btg-cream text-btg-terracotta'
                      }`}>
                        {admin.role === 'GUIDE_MANAGER' ? 'Guide Manager' : admin.role === 'UI_MANAGER' ? 'UI Manager' : 'State Admin'}
                      </span>
                      {/* Current Status Badge */}
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                        admin.isActive
                          ? 'bg-green-50 text-green-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {admin.isActive ? (
                          <><CheckCircle className="w-3 h-3" /> Active</>
                        ) : (
                          <><XCircle className="w-3 h-3" /> Inactive</>
                        )}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{admin.email}</p>
                    {admin.phone && <p className="text-xs text-gray-400">{admin.phone}</p>}
                    {/* Last Active */}
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                      <Clock className="w-3 h-3" />
                      Last active: {formatDate(admin.updatedAt)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    Added {formatDate(admin.createdAt)}
                  </span>
                  <button
                    onClick={() => toggleActiveStatus(admin.id, admin.isActive)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      admin.isActive
                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {admin.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(admin.id, admin.name)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete account"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {admin.adminProfile?.managedStates && admin.adminProfile.managedStates.length > 0 && (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {admin.adminProfile.managedStates.map((s) => (
                    <span key={s.id} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                      {s.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
