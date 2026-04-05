'use client';

import { useState } from 'react';
import { FileText, Layout, ChevronRight, ArrowLeft } from 'lucide-react';
import VisualPageEditor from '@/components/admin/VisualPageEditor';

interface PageDef {
  slug: string;
  title: string;
  description: string;
  sections: { key: string; label: string; description: string; supportsSorting?: boolean; supportsLimit?: boolean; maxLimit?: number }[];
}

const ALL_PAGES: PageDef[] = [
  {
    slug: 'homepage',
    title: 'Homepage',
    description: 'Main landing page of the website',
    sections: [
      { key: 'hero', label: 'Hero Banner', description: 'Main hero section', supportsSorting: false, supportsLimit: false },
      { key: 'search', label: 'Search Bar', description: 'Search section', supportsSorting: false, supportsLimit: false },
      { key: 'trending', label: 'Trending Destinations', description: 'Popular destinations', supportsSorting: true, maxLimit: 12 },
      { key: 'experiences', label: 'Experiences', description: 'Experience categories', supportsSorting: true, maxLimit: 8 },
      { key: 'featured_guides', label: 'Featured Guides', description: 'Top-rated guides', supportsSorting: true, maxLimit: 8 },
      { key: 'testimonials', label: 'Testimonials', description: 'Customer reviews', supportsSorting: true, maxLimit: 6 },
      { key: 'cta', label: 'CTA Section', description: 'Call to action', supportsSorting: false, supportsLimit: false },
    ],
  },
  {
    slug: 'group-trips',
    title: 'Group Trips',
    description: 'Group trips listing page',
    sections: [
      { key: 'hero', label: 'Hero Banner', description: 'Main hero with trip count stats', supportsSorting: false, supportsLimit: false },
      { key: 'upcoming', label: 'Upcoming Group Trips', description: 'Fixed-departure trips', supportsSorting: true, maxLimit: 20 },
      { key: 'popular', label: 'Popular Group Trips', description: 'Most booked group trips', supportsSorting: true, maxLimit: 12 },
      { key: 'by_destination', label: 'Trips by Destination', description: 'Trips by destination', supportsSorting: true, maxLimit: 20 },
      { key: 'reviews', label: 'Traveller Reviews', description: 'Featured reviews', supportsSorting: true, maxLimit: 10 },
      { key: 'cta', label: 'Custom Trip CTA', description: 'Call-to-action', supportsSorting: false, supportsLimit: false },
    ],
  },
  {
    slug: 'destinations',
    title: 'Destinations',
    description: 'Destinations listing page',
    sections: [
      { key: 'hero', label: 'Hero Banner', description: 'Main hero', supportsSorting: false, supportsLimit: false },
      { key: 'featured', label: 'Featured Destinations', description: 'Top destinations', supportsSorting: true, maxLimit: 12 },
      { key: 'by_state', label: 'By State', description: 'Destinations by state', supportsSorting: true, maxLimit: 30 },
      { key: 'trending', label: 'Trending', description: 'Trending destinations', supportsSorting: true, maxLimit: 12 },
      { key: 'weekend', label: 'Weekend Getaways', description: 'Weekend spots', supportsSorting: true, maxLimit: 8 },
      { key: 'cta', label: 'Explore CTA', description: 'Call-to-action', supportsSorting: false, supportsLimit: false },
    ],
  },
  {
    slug: 'state-pages-default',
    title: 'State Pages (Default)',
    description: 'Default settings for all state hub pages',
    sections: [
      { key: 'hero', label: 'Hero Banner', description: 'State hero', supportsSorting: false, supportsLimit: false },
      { key: 'categories', label: 'Categories', description: 'Experience categories', supportsSorting: false, supportsLimit: false },
      { key: 'top_destinations', label: 'Top Destinations', description: 'Featured destinations', supportsSorting: true, maxLimit: 12 },
      { key: 'popular_experiences', label: 'Popular Experiences', description: 'Top packages', supportsSorting: true, maxLimit: 12 },
      { key: 'top_guides', label: 'Top Guides', description: 'Best guides', supportsSorting: true, maxLimit: 8 },
      { key: 'faq', label: 'FAQ', description: 'FAQs', supportsSorting: false, supportsLimit: false },
      { key: 'cta', label: 'CTA', description: 'Call-to-action', supportsSorting: false, supportsLimit: false },
    ],
  },
  {
    slug: 'experiences-default',
    title: 'Experience Pages (Default)',
    description: 'Default settings for experience category pages',
    sections: [
      { key: 'hero', label: 'Hero Banner', description: 'Category hero', supportsSorting: false, supportsLimit: false },
      { key: 'quick_filters', label: 'Quick Filters', description: 'Filter pills', supportsSorting: false, supportsLimit: false },
      { key: 'by_state', label: 'By State', description: 'State browsing', supportsSorting: true, maxLimit: 12 },
      { key: 'all_experiences', label: 'All Experiences', description: 'Main listing', supportsSorting: true, maxLimit: 20 },
      { key: 'recommended', label: 'Recommended', description: 'Top rated 4+', supportsSorting: true, maxLimit: 12 },
      { key: 'other_categories', label: 'Other Categories', description: 'Related categories', supportsSorting: false, supportsLimit: false },
      { key: 'blog', label: 'Blog', description: 'Blog posts', supportsSorting: false, supportsLimit: false },
      { key: 'faq', label: 'FAQ', description: 'FAQs', supportsSorting: false, supportsLimit: false },
      { key: 'cta', label: 'CTA', description: 'Call-to-action', supportsSorting: false, supportsLimit: false },
    ],
  },
  {
    slug: 'about',
    title: 'About Us',
    description: 'About page',
    sections: [
      { key: 'hero', label: 'Hero', description: 'About hero', supportsSorting: false, supportsLimit: false },
      { key: 'mission', label: 'Mission', description: 'Our mission', supportsSorting: false, supportsLimit: false },
      { key: 'team', label: 'Team', description: 'Team section', supportsSorting: false, supportsLimit: false },
      { key: 'stats', label: 'Stats', description: 'Company stats', supportsSorting: false, supportsLimit: false },
      { key: 'cta', label: 'CTA', description: 'Call-to-action', supportsSorting: false, supportsLimit: false },
    ],
  },
  {
    slug: 'contact',
    title: 'Contact Us',
    description: 'Contact page',
    sections: [
      { key: 'hero', label: 'Hero', description: 'Contact hero', supportsSorting: false, supportsLimit: false },
      { key: 'form', label: 'Contact Form', description: 'Main form', supportsSorting: false, supportsLimit: false },
      { key: 'info', label: 'Contact Info', description: 'Address & details', supportsSorting: false, supportsLimit: false },
      { key: 'faq', label: 'FAQ', description: 'Common questions', supportsSorting: false, supportsLimit: false },
    ],
  },
];

