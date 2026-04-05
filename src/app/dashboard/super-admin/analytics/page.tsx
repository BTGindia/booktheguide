'use client';

import { useEffect, useState } from 'react';
import {
  Users, Package, ClipboardList, DollarSign,
  TrendingUp, Star, CheckCircle, UserCheck,
  BarChart3, PieChart, IndianRupee, Shield,
  MapPin, ArrowUpRight, Calendar, Download, FileSpreadsheet,
  ArrowUp, ArrowDown, Activity, Target, Eye, MousePointer,
} from 'lucide-react';

interface Analytics {
  kpis: {
    totalGuides: number;
    verifiedGuides: number;
    totalProducts: number;
    approvedProducts: number;
    totalBookings: number;
    confirmedBookings: number;
    totalRevenue: number;
    totalCommission: number;
    totalGST: number;
    totalCGST: number;
    totalSGST: number;
    totalCustomers: number;
  };
  stateAnalytics: {
    id: string; name: string; code: string; commissionPercent: number;
    guides: number; products: number; bookings: number; destinations: number;
    revenue: number; commission: number;
  }[];
  monthlyData: { month: string; bookings: number; revenue: number; commission: number }[];
  topGuides: { id: string; name: string; rating: number; trips: number; revenue: number; bookings: number }[];
  recentBookings: { id: string; bookingNumber: string; amount: number; commission: number; date: string; customerName: string; status: string }[];
  tripTypeBreakdown: { fixed: number; personal: number };
  userEngagement: {
    totalUsers: number;
    activeUsers: number;
    repeatCustomers: number;
    avgBookingsPerCustomer: string;
    engagementRate: string;
  };
  conversionFunnel: {
    pending: number;
    quoteSent: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    conversionRate: string;
  };
  categoryPerformance: {
    category: string;
    bookings: number;
    revenue: number;
    products: number;
  }[];
}

