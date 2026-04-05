'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Bot, MessageSquare, Users, MousePointerClick, TrendingUp,
  BarChart3, Search, Clock, ArrowUpRight,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface AiAnalytics {
  kpis: {
    totalQueries: number;
    totalSessions: number;
    uniqueUsers: number;
    messagesPerSession: string;
    clickedPackages: number;
    conversionRate: string;
  };
  dailyQueries: { date: string; count: number }[];
  topKeywords: { keyword: string; count: number }[];
  recentQueries: {
    id: string;
    query: string;
    response: string;
    sessionId: string;
    createdAt: string;
    user: { name: string; email: string } | null;
    clickedPackage: { title: string; slug: string } | null;
  }[];
}

export default function AiAnalyticsPage() {
  const [data, setData] = useState<AiAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/super-admin/ai-analytics?days=${days}`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-btg-terracotta"></div>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-20 text-gray-500">Failed to load AI analytics</div>;
  }

  const maxBarCount = Math.max(...(data.topKeywords.map(k => k.count)), 1);

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-heading text-btg-dark">AI Travel Planner Analytics</h1>
          <p className="text-gray-600 mt-1">Track AI chatbot performance and user intent</p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-btg-terracotta/20"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          <option value={365}>Last year</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <MessageSquare className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{data.kpis.totalQueries}</p>
            <p className="text-xs text-gray-500">Total Queries</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Bot className="w-5 h-5 text-purple-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{data.kpis.totalSessions}</p>
            <p className="text-xs text-gray-500">Sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{data.kpis.uniqueUsers}</p>
            <p className="text-xs text-gray-500">Unique Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="w-5 h-5 text-amber-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{data.kpis.messagesPerSession}</p>
            <p className="text-xs text-gray-500">Msgs / Session</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <MousePointerClick className="w-5 h-5 text-sky-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{data.kpis.clickedPackages}</p>
            <p className="text-xs text-gray-500">Package Clicks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-5 h-5 text-btg-terracotta mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{data.kpis.conversionRate}%</p>
            <p className="text-xs text-gray-500">Conversion</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Daily Query Chart */}
        <Card>
          <CardContent className="p-6">
            <h2 className="font-bold text-btg-dark mb-4">Daily Queries</h2>
            {data.dailyQueries.length > 0 ? (
              <div className="space-y-1.5">
                {data.dailyQueries.slice(-14).map((day) => {
                  const maxCount = Math.max(...data.dailyQueries.map(d => d.count), 1);
                  const barWidth = (day.count / maxCount) * 100;
                  return (
                    <div key={day.date} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-20 flex-shrink-0">
                        {new Date(day.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-5 relative overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-btg-terracotta to-btg-sage h-full rounded-full transition-all"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 w-8 text-right">{day.count}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No query data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Top Keywords */}
        <Card>
          <CardContent className="p-6">
            <h2 className="font-bold text-btg-dark mb-4">Top Search Keywords</h2>
            {data.topKeywords.length > 0 ? (
              <div className="space-y-2">
                {data.topKeywords.slice(0, 15).map((kw, i) => (
                  <div key={kw.keyword} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-5">{i + 1}.</span>
                    <span className="text-sm text-gray-800 w-28 truncate font-medium">{kw.keyword}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-blue-400 h-full rounded-full"
                        style={{ width: `${(kw.count / maxBarCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-600 w-8 text-right">{kw.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No keyword data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Queries Table */}
      <Card>
        <CardContent className="p-6">
          <h2 className="font-bold text-btg-dark mb-4">Recent Query Log</h2>
          {data.recentQueries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">Time</th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">User</th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">Query</th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">Clicked Package</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentQueries.map((q) => (
                    <tr key={q.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap">
                        {new Date(q.createdAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3">
                        {q.user ? (
                          <span className="text-gray-800">{q.user.name}</span>
                        ) : (
                          <span className="text-gray-400 italic">Anonymous</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 max-w-xs truncate text-gray-700">{q.query}</td>
                      <td className="py-2.5 px-3">
                        {q.clickedPackage ? (
                          <Badge size="sm" variant="success">
                            <ArrowUpRight className="w-3 h-3 mr-1" />
                            {q.clickedPackage.title}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No AI queries logged yet. Queries will appear here as users interact with the AI Travel Planner.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