export default function AllPagesEditor() {
  const [selectedPage, setSelectedPage] = useState<PageDef | null>(null);

  if (selectedPage) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedPage(null)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#58bdae] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to All Pages
        </button>
        <VisualPageEditor
          pageSlug={selectedPage.slug}
          pageTitle={selectedPage.title}
          sections={selectedPage.sections}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-heading text-btg-dark flex items-center gap-2">
          <FileText className="w-6 h-6 text-[#58bdae]" />
          All Pages
        </h1>
        <p className="text-sm text-gray-500 mt-1">Choose any page to edit sections, content blocks, and layout</p>
      </div>

      {/* Page Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ALL_PAGES.map(page => (
          <button
            key={page.slug}
            onClick={() => setSelectedPage(page)}
            className="bg-white rounded-xl border border-gray-100 p-5 text-left hover:shadow-lg hover:border-[#58bdae]/30 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="p-2 rounded-lg bg-[#58bdae]/10 text-[#58bdae]">
                <Layout className="w-5 h-5" />
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#58bdae] transition-colors" />
            </div>
            <h3 className="font-semibold text-btg-dark mt-3">{page.title}</h3>
            <p className="text-xs text-gray-500 mt-1">{page.description}</p>
            <p className="text-[10px] text-gray-400 mt-2">{page.sections.length} sections · /{page.slug}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
