'use client';

import VisualPageEditor from '@/components/admin/VisualPageEditor';

const HOMEPAGE_SECTIONS = [
  { key: 'hero', label: 'Hero Banner', description: 'Main hero image and call-to-action', supportsSorting: false, supportsLimit: false },
  { key: 'how_it_works', label: 'How It Works', description: 'Step-by-step process cards', supportsSorting: false, supportsLimit: false },
  { key: 'categories', label: 'Experience Categories', description: 'Tourist Guides, Group Trips, etc.', supportsSorting: false, supportsLimit: false },
  { key: 'destinations', label: 'Top Destinations', description: 'Featured destination cards', supportsSorting: true, maxLimit: 20 },
  { key: 'weekend', label: 'Weekend Getaways', description: 'Short weekend trip packages', supportsSorting: true, maxLimit: 12 },
  { key: 'trending', label: 'Trending Experiences', description: 'Most popular packages right now', supportsSorting: true, maxLimit: 12 },
  { key: 'adventure', label: 'Adventure Picks', description: 'Top adventure experiences', supportsSorting: true, maxLimit: 12 },
  { key: 'influencers', label: 'Travel with Influencers', description: 'Influencer-led trips', supportsSorting: true, maxLimit: 8 },
  { key: 'neev_ai', label: 'NEEV AI Section', description: 'AI trip planner CTA', supportsSorting: false, supportsLimit: false },
  { key: 'heritage', label: 'Heritage Walks', description: 'Heritage walk experiences', supportsSorting: true, maxLimit: 12 },
];

export default function HomepageConfigPage() {
  return (
    <VisualPageEditor
      pageSlug="homepage"
      pageTitle="Homepage Configuration"
      sections={HOMEPAGE_SECTIONS}
    />
  );
}
