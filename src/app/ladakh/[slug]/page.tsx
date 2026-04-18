import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLandingPagesByRegion } from '@/lib/landing-pages';
import { fetchLandingPageData, buildLandingMetadata } from '@/lib/landing-page-data';
import LandingPageTemplate from '@/components/landing/LandingPageTemplate';

export const revalidate = 300;

const REGION = 'ladakh';

interface PageProps {
  params: { slug: string };
}

export async function generateStaticParams() {
  return getLandingPagesByRegion(REGION).map((lp) => ({ slug: lp.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return buildLandingMetadata(REGION, params.slug);
}

export default async function LadakhLandingPage({ params }: PageProps) {
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
