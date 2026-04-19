import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchLandingPageData, buildLandingMetadata } from '@/lib/landing-page-data';
import LandingPageTemplate from '@/components/landing/LandingPageTemplate';

export const revalidate = 300;

const REGION = 'uk';

interface PageProps {
  params: { slug: string };
}

export async function generateStaticParams() {
  // Return empty to skip build-time prerendering (avoids DB queries during build)
  // Pages are generated on-demand with ISR (revalidate = 300)
  return [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return buildLandingMetadata(REGION, params.slug);
}

export default async function UttarakhandLandingPage({ params }: PageProps) {
  const data = await fetchLandingPageData(REGION, params.slug);
  if (!data) notFound();

  return (
    <LandingPageTemplate
      landing={data.landing}
      wp={data.wp}
      packages={data.packages}
      reviews={data.reviews}
      stats={data.stats}
    />
  );
}
