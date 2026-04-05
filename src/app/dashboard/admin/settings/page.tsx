'use client';

import { useEffect, useState } from 'react';
import { Loader2, Settings, User, MapPin, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

interface AdminInfo {
  name: string;
  email: string;
  managedStates: { id: string; name: string; commissionPercent: number }[];
}

export default function AdminSettingsPage() {
  const [info, setInfo] = useState<AdminInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data) => setInfo(data))
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-btg-terracotta" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-heading text-btg-dark">Settings</h1>
        <p className="text-gray-600 mt-1">View your admin account information</p>
      </div>

      {info ? (
        <div className="space-y-6 max-w-2xl">
          {/* Profile Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-btg-sand rounded-full flex items-center justify-center">
                <User className="w-7 h-7 text-btg-terracotta" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{info.name}</h2>
                <p className="text-sm text-gray-500">{info.email}</p>
                <span className="inline-block mt-1 px-2.5 py-0.5 text-xs font-medium bg-btg-sand text-btg-terracotta rounded-full">
                  State Admin
                </span>
              </div>
            </div>
          </div>

          {/* Managed States */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-btg-terracotta" />
              Managed States
            </h3>
            {info.managedStates.length === 0 ? (
              <p className="text-gray-500 text-sm">No states assigned. Contact the super admin.</p>
            ) : (
              <div className="space-y-3">
                {info.managedStates.map((state) => (
                  <div key={state.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-btg-cream rounded-lg flex items-center justify-center">
                        <Shield className="w-4 h-4 text-btg-terracotta" />
                      </div>
                      <span className="font-medium text-gray-900">{state.name}</span>
                    </div>
                    <span className="text-sm text-gray-500">Commission: {state.commissionPercent}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-gray-500">Unable to load settings</p>
      )}
    </div>
  );
}
