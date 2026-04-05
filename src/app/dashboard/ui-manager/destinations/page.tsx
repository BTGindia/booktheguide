'use client';

import VisualPageEditor from '@/components/admin/VisualPageEditor';

const DESTINATIONS_SECTIONS = [
  { key: 'hero', label: 'Hero Banner', description: 'Main hero with destination count', supportsSorting: false, supportsLimit: false },
  { key: 'featured', label: 'Featured Destinations', description: 'Hand-picked top destinations', supportsSorting: true, maxLimit: 12 },
  { key: 'by_state', label: 'Destinations by State', description: 'Destinations organized by state', supportsSorting: true, maxLimit: 30 },
  { key: 'trending', label: 'Trending Destinations', description: 'Most searched and booked destinations', supportsSorting: true, maxLimit: 12 },
  { key: 'weekend', label: 'Weekend Destinations', description: 'Quick weekend getaway spots', supportsSorting: true, maxLimit: 8 },
  { key: 'cta', label: 'Explore CTA', description: 'Call-to-action to browse all destinations', supportsSorting: false, supportsLimit: false },
];

export default function DestinationsConfigPage() {
  return (
    <VisualPageEditor
      pageSlug="destinations"
      pageTitle="Destinations Configuration"
      sections={DESTINATIONS_SECTIONS}
    />
  );
}
