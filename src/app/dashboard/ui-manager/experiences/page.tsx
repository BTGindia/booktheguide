'use client';

import VisualPageEditor from '@/components/admin/VisualPageEditor';

const EXPERIENCE_SECTIONS = [
  { key: 'hero', label: 'Hero Banner', description: 'Category hero with stats', supportsSorting: false, supportsLimit: false },
  { key: 'quick_filters', label: 'Quick Filters', description: 'Activity type filter pills', supportsSorting: false, supportsLimit: false },
  { key: 'by_state', label: 'Explore by State', description: 'State-based browsing cards', supportsSorting: true, maxLimit: 12 },
  { key: 'all_experiences', label: 'All Experiences', description: 'Main package listing', supportsSorting: true, maxLimit: 20 },
  { key: 'recommended', label: 'Recommended', description: 'Top-rated packages (4+ rating)', supportsSorting: true, maxLimit: 12 },
  { key: 'other_categories', label: 'Other Categories', description: 'Links to other experience types', supportsSorting: false, supportsLimit: false },
  { key: 'blog', label: 'Blog Section', description: 'Related blog posts', supportsSorting: false, supportsLimit: false },
  { key: 'faq', label: 'FAQ Section', description: 'Frequently asked questions', supportsSorting: false, supportsLimit: false },
  { key: 'cta', label: 'Custom Trip CTA', description: 'Call-to-action for custom trips', supportsSorting: false, supportsLimit: false },
];

export default function ExperiencesConfigPage() {
  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-btg-dark">Experience Pages Configuration</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure section order and sorting for category landing pages (Tourist Guides, Group Trips, etc.).
        </p>
      </div>

      <VisualPageEditor
        pageSlug="experiences-default"
        pageTitle="Default Experience Page Settings"
        sections={EXPERIENCE_SECTIONS}
      />
    </div>
  );
}
