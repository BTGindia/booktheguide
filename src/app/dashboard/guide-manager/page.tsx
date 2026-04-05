'use client';

import { useEffect, useState } from 'react';
import { Users, CheckCircle, Clock, Shield } from 'lucide-react';
import Link from 'next/link';

interface Stats {
  totalGuides: number;
  verifiedGuides: number;
  pendingGuides: number;
}

export default function GuideManagerDashboard() {
  const [stats, setStats] = useState<Stats>({ totalGuides: 0, verifiedGuides: 0, pendingGuides: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/guides')
      .then((r) => r.json())
      .then((data) => {
        const guides = data.guides || [];
        setStats({
          totalGuides: guides.length,
          verifiedGuides: guides.filter((g: any) => g.guideProfile?.isVerified).length,
          pendingGuides: guides.filter((g: any) => g.guideProfile && !g.guideProfile.isVerified).length,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Guide Manager Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage and verify guides across all regions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Guides</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalGuides}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Verified</p>
              <p className="text-3xl font-bold text-green-700 mt-1">{stats.verifiedGuides}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Verification</p>
              <p className="text-3xl font-bold text-amber-700 mt-1">{stats.pendingGuides}</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/dashboard/guide-manager/guides"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors"
          >
            <Shield className="w-8 h-8 text-indigo-600" />
            <div>
              <p className="font-medium text-gray-900">Manage Guides</p>
              <p className="text-sm text-gray-600">View, verify, and manage all guides</p>
            </div>
          </Link>
          <Link
            href="/dashboard/guide-manager/guides?filter=pending"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-amber-300 hover:bg-amber-50/50 transition-colors"
          >
            <Clock className="w-8 h-8 text-amber-600" />
            <div>
              <p className="font-medium text-gray-900">Pending Verifications</p>
              <p className="text-sm text-gray-600">Review guides awaiting verification</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
