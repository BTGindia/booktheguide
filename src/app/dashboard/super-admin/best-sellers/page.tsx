'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  TrendingUp,
  Download,
  FileSpreadsheet,
  Calendar,
  MapPin,
  Tag,
  Users,
  Package,
  DollarSign,
  ShoppingCart,
  BarChart2,
  Star,
} from 'lucide-react';

interface BestSeller {
  id?: string;
  name?: string;
  title?: string;
  category?: string;
  slug?: string;
  bookings: number;
  revenue: number;
}

interface FilterOption {
  value: string;
  label: string;
}

interface BestSellersData {
  bestStates: BestSeller[];
  bestExperiences: BestSeller[];
  bestPackages: BestSeller[];
  bestGuides: BestSeller[];
  summary: {
    totalRevenue: number;
    totalBookings: number;
    avgOrderValue: number;
  };
  filters: {
    states: FilterOption[];
    categories: FilterOption[];
    guides: FilterOption[];
  };
}

export default function BestSellersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<BestSellersData | null>(null);
  const [loading, setLoading] = useState(true);

  // Date range - default to last 30 days
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Filters
  const [selectedState, setSelectedState] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedGuide, setSelectedGuide] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session && (session.user as any).role !== 'SUPER_ADMIN') {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session && (session.user as any).role === 'SUPER_ADMIN') {
      fetchData();
    }
  }, [session, startDate, endDate, selectedState, selectedCategory, selectedGuide]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedState) params.append('stateId', selectedState);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedGuide) params.append('guideId', selectedGuide);

      const res = await fetch(`/api/super-admin/best-sellers?${params.toString()}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching best sellers:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const exportToCSV = () => {
    if (!data) return;

    const csvSections = [];

    // Summary
    csvSections.push('SUMMARY');
    csvSections.push(`Total Revenue,${data.summary.totalRevenue}`);
    csvSections.push(`Total Bookings,${data.summary.totalBookings}`);
    csvSections.push(`Average Order Value,${data.summary.avgOrderValue.toFixed(2)}`);
    csvSections.push('');

    // Best States
    csvSections.push('BEST SELLING STATES');
    csvSections.push('State,Bookings,Revenue');
    data.bestStates.forEach((s) => {
      csvSections.push(`${s.name},${s.bookings},${s.revenue}`);
    });
    csvSections.push('');

    // Best Experiences
    csvSections.push('BEST SELLING EXPERIENCES');
    csvSections.push('Category,Bookings,Revenue');
    data.bestExperiences.forEach((e) => {
      csvSections.push(`${e.category},${e.bookings},${e.revenue}`);
    });
    csvSections.push('');

    // Best Packages
    csvSections.push('BEST SELLING PACKAGES');
    csvSections.push('Package,Category,Bookings,Revenue');
    data.bestPackages.forEach((p) => {
      csvSections.push(`"${p.title}",${p.category},${p.bookings},${p.revenue}`);
    });
    csvSections.push('');

    // Best Guides
    csvSections.push('BEST SELLING GUIDES');
    csvSections.push('Guide,Bookings,Revenue');
    data.bestGuides.forEach((g) => {
      csvSections.push(`${g.name},${g.bookings},${g.revenue}`);
    });

    const csvContent = csvSections.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `best-sellers-${startDate}-to-${endDate}.csv`;
    link.click();
  };

  const exportToExcel = () => {
    // For simplicity, export as CSV with .xls extension - Excel can open it
    if (!data) return;

    const rows = [];
    rows.push(['Best Sellers Report']);
    rows.push([`Period: ${startDate} to ${endDate}`]);
    rows.push([]);
    rows.push(['Summary']);
    rows.push(['Total Revenue', data.summary.totalRevenue]);
    rows.push(['Total Bookings', data.summary.totalBookings]);
    rows.push(['Average Order Value', data.summary.avgOrderValue.toFixed(2)]);
    rows.push([]);
    rows.push(['Best Selling States']);
    rows.push(['State', 'Bookings', 'Revenue']);
    data.bestStates.forEach((s) => rows.push([s.name, s.bookings, s.revenue]));
    rows.push([]);
    rows.push(['Best Selling Experiences']);
    rows.push(['Category', 'Bookings', 'Revenue']);
    data.bestExperiences.forEach((e) => rows.push([e.category, e.bookings, e.revenue]));
    rows.push([]);
    rows.push(['Best Selling Packages']);
    rows.push(['Package', 'Category', 'Bookings', 'Revenue']);
    data.bestPackages.forEach((p) => rows.push([p.title, p.category, p.bookings, p.revenue]));
    rows.push([]);
    rows.push(['Best Selling Guides']);
    rows.push(['Guide', 'Bookings', 'Revenue']);
    data.bestGuides.forEach((g) => rows.push([g.name, g.bookings, g.revenue]));

    const csvContent = rows.map((row) => row.join('\t')).join('\n');
    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `best-sellers-${startDate}-to-${endDate}.xls`;
    link.click();
  };

  const setDateRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="h-7 w-7" />
          Best Sellers
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={exportToExcel} className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Quick Date Ranges */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Quick Select</label>
            <div className="flex gap-1 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => setDateRange(7)}>7 Days</Button>
              <Button size="sm" variant="outline" onClick={() => setDateRange(30)}>30 Days</Button>
              <Button size="sm" variant="outline" onClick={() => setDateRange(90)}>90 Days</Button>
              <Button size="sm" variant="outline" onClick={() => setDateRange(365)}>1 Year</Button>
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* State Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">All States</option>
              {data?.filters.states.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">All Categories</option>
              {data?.filters.categories.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(data.summary.totalRevenue)}
                </p>
              </div>
              <DollarSign className="h-10 w-10 text-green-200" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Bookings</p>
                <p className="text-2xl font-bold text-blue-600">
                  {data.summary.totalBookings}
                </p>
              </div>
              <ShoppingCart className="h-10 w-10 text-blue-200" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Average Order Value</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(data.summary.avgOrderValue)}
                </p>
              </div>
              <BarChart2 className="h-10 w-10 text-purple-200" />
            </div>
          </Card>
        </div>
      )}

      {/* Best Sellers Grid */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Best States */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              Best Selling States
            </h2>
            <div className="space-y-3">
              {data.bestStates.length === 0 ? (
                <p className="text-gray-500 text-sm">No data for selected period</p>
              ) : (
                data.bestStates.map((state, idx) => (
                  <div key={state.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <span className="font-medium">{state.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{formatCurrency(state.revenue)}</p>
                      <p className="text-xs text-gray-500">{state.bookings} bookings</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Best Experiences */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Tag className="h-5 w-5 text-purple-600" />
              Best Selling Experiences
            </h2>
            <div className="space-y-3">
              {data.bestExperiences.length === 0 ? (
                <p className="text-gray-500 text-sm">No data for selected period</p>
              ) : (
                data.bestExperiences.map((exp, idx) => (
                  <div key={exp.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <span className="font-medium">{exp.category}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{formatCurrency(exp.revenue)}</p>
                      <p className="text-xs text-gray-500">{exp.bookings} bookings</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Best Packages */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-600" />
              Best Selling Packages
            </h2>
            <div className="space-y-3">
              {data.bestPackages.length === 0 ? (
                <p className="text-gray-500 text-sm">No data for selected period</p>
              ) : (
                data.bestPackages.map((pkg, idx) => (
                  <div key={pkg.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-medium block">{pkg.title}</span>
                        <span className="text-xs text-gray-500">{pkg.category}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{formatCurrency(pkg.revenue)}</p>
                      <p className="text-xs text-gray-500">{pkg.bookings} bookings</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Best Guides */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-600" />
              Best Selling Guides
            </h2>
            <div className="space-y-3">
              {data.bestGuides.length === 0 ? (
                <p className="text-gray-500 text-sm">No data for selected period</p>
              ) : (
                data.bestGuides.map((guide, idx) => (
                  <div key={guide.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <span className="font-medium">{guide.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{formatCurrency(guide.revenue)}</p>
                      <p className="text-xs text-gray-500">{guide.bookings} bookings</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
