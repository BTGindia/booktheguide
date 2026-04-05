'use client';

import { useEffect, useState } from 'react';
import { Loader2, Globe, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

interface Region {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  isActive: boolean;
  state: { name: string };
}

export default function AdminRegionsPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/regions')
      .then((r) => r.json())
      .then((data) => setRegions(data.regions || []))
      .catch(() => toast.error('Failed to load regions'))
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
        <h1 className="text-2xl font-bold font-heading text-btg-dark">Regions</h1>
        <p className="text-gray-600 mt-1">{regions.length} regions in your managed states</p>
      </div>

      {regions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No regions found. Regions are managed by the super admin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {regions.map((region) => (
            <div key={region.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-btg-sand rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-btg-terracotta" />
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${region.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {region.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{region.name}</h3>
              <p className="text-sm text-gray-500 mb-3">{region.state.name}</p>
              {region.description && (
                <p className="text-xs text-gray-400 line-clamp-2">{region.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
