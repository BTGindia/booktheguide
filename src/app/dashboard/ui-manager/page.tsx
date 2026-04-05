'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, Home, MapPin, Users, Compass, Mountain, ArrowRight, PenTool, HelpCircle, Globe, FileText } from 'lucide-react';

interface PageConfigSummary {
  pageSlug: string;
  sectionsConfigured: number;
  lastUpdated: string | null;
}

const PAGE_CARDS = [
  { slug: 'homepage', label: 'Homepage', description: 'Control hero, trending, destinations, and featured sections', icon: Home, href: '/dashboard/ui-manager/homepage' },
  { slug: 'group-trips', label: 'Group Trips', description: 'Order and feature group trip packages', icon: Users, href: '/dashboard/ui-manager/group-trips' },
  { slug: 'destinations', label: 'Destinations', description: 'Choose featured destinations and ordering', icon: MapPin, href: '/dashboard/ui-manager/destinations' },
  { slug: 'states', label: 'State Pages', description: 'Configure state hub display settings', icon: Mountain, href: '/dashboard/ui-manager/states' },
  { slug: 'experiences', label: 'Experiences', description: 'Control category landing page sections', icon: Compass, href: '/dashboard/ui-manager/experiences' },
  { slug: 'blogs', label: 'Blogs & Content', description: 'Write and manage blog posts, videos, and podcasts', icon: PenTool, href: '/dashboard/ui-manager/blogs' },
  { slug: 'faqs', label: 'FAQs', description: 'Manage frequently asked questions across all pages', icon: HelpCircle, href: '/dashboard/ui-manager/faqs' },
  { slug: 'seo-content', label: 'SEO Content', description: 'Write descriptions for states and destinations', icon: Globe, href: '/dashboard/ui-manager/seo-content' },
  { slug: 'pages', label: 'All Pages', description: 'Visual editor for any page content and layout', icon: FileText, href: '/dashboard/ui-manager/pages' },
];

export default function UIManagerDashboard() {
  const [configs, setConfigs] = useState<PageConfigSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ui-manager/configs')
      .then((res) => res.json())
      .then((data) => {
        setConfigs(data.configs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getConfigForPage = (slug: string) => configs.find((c) => c.pageSlug === slug);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-heading text-btg-dark">UI Manager Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Control the display order, featured items, and sorting for every public page.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {PAGE_CARDS.map((card) => {
          const config = getConfigForPage(card.slug);
          return (
            <Link
              key={card.slug}
              href={card.href}
              className="group bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-[#58bdae]/10 flex items-center justify-center">
                  <card.icon className="w-5 h-5 text-[#58bdae]" />
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#FF7F50] transition-colors" />
              </div>
              <h3 className="font-heading text-lg font-bold text-gray-900 group-hover:text-[#58bdae] transition-colors">{card.label}</h3>
              <p className="text-sm text-gray-500 mt-1 mb-4">{card.description}</p>
              {config ? (
                <div className="text-xs text-[#58bdae] font-medium">
                  {config.sectionsConfigured} sections configured
                  {config.lastUpdated && ` · Updated ${new Date(config.lastUpdated).toLocaleDateString()}`}
                </div>
              ) : (
                <div className="text-xs text-gray-400">Not configured yet</div>
              )}
            </Link>
          );
        })}
      </div>

      <div className="bg-[#F5F0E8] rounded-2xl p-6 border border-[#EDE8DF]">
        <h2 className="font-heading text-lg font-bold text-gray-900 mb-2">How it works</h2>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>• <strong>Section Order:</strong> Choose which sections appear on each page and their sort criteria (highest booked, best rated, newest, etc.)</li>
          <li>• <strong>Featured Items:</strong> Pin specific packages, guides, or destinations to featured positions in any section.</li>
          <li>• <strong>Display Settings:</strong> Control items per row, visibility toggles, and layout preferences.</li>
          <li>• Changes are saved instantly and apply on the next page load (ISR revalidation).</li>
        </ul>
      </div>
    </div>
  );
}
