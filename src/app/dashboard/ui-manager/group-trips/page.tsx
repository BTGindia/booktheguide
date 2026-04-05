'use client';

import VisualPageEditor from '@/components/admin/VisualPageEditor';

const GROUP_TRIPS_SECTIONS = [
  { key: 'hero', label: 'Hero Banner', description: 'Main hero with trip count stats', supportsSorting: false, supportsLimit: false },
  { key: 'upcoming', label: 'Upcoming Group Trips', description: 'Fixed-departure trips with available seats', supportsSorting: true, maxLimit: 20 },
  { key: 'popular', label: 'Popular Group Trips', description: 'Most booked group trips', supportsSorting: true, maxLimit: 12 },
  { key: 'by_destination', label: 'Trips by Destination', description: 'Group trips organized by destination', supportsSorting: true, maxLimit: 20 },
  { key: 'reviews', label: 'Traveller Reviews', description: 'Featured reviews from past group trips', supportsSorting: true, maxLimit: 10 },
  { key: 'cta', label: 'Custom Trip CTA', description: 'Call-to-action for custom group trips', supportsSorting: false, supportsLimit: false },
];

export default function GroupTripsConfigPage() {
  return (
    <VisualPageEditor
      pageSlug="group-trips"
      pageTitle="Group Trips Configuration"
      sections={GROUP_TRIPS_SECTIONS}
    />
  );
}
