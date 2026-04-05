'use client';

import Link from 'next/link';
import {
  Home, Globe, MapPin, Layers, Users, BookOpen,
  HelpCircle, FileText, Palette, LayoutDashboard,
} from 'lucide-react';

const uiManagerPages = [
  { label: 'Overview', href: '/dashboard/ui-manager', icon: LayoutDashboard, description: 'UI Manager dashboard overview' },
  { label: 'Homepage', href: '/dashboard/ui-manager/homepage', icon: Home, description: 'Hero, trending, categories, destinations sections' },
  { label: 'Group Trips', href: '/dashboard/ui-manager/group-trips', icon: Users, description: 'Upcoming & popular trips, reviews' },
  { label: 'Destinations', href: '/dashboard/ui-manager/destinations', icon: Globe, description: 'Featured, trending, weekend destinations' },
  { label: 'State Pages', href: '/dashboard/ui-manager/states', icon: MapPin, description: 'State hubs display settings' },
  { label: 'Experiences', href: '/dashboard/ui-manager/experiences', icon: Layers, description: 'Category landing pages' },
  { label: 'Blogs & Content', href: '/dashboard/ui-manager/blogs', icon: BookOpen, description: 'Blog posts, videos, podcasts' },
  { label: 'FAQs', href: '/dashboard/ui-manager/faqs', icon: HelpCircle, description: 'Manage FAQs by category' },
  { label: 'SEO Content', href: '/dashboard/ui-manager/seo-content', icon: FileText, description: 'Meta tags & descriptions' },
  { label: 'All Pages Editor', href: '/dashboard/ui-manager/pages', icon: Palette, description: 'Visual editor for all pages' },
];

export default function SuperAdminUIManagerHub() {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-btg-dark">UI Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Control all page layouts, content, and display settings. The UI Manager role has been deprecated — all functions are now managed here.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {uiManagerPages.map((page) => (
          <Link
            key={page.href}
            href={page.href}
            className="flex items-start gap-4 p-5 bg-white rounded-xl border border-gray-200 hover:border-btg-terracotta/40 hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-btg-cream flex items-center justify-center flex-shrink-0 group-hover:bg-btg-terracotta/10 transition-colors">
              <page.icon className="w-5 h-5 text-btg-terracotta" />
            </div>
            <div>
              <h3 className="font-medium text-btg-dark group-hover:text-btg-terracotta transition-colors">{page.label}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{page.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
