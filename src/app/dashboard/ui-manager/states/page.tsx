'use client';

import VisualPageEditor from '@/components/admin/VisualPageEditor';

const STATE_PAGE_SECTIONS = [
  { key: 'hero', label: 'Hero Banner', description: 'State hero image and intro', supportsSorting: false, supportsLimit: false },
  { key: 'categories', label: 'Experience Categories', description: 'Category cards for the state', supportsSorting: false, supportsLimit: false },
  { key: 'top_destinations', label: 'Top Destinations', description: 'Featured destinations in this state', supportsSorting: true, maxLimit: 12 },
  { key: 'popular_experiences', label: 'Popular Experiences', description: 'Top-rated packages in the state', supportsSorting: true, maxLimit: 12 },
  { key: 'top_guides', label: 'Top Guides', description: 'Highest-rated guides in this state', supportsSorting: true, maxLimit: 8 },
  { key: 'faq', label: 'FAQ Section', description: 'Frequently asked questions', supportsSorting: false, supportsLimit: false },
  { key: 'cta', label: 'CTA Banner', description: 'Call-to-action for custom trips', supportsSorting: false, supportsLimit: false },
];

export default function StatesConfigPage() {
  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-btg-dark">State Pages Configuration</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure display settings for all state hub pages. These settings apply as the default for all state pages.
        </p>
      </div>

      <VisualPageEditor
        pageSlug="state-pages-default"
        pageTitle="Default State Page Settings"
        sections={STATE_PAGE_SECTIONS}
      />
    </div>
  );
}
