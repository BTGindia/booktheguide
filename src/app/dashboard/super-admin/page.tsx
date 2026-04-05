'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users, Package, MapPin, Shield, CalendarCheck, ClipboardList,
  TrendingUp, DollarSign, UserCheck, Building2, Star, Loader2,
  ArrowUpRight, Globe, Activity
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';

interface DashboardData {
  stats: {
    totalGuides: number;
    totalStates: number;
    totalProducts: number;
    pendingProducts: number;
    pendingDepartures: number;
    totalBookings: number;
    totalCommission: number;
    totalUsers: number;
    activeUsers: number;
  };
  bestSellers: {
    states: { name: string; bookings: number; revenue: number }[];
    experiences: { category: string; bookings: number; revenue: number }[];
    packages: { id: string; title: string; bookings: number; revenue: number }[];
    guides: { id: string; name: string; bookings: number; revenue: number; rating: number }[];
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  'TOURIST_GUIDES': 'Tourist Guides',
  'ADVENTURE_GUIDES': 'Adventure Guides',
  'HERITAGE_WALKS': 'Heritage Walks',
  'GROUP_TRIPS': 'Group Trips',
  'TRAVEL_WITH_INFLUENCERS': 'Travel with Influencers',
  'OTHER': 'Other',
};

export default function SuperAdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/super-admin/dashboard')
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-btg-terracotta" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-12 text-gray-500">Failed to load dashboard data.</div>;
  }

  const { stats, bestSellers } = data;

  const statCards = [
    { label: 'Total Guides', value: stats.totalGuides, icon: Users, href: '/dashboard/super-admin/guides', color: 'text-blue-600 bg-blue-50' },
    { label: 'Total States', value: stats.totalStates, icon: Globe, href: '/dashboard/super-admin/destinations', color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Total Products', value: stats.totalProducts, icon: Package, href: '/dashboard/super-admin/products', color: 'text-green-600 bg-green-50' },
    { label: 'Pending Products', value: stats.pendingProducts, icon: Package, href: '/dashboard/super-admin/products', color: 'text-amber-600 bg-amber-50' },
    { label: 'Pending Departures', value: stats.pendingDepartures, icon: CalendarCheck, href: '/dashboard/super-admin/departures', color: 'text-red-600 bg-red-50' },
    { label: 'Total Bookings', value: stats.totalBookings, icon: ClipboardList, href: '/dashboard/super-admin/bookings', color: 'text-sky-600 bg-sky-50' },
    { label: 'Commission Earned', value: formatCurrency(stats.totalCommission), icon: DollarSign, href: '/dashboard/super-admin/commission', color: 'text-purple-600 bg-purple-50' },
    { label: 'Total Users', value: stats.totalUsers, icon: UserCheck, href: '#', color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Active Users', value: stats.activeUsers, icon: Activity, href: '#', color: 'text-teal-600 bg-teal-50' },
  ];

  return (
    <div className="max-w-6xl space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-heading text-btg-dark mb-1">Super Admin Dashboard</h1>
        <p className="text-gray-600">Platform overview and management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card hover>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Best Sellers Section */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-btg-terracotta" />
            <h2 className="text-xl font-bold font-heading text-btg-dark">Best Sellers</h2>
          </div>
          <Link
            href="/dashboard/super-admin/best-sellers"
            className="text-sm text-btg-terracotta hover:underline flex items-center gap-1"
          >
            View All <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Best Seller States */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <h3 className="font-semibold text-gray-800">Top States</h3>
              </div>
              {bestSellers.states.length === 0 ? (
                <p className="text-sm text-gray-500">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {bestSellers.states.map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-700">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.revenue)}</p>
                        <p className="text-xs text-gray-500">{item.bookings} bookings</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Best Seller Experiences */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-4 h-4 text-purple-600" />
                <h3 className="font-semibold text-gray-800">Top Experiences</h3>
              </div>
              {bestSellers.experiences.length === 0 ? (
                <p className="text-sm text-gray-500">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {bestSellers.experiences.map((item, idx) => (
                    <div key={item.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-700">
                          {CATEGORY_LABELS[item.category] || item.category}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.revenue)}</p>
                        <p className="text-xs text-gray-500">{item.bookings} bookings</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Best Seller Packages */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-gray-800">Top Packages</h3>
              </div>
              {bestSellers.packages.length === 0 ? (
                <p className="text-sm text-gray-500">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {bestSellers.packages.map((item, idx) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-700 truncate max-w-[180px]">{item.title}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.revenue)}</p>
                        <p className="text-xs text-gray-500">{item.bookings} bookings</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Best Seller Guides */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-amber-600" />
                <h3 className="font-semibold text-gray-800">Top Guides</h3>
              </div>
              {bestSellers.guides.length === 0 ? (
                <p className="text-sm text-gray-500">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {bestSellers.guides.map((item, idx) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="text-sm font-medium text-gray-700">{item.name}</span>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            {item.rating.toFixed(1)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.revenue)}</p>
                        <p className="text-xs text-gray-500">{item.bookings} bookings</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
