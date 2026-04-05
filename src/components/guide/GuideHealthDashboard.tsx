'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import {
  Activity, TrendingUp, Star, Shield, UserCheck,
  MessageCircle, Calendar, Award, ChevronDown, ChevronUp,
  RefreshCw, Lightbulb,
} from 'lucide-react';

interface ScoreBreakdown {
  conversion: number;
  review: number;
  reliability: number;
  profile: number;
  response: number;
  availability: number;
  experience: number;
  total: number;
}

interface ScoreTip {
  dimension: string;
  score: number;
  maxScore: number;
  percentage: number;
  tips: string[];
}

interface ScoreData {
  score: number;
  breakdown: ScoreBreakdown;
  tips: ScoreTip[];
  updatedAt: string;
}

const DIMENSION_CONFIG: Record<string, { icon: any; color: string; bgColor: string }> = {
  'Conversion Rate': { icon: TrendingUp, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  'Review Score': { icon: Star, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  'Reliability': { icon: Shield, color: 'text-green-600', bgColor: 'bg-green-50' },
  'Profile Completeness': { icon: UserCheck, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  'Response Rate & Speed': { icon: MessageCircle, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  'Availability': { icon: Calendar, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  'Experience & Credentials': { icon: Award, color: 'text-rose-600', bgColor: 'bg-rose-50' },
};

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Average';
  return 'Needs Improvement';
}

function getBarColor(percentage: number): string {
  if (percentage >= 80) return 'bg-green-500';
  if (percentage >= 60) return 'bg-blue-500';
  if (percentage >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}

export default function GuideHealthDashboard() {
  const [data, setData] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDimension, setExpandedDimension] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchScore();
  }, []);

  const fetchScore = async () => {
    try {
      const res = await fetch('/api/guide/score');
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (err) {
      console.error('Failed to fetch score:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/guide/score/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        await fetchScore();
      }
    } catch (err) {
      console.error('Failed to refresh score:', err);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-48"></div>
            <div className="h-20 bg-gray-100 rounded"></div>
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-100 rounded"></div>)}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-btg-terracotta" />
            <h2 className="text-lg font-bold text-gray-900">Guide Health Score</h2>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-btg-terracotta transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Overall Score Ring */}
        <div className="flex items-center gap-6 mb-6 p-4 bg-gradient-to-r from-gray-50 to-btg-sand/30 rounded-xl">
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg className="transform -rotate-90 w-24 h-24" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" stroke="#e5e7eb" strokeWidth="8" fill="none" />
              <circle
                cx="50" cy="50" r="42"
                stroke={data.score >= 80 ? '#22c55e' : data.score >= 60 ? '#3b82f6' : data.score >= 40 ? '#eab308' : '#ef4444'}
                strokeWidth="8" fill="none"
                strokeLinecap="round"
                strokeDasharray={`${(data.score / 100) * 264} 264`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-bold ${getScoreColor(data.score)}`}>{data.score}</span>
              <span className="text-[10px] text-gray-400">/100</span>
            </div>
          </div>
          <div>
            <p className={`text-lg font-semibold ${getScoreColor(data.score)}`}>{getScoreLabel(data.score)}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Last updated: {new Date(data.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
            {data.score < 80 && (
              <p className="text-xs text-gray-600 mt-2 flex items-start gap-1">
                <Lightbulb className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0 mt-0.5" />
                Improve your weakest dimensions below to boost your ranking and visibility.
              </p>
            )}
          </div>
        </div>

        {/* Dimension Bars */}
        <div className="space-y-2">
          {data.tips.map((tip) => {
            const config = DIMENSION_CONFIG[tip.dimension] || { icon: Activity, color: 'text-gray-600', bgColor: 'bg-gray-50' };
            const Icon = config.icon;
            const isExpanded = expandedDimension === tip.dimension;

            return (
              <div key={tip.dimension} className="border border-gray-100 rounded-lg overflow-hidden">
                <button
                  type="button"
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedDimension(isExpanded ? null : tip.dimension)}
                >
                  <div className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-800">{tip.dimension}</span>
                      <span className="text-sm font-semibold text-gray-700">{tip.score}/{tip.maxScore}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${getBarColor(tip.percentage)}`}
                        style={{ width: `${tip.percentage}%` }}
                      />
                    </div>
                  </div>
                  {tip.tips.length > 0 && (
                    isExpanded
                      ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {isExpanded && tip.tips.length > 0 && (
                  <div className="px-3 pb-3 ml-11">
                    <ul className="space-y-1.5">
                      {tip.tips.map((t, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                          <Lightbulb className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0 mt-0.5" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
