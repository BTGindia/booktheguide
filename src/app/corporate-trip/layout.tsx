import type { Metadata } from 'next';
import { getPageBySlug, wpSeoToMetadata } from '@/lib/wordpress';

export async function generateMetadata(): Promise<Metadata> {
  const wpPage = await getPageBySlug('corporate-trip');
  if (wpPage?.seo) {
    return wpSeoToMetadata(wpPage.seo, {
      title: 'Corporate & School Group Trips — Custom Packages | Book The Guide',
      description: 'Plan custom corporate retreats, team outings, and school trips across India. Get a tailored itinerary with verified local guides.',
      url: 'https://www.booktheguide.com/corporate-trip',
    });
  }
  return {
    title: 'Corporate & School Group Trips — Custom Packages | Book The Guide',
    description: 'Plan custom corporate retreats, team outings, and school trips across India. Get a tailored itinerary with verified local guides.',
    keywords: 'corporate trips India, school trips, team outing, corporate retreat, custom group tour India',
    openGraph: {
      title: 'Corporate & School Trips | Book The Guide',
      description: 'Custom group trips for corporates and schools with verified local guides.',
    },
    alternates: { canonical: 'https://www.booktheguide.com/corporate-trip' },
  };
}

export default function CorporateTripLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
