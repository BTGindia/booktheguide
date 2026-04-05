'use client';

import { useEffect, useState } from 'react';
import { Loader2, MapPin, Mountain, Calendar, Package } from 'lucide-react';
import toast from 'react-hot-toast';

interface Destination {
  id: string;
  name: string;
  description: string | null;
  altitude: string | null;
  bestMonths: string[];
  isActive: boolean;
  city: { name: string; state: { name: string } };
  _count: { products: number };
}

export default function AdminDestinationsPage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/destinations')
      .then((r) => r.json())
      .then((data) => setDestinations(data.destinations || []))
      .catch(() => toast.error('Failed to load destinations'))
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
        <h1 className="text-2xl font-bold font-heading text-btg-dark">Destinations</h1>
        <p className="text-gray-600 mt-1">{destinations.length} destinations in your managed states</p>
      </div>

      {destinations.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No destinations found in your managed states</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Destination</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Altitude</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Best Months</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Packages</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {destinations.map((dest) => (
                <tr key={dest.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-btg-sand rounded-lg flex items-center justify-center">
                        <Mountain className="w-5 h-5 text-btg-terracotta" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{dest.name}</p>
                        <p className="text-xs text-gray-500 max-w-xs truncate">{dest.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {dest.city.name}, {dest.city.state.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {dest.altitude || '\u2014'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {dest.bestMonths.slice(0, 3).map((m) => (
                        <span key={m} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                          {m}
                        </span>
                      ))}
                      {dest.bestMonths.length > 3 && (
                        <span className="text-xs text-gray-400">+{dest.bestMonths.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 text-sm text-btg-terracotta">
                      <Package className="w-3.5 h-3.5" />
                      {dest._count.products}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${dest.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {dest.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
