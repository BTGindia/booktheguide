'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

interface CompletenessSection {
  name: string;
  score: number;
  maxScore: number;
  fields: { name: string; filled: boolean; points: number }[];
}

interface Completeness {
  score: number;
  sections: CompletenessSection[];
  missingFields: string[];
  tips: string[];
}

export default function ProfileCompletenessWidget() {
  const [data, setData] = useState<Completeness | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch('/api/guide/completeness')
      .then(r => r.json())
      .then(d => setData(d.completeness))
      .catch(() => {});
  }, []);

  if (!data) return null;

  const score = data.score;
  const colorClass = score >= 80 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : 'text-red-600';
  const bgClass = score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-btg-dark">Profile Completeness</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Complete your profile to rank higher in search results
            </p>
          </div>
          <div className={`text-3xl font-bold ${colorClass}`}>{score}%</div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div
            className={`${bgClass} h-3 rounded-full transition-all duration-500`}
            style={{ width: `${score}%` }}
          />
        </div>

        {/* Section breakdown */}
        <div className="space-y-2 mb-4">
          {data.sections.map((section) => (
            <div key={section.name} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{section.name}</span>
              <span className={section.score === section.maxScore ? 'text-green-600 font-medium' : 'text-gray-500'}>
                {section.score}/{section.maxScore}
              </span>
            </div>
          ))}
        </div>

        {/* Tips */}
        {data.tips.length > 0 && (
          <div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-sm text-btg-terracotta font-medium hover:underline"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {expanded ? 'Hide' : 'Show'} improvement tips
            </button>
            {expanded && (
              <div className="mt-3 space-y-2">
                {data.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {score < 100 && (
          <Link
            href="/dashboard/guide/profile"
            className="mt-4 inline-block text-sm text-btg-terracotta font-medium hover:underline"
          >
            Complete your profile →
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
