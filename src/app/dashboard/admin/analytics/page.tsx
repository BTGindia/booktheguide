'use client';

import { useEffect, useState } from 'react';
import { Loader2, Users, Package, ClipboardList, DollarSign, TrendingUp, Star, MapPin, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

interface Analytics {
  totalGuides: number;
  verifiedGuides: number;
  totalProducts: number;
  approvedProducts: number;
  totalBookings: number;
  totalRevenue: number;
  totalCommission: number;
  avgRating: number;
  topGuides: { id: string; name: string; rating: number; trips: number }[];
  recentBookings: { id: string; bookingNumber: string; amount: number; date: string; customerName: string }[];
  monthlyBookings: { month: string; count: number; revenue: number }[];
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-btg-terracotta" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-gray-500 text-center py-16">Unable to load analytics</p>;
  }

  const stats = [
    { label: 'Total Guides', value: data.totalGuides, icon: Users, color: 'bg-blue-100 text-blue-600' },
    { label: 'Verified Guides', value: data.verifiedGuides, icon: Users, color: 'bg-green-100 text-green-600' },
    { label: 'Total Packages', value: data.totalProducts, icon: Package, color: 'bg-purple-100 text-purple-600' },
    { label: 'Approved Packages', value: data.approvedProducts, icon: Package, color: 'bg-indigo-100 text-indigo-600' },
    { label: 'Total Bookings', value: data.totalBookings, icon: ClipboardList, color: 'bg-amber-100 text-amber-600' },
    { label: 'Avg Guide Rating', value: data.avgRating.toFixed(1), icon: Star, color: 'bg-yellow-100 text-yellow-600' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-heading text-btg-dark">Analytics</h1>
        <p className="text-gray-600 mt-1">Performance overview for your managed states</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">&#x20B9;{data.totalRevenue.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Platform Commission</p>
              <p className="text-2xl font-bold text-gray-900">&#x20B9;{data.totalCommission.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Bookings Chart (text-based) */}
      {data.monthlyBookings.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Bookings</h2>
          <div className="space-y-3">
            {data.monthlyBookings.map((m) => {
              const maxCount = Math.max(...data.monthlyBookings.map((x) => x.count), 1);
              const pct = (m.count / maxCount) * 100;
              return (
                <div key={m.month} className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 w-20 flex-shrink-0">{m.month}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                    <div
                      className="bg-btg-terracotta h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                    <span className="absolute inset-0 flex items-center px-3 text-xs font-medium">
                      {m.count} bookings &bull; &#x20B9;{m.revenue.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Guides */}
      {data.topGuides.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Guides</h2>
          <div className="space-y-3">
            {data.topGuides.map((g, i) => (
              <div key={g.id} className="flex items-center gap-4 py-2">
                <span className="text-lg font-bold text-btg-terracotta w-8">#{i + 1}</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{g.name}</p>
                  <p className="text-xs text-gray-500">{g.trips} trips completed</p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-medium">{g.rating.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Bookings */}
      {data.recentBookings.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Bookings</h2>
          <div className="space-y-3">
            {data.recentBookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">#{b.bookingNumber}</p>
                  <p className="text-xs text-gray-500">{b.customerName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">&#x20B9;{b.amount.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-gray-500">{b.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