function formatINR(num: number) {
  if (num >= 100000) return `\u20B9${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `\u20B9${(num / 1000).toFixed(1)}K`;
  return `\u20B9${num.toLocaleString('en-IN')}`;
}

// Simple CSS bar chart component
function BarChart({ data, barKey, labelKey, color = 'bg-btg-terracotta' }: {
  data: any[]; barKey: string; labelKey: string; color?: string;
}) {
  const maxVal = Math.max(...data.map((d) => d[barKey]), 1);
  return (
    <div className="flex items-end gap-1.5 h-48">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] text-gray-500 font-medium">
            {d[barKey] > 0 ? d[barKey] : ''}
          </span>
          <div
            className={`w-full rounded-t-md ${color} transition-all duration-500 min-h-[2px]`}
            style={{ height: `${Math.max((d[barKey] / maxVal) * 100, 2)}%` }}
          />
          <span className="text-[9px] text-gray-400 whitespace-nowrap">
            {d[labelKey]}
          </span>
        </div>
      ))}
    </div>
  );
}

// Horizontal bar for state comparison
function HorizontalBar({ label, value, maxValue, amount, color }: {
  label: string; value: number; maxValue: number; amount?: string; color: string;
}) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-700 w-32 truncate font-medium">{label}</span>
      <div className="flex-1 h-7 bg-gray-100 rounded-full overflow-hidden relative">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{ width: `${Math.max(pct, 3)}%` }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-700">
          {amount || value}
        </span>
      </div>
    </div>
  );
}

// Donut chart using CSS conic gradient
function DonutChart({ segments, size = 140 }: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return <div className="text-gray-400 text-sm">No data</div>;
  let cumPct = 0;
  const gradientParts = segments.map((seg) => {
    const startPct = cumPct;
    const endPct = cumPct + (seg.value / total) * 100;
    cumPct = endPct;
    return `${seg.color} ${startPct}% ${endPct}%`;
  });
  const gradient = `conic-gradient(${gradientParts.join(', ')})`;

  return (
    <div className="flex items-center gap-4">
      <div
        className="rounded-full relative"
        style={{ width: size, height: size, background: gradient }}
      >
        <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
          <span className="text-lg font-bold text-gray-800">{total}</span>
        </div>
      </div>
      <div className="space-y-1.5">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ background: seg.color }} />
            <span className="text-xs text-gray-600">
              {seg.label}: <strong>{seg.value}</strong> ({total > 0 ? ((seg.value / total) * 100).toFixed(0) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SuperAdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Date range - default to last 30 days
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetch('/api/super-admin/analytics')
      .then((res) => res.json())
      .then((json) => { setData(json); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const setDateRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const exportToCSV = () => {
    if (!data) return;
    const rows = [
      ['Analytics Report'],
      [`Period: ${startDate} to ${endDate}`],
      [],
      ['KPIs'],
      ['Total Guides', data.kpis.totalGuides],
      ['Verified Guides', data.kpis.verifiedGuides],
      ['Total Products', data.kpis.totalProducts],
      ['Approved Products', data.kpis.approvedProducts],
      ['Total Bookings', data.kpis.totalBookings],
      ['Confirmed Bookings', data.kpis.confirmedBookings],
      ['Total Revenue', data.kpis.totalRevenue],
      ['Total Commission', data.kpis.totalCommission],
      ['Total GST', data.kpis.totalGST],
      ['Total Customers', data.kpis.totalCustomers],
      [],
      ['State Analytics'],
      ['State', 'Guides', 'Products', 'Destinations', 'Bookings', 'Revenue', 'Commission'],
      ...data.stateAnalytics.map(s => [s.name, s.guides, s.products, s.destinations, s.bookings, s.revenue, s.commission]),
      [],
      ['Monthly Data'],
      ['Month', 'Bookings', 'Revenue', 'Commission'],
      ...data.monthlyData.map(m => [m.month, m.bookings, m.revenue, m.commission]),
    ];
    const csvContent = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `analytics-${startDate}-to-${endDate}.csv`;
    link.click();
  };

  const exportToExcel = () => {
    if (!data) return;
    const rows = [
      ['Analytics Report'],
      [`Period: ${startDate} to ${endDate}`],
      [],
      ['KPIs'],
      ['Total Guides', data.kpis.totalGuides],
      ['Verified Guides', data.kpis.verifiedGuides],
      ['Total Products', data.kpis.totalProducts],
      ['Approved Products', data.kpis.approvedProducts],
      ['Total Bookings', data.kpis.totalBookings],
      ['Confirmed Bookings', data.kpis.confirmedBookings],
      ['Total Revenue', data.kpis.totalRevenue],
      ['Total Commission', data.kpis.totalCommission],
      ['Total GST', data.kpis.totalGST],
      ['Total Customers', data.kpis.totalCustomers],
      [],
      ['State Analytics'],
      ['State', 'Guides', 'Products', 'Destinations', 'Bookings', 'Revenue', 'Commission'],
      ...data.stateAnalytics.map(s => [s.name, s.guides, s.products, s.destinations, s.bookings, s.revenue, s.commission]),
    ];
    const content = rows.map(r => r.join('\t')).join('\n');
    const blob = new Blob([content], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `analytics-${startDate}-to-${endDate}.xls`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-btg-sand border-t-btg-terracotta rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || !data.kpis) {
    return <div className="text-center py-12 text-gray-500">Failed to load analytics data.</div>;
  }

  const { kpis, stateAnalytics, monthlyData, topGuides, recentBookings, tripTypeBreakdown, userEngagement, conversionFunnel, categoryPerformance } = data;
  const maxStateRevenue = Math.max(...stateAnalytics.map((s) => s.revenue), 1);
  const maxStateBookings = Math.max(...stateAnalytics.map((s) => s.bookings), 1);

  const kpiCards = [
    { label: 'Total Guides', value: kpis.totalGuides, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Verified Guides', value: kpis.verifiedGuides, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Products', value: kpis.totalProducts, icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Approved Products', value: kpis.approvedProducts, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Bookings', value: kpis.totalBookings, icon: ClipboardList, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Confirmed', value: kpis.confirmedBookings, icon: CheckCircle, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Total Revenue', value: formatINR(kpis.totalRevenue), icon: IndianRupee, color: 'text-green-700', bg: 'bg-green-50' },
    { label: 'Commission Earned', value: formatINR(kpis.totalCommission), icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'GST Collected', value: formatINR(kpis.totalGST), icon: Shield, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Total Customers', value: kpis.totalCustomers, icon: Users, color: 'text-sky-600', bg: 'bg-sky-50' },
  ];

  return (
    <div className="space-y-8">
      {/* Header with Date Range and Export */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-btg-dark flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-btg-terracotta" />
            Platform Analytics
          </h1>
          <p className="text-gray-500 mt-1">Comprehensive overview of the BookTheGuide platform</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Date Range:</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setDateRange(7)} className="px-3 py-1.5 text-xs bg-gray-100 rounded-lg hover:bg-gray-200">7 Days</button>
            <button onClick={() => setDateRange(30)} className="px-3 py-1.5 text-xs bg-gray-100 rounded-lg hover:bg-gray-200">30 Days</button>
            <button onClick={() => setDateRange(90)} className="px-3 py-1.5 text-xs bg-gray-100 rounded-lg hover:bg-gray-200">90 Days</button>
            <button onClick={() => setDateRange(365)} className="px-3 py-1.5 text-xs bg-gray-100 rounded-lg hover:bg-gray-200">1 Year</button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpiCards.map((card, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className={`inline-flex p-2 rounded-lg ${card.bg} mb-3`}>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <div className="text-xl font-bold text-gray-900">{card.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Tax Breakdown Card */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-red-500" />
          Tax &amp; Commission Breakdown
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-lg font-bold text-green-700">{formatINR(kpis.totalRevenue)}</div>
            <div className="text-xs text-green-600">Gross Revenue</div>
          </div>
          <div className="bg-amber-50 rounded-lg p-4 text-center">
            <div className="text-lg font-bold text-amber-700">{formatINR(kpis.totalCommission)}</div>
            <div className="text-xs text-amber-600">Platform Commission</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <div className="text-lg font-bold text-red-700">{formatINR(kpis.totalCGST)}</div>
            <div className="text-xs text-red-600">CGST (2.5%)</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <div className="text-lg font-bold text-red-700">{formatINR(kpis.totalSGST)}</div>
            <div className="text-xs text-red-600">SGST (2.5%)</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-lg font-bold text-blue-700">{formatINR(kpis.totalRevenue - kpis.totalCommission - kpis.totalGST)}</div>
            <div className="text-xs text-blue-600">Guide Earnings</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Bookings Chart */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-btg-terracotta" />
            Monthly Bookings (12 months)
          </h3>
          <BarChart data={monthlyData} barKey="bookings" labelKey="month" color="bg-btg-terracotta" />
        </div>

        {/* Monthly Revenue Chart */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-green-500" />
            Monthly Revenue (12 months)
          </h3>
          <BarChart data={monthlyData} barKey="revenue" labelKey="month" color="bg-green-500" />
        </div>
      </div>

      {/* Trip Type Breakdown + Commission Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-purple-500" />
            Booking Type Distribution
          </h3>
          <DonutChart
            segments={[
              { label: 'Fixed Departures', value: tripTypeBreakdown.fixed, color: '#22c55e' },
              { label: 'Personal Bookings', value: tripTypeBreakdown.personal, color: '#3b82f6' },
            ]}
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-500" />
            Monthly Commission (12 months)
          </h3>
          <BarChart data={monthlyData} barKey="commission" labelKey="month" color="bg-amber-500" />
        </div>
      </div>

      {/* State-wise Analytics */}
      {stateAnalytics.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-sky-500" />
            State-wise Performance
          </h3>

          {/* Revenue by State */}
          <div className="mb-6">
            <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">Revenue by State</p>
            <div className="space-y-2">
              {stateAnalytics
                .sort((a, b) => b.revenue - a.revenue)
                .map((s) => (
                  <HorizontalBar
                    key={s.id}
                    label={s.name}
                    value={s.revenue}
                    maxValue={maxStateRevenue}
                    amount={formatINR(s.revenue)}
                    color="bg-green-400"
                  />
                ))}
            </div>
          </div>

          {/* Bookings by State */}
          <div className="mb-6">
            <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">Bookings by State</p>
            <div className="space-y-2">
              {stateAnalytics
                .sort((a, b) => b.bookings - a.bookings)
                .map((s) => (
                  <HorizontalBar
                    key={s.id}
                    label={s.name}
                    value={s.bookings}
                    maxValue={maxStateBookings}
                    color="bg-btg-blush"
                  />
                ))}
            </div>
          </div>

          {/* State table */}
          <div className="overflow-x-auto mt-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="pb-2 font-medium text-gray-500">State</th>
                  <th className="pb-2 font-medium text-gray-500 text-center">Guides</th>
                  <th className="pb-2 font-medium text-gray-500 text-center">Products</th>
                  <th className="pb-2 font-medium text-gray-500 text-center">Destinations</th>
                  <th className="pb-2 font-medium text-gray-500 text-center">Bookings</th>
                  <th className="pb-2 font-medium text-gray-500 text-right">Revenue</th>
                  <th className="pb-2 font-medium text-gray-500 text-right">Commission</th>
                  <th className="pb-2 font-medium text-gray-500 text-center">Rate</th>
                </tr>
              </thead>
              <tbody>
                {stateAnalytics.map((s) => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-2 font-medium text-gray-800">{s.name}</td>
                    <td className="py-2 text-center">{s.guides}</td>
                    <td className="py-2 text-center">{s.products}</td>
                    <td className="py-2 text-center">{s.destinations}</td>
                    <td className="py-2 text-center">{s.bookings}</td>
                    <td className="py-2 text-right font-medium text-green-700">{formatINR(s.revenue)}</td>
                    <td className="py-2 text-right font-medium text-amber-700">{formatINR(s.commission)}</td>
                    <td className="py-2 text-center text-gray-600">{s.commissionPercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Guides + Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Guides by Revenue */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            Top 10 Guides by Revenue
          </h3>
          <div className="space-y-3">
            {topGuides.map((guide, i) => (
              <div key={guide.id} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  i < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800">{guide.name}</div>
                  <div className="text-xs text-gray-500">
                    &#11088; {guide.rating.toFixed(1)} &bull; {guide.trips} trips &bull; {guide.bookings} bookings
                  </div>
                </div>
                <span className="text-sm font-bold text-green-700">{formatINR(guide.revenue)}</span>
              </div>
            ))}
            {topGuides.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">No guide revenue data yet</p>
            )}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-orange-500" />
            Recent Bookings
          </h3>
          <div className="space-y-2">
            {recentBookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <div className="text-sm font-medium text-gray-800">#{b.bookingNumber}</div>
                  <div className="text-xs text-gray-500">{b.customerName} &bull; {b.date}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-green-700">{formatINR(b.amount)}</div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    b.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                    b.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
            {recentBookings.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">No bookings yet</p>
            )}
          </div>
        </div>
      </div>

      {/* User Engagement Section */}
      {userEngagement && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-500" />
            User Engagement
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-purple-700">{userEngagement.totalUsers}</div>
              <div className="text-xs text-purple-600">Total Users</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-blue-700">{userEngagement.activeUsers}</div>
              <div className="text-xs text-blue-600">Active Users</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-green-700">{userEngagement.repeatCustomers}</div>
              <div className="text-xs text-green-600">Repeat Customers</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-orange-700">{userEngagement.avgBookingsPerCustomer}</div>
              <div className="text-xs text-orange-600">Avg Bookings/User</div>
            </div>
            <div className="bg-teal-50 rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-teal-700">{userEngagement.engagementRate}%</div>
              <div className="text-xs text-teal-600">Engagement Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* Conversion Funnel Section */}
      {conversionFunnel && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-500" />
            Conversion Funnel
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-yellow-700">{conversionFunnel.pending}</div>
              <div className="text-xs text-yellow-600">Pending</div>
            </div>
            <div className="bg-indigo-50 rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-indigo-700">{conversionFunnel.quoteSent}</div>
              <div className="text-xs text-indigo-600">Quote Sent</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-blue-700">{conversionFunnel.confirmed}</div>
              <div className="text-xs text-blue-600">Confirmed</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-green-700">{conversionFunnel.completed}</div>
              <div className="text-xs text-green-600">Completed</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-red-700">{conversionFunnel.cancelled}</div>
              <div className="text-xs text-red-600">Cancelled</div>
            </div>
            <div className="bg-emerald-50 rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-emerald-700">{conversionFunnel.conversionRate}%</div>
              <div className="text-xs text-emerald-600">Conversion Rate</div>
            </div>
          </div>
          {/* Funnel visualization */}
          <div className="flex flex-col items-center gap-1 mt-6">
            <div className="w-full max-w-lg bg-yellow-200 h-8 rounded-t-lg flex items-center justify-center text-sm font-medium text-yellow-800">
              Pending: {conversionFunnel.pending}
            </div>
            <div className="w-5/6 max-w-md bg-indigo-200 h-8 flex items-center justify-center text-sm font-medium text-indigo-800">
              Quote Sent: {conversionFunnel.quoteSent}
            </div>
            <div className="w-4/6 max-w-sm bg-blue-200 h-8 flex items-center justify-center text-sm font-medium text-blue-800">
              Confirmed: {conversionFunnel.confirmed}
            </div>
            <div className="w-3/6 max-w-xs bg-green-200 h-8 rounded-b-lg flex items-center justify-center text-sm font-medium text-green-800">
              Completed: {conversionFunnel.completed}
            </div>
          </div>
        </div>
      )}

      {/* Category Performance Section */}
      {categoryPerformance && categoryPerformance.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-orange-500" />
            Product Performance by Category
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="pb-2 font-medium text-gray-500">Category</th>
                  <th className="pb-2 font-medium text-gray-500 text-center">Products</th>
                  <th className="pb-2 font-medium text-gray-500 text-center">Bookings</th>
                  <th className="pb-2 font-medium text-gray-500 text-right">Revenue</th>
                  <th className="pb-2 font-medium text-gray-500 text-right">Avg Revenue/Booking</th>
                </tr>
              </thead>
              <tbody>
                {categoryPerformance.map((cat) => (
                  <tr key={cat.category} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-2 font-medium text-gray-800">{cat.category}</td>
                    <td className="py-2 text-center">{cat.products}</td>
                    <td className="py-2 text-center">{cat.bookings}</td>
                    <td className="py-2 text-right font-medium text-green-700">{formatINR(cat.revenue)}</td>
                    <td className="py-2 text-right font-medium text-blue-700">
                      {cat.bookings > 0 ? formatINR(cat.revenue / cat.bookings) : '₹0'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
