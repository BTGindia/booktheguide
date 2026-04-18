// ─────────────────────────────────────────────────────────────
//  Landing Page — Shared Server Logic
// ─────────────────────────────────────────────────────────────
//
//  Reusable data-fetching and metadata generation for all
//  SEO landing pages. Each region folder imports from here.
//
// ─────────────────────────────────────────────────────────────

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getLandingPage, type LandingPageData } from '@/lib/landing-pages';
import { getPageContent, getPageBySlug, wpSeoToMetadata } from '@/lib/wordpress';
import type { PackageCardData } from '@/components/PackageCard';

const productInclude = {
  destination: { include: { city: { include: { state: { select: { name: true } } } } } },
  guide: { include: { user: { select: { name: true, image: true } } } },
  fixedDepartures: {
    where: { isActive: true, approvalStatus: 'APPROVED', startDate: { gte: new Date() } },
    orderBy: { pricePerPerson: 'asc' as const },
    take: 1,
    select: { pricePerPerson: true, meetingPoint: true, totalSeats: true, bookedSeats: true },
  },
} as any;

function toCard(p: any): PackageCardData {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    coverImage: p.coverImage,
    durationDays: p.durationDays,
    durationNights: p.durationNights,
    activityType: p.activityType,
    packageCategory: p.packageCategory || 'TREKKING',
    destinationName: p.destination.name,
    stateName: p.destination.city.state.name,
    guideName: p.guide.user.name || 'Guide',
    guideRating: p.guide.averageRating,
    guideReviewCount: p.guide.totalReviews ?? 0,
    guideCertification: p.guide.certifications?.[0] || undefined,
    meetingPoint: p.fixedDepartures?.[0]?.meetingPoint || undefined,
    price: p.fixedDepartures?.[0]?.pricePerPerson ?? null,
    seatsLeft: p.fixedDepartures?.[0]
      ? p.fixedDepartures[0].totalSeats - (p.fixedDepartures[0].bookedSeats || 0)
      : undefined,
  };
}

/**
 * Fetch all data needed for a landing page.
 * Returns null if the landing page is not found.
 */
export async function fetchLandingPageData(region: string, slug: string) {
  const landing = getLandingPage(region, slug);
  if (!landing) return null;

  // WordPress slug: "{region}-{slug}" e.g. "himachal-pradesh-triund-trek"
  const wpSlug = `${region}-${slug}`;
  const wp = await getPageContent(wpSlug);

  // Fetch packages, reviews, and stats in parallel
  const [products, reviews, guideStats] = await Promise.all([
    // Products in this state matching the landing page destination/category
    prisma.product.findMany({
      where: {
        status: 'APPROVED',
        isActive: true,
        destination: {
          city: { state: { name: landing.stateName } },
        },
        // Try to match by destination name or title keywords
        OR: [
          { destination: { name: { contains: landing.destination, mode: 'insensitive' as any } } },
          { title: { contains: landing.destination, mode: 'insensitive' as any } },
          { title: { contains: slug.replace(/-/g, ' '), mode: 'insensitive' as any } },
        ],
      },
      include: productInclude,
      orderBy: [{ isTrending: 'desc' }, { createdAt: 'desc' }],
      take: 9,
    }),

    // Reviews from guides in this state
    prisma.review.findMany({
      where: {
        guide: {
          isVerified: true,
          serviceAreas: { some: { state: { name: landing.stateName } } },
        },
      },
      select: {
        id: true,
        overallRating: true,
        comment: true,
        createdAt: true,
        customer: { select: { name: true, image: true } },
        booking: { select: { product: { select: { title: true } } } },
      },
      orderBy: { overallRating: 'desc' },
      take: 6,
    }),

    // Aggregate guide stats
    prisma.guideProfile.aggregate({
      where: {
        isVerified: true,
        user: { isActive: true },
        serviceAreas: { some: { state: { name: landing.stateName } } },
      },
      _avg: { averageRating: true },
      _sum: { totalTrips: true, totalReviews: true },
      _count: true,
    }),
  ]);

  // If no destination-specific products found, fall back to all state products
  let finalProducts = products;
  if (products.length === 0) {
    finalProducts = await prisma.product.findMany({
      where: {
        status: 'APPROVED',
        isActive: true,
        destination: { city: { state: { name: landing.stateName } } },
        packageCategory: 'TREKKING',
      },
      include: productInclude,
      orderBy: [{ isTrending: 'desc' }, { createdAt: 'desc' }],
      take: 6,
    });
  }

  const packageCards = finalProducts.map(toCard);

  const reviewCards = reviews.map((r: any) => ({
    id: r.id,
    rating: r.overallRating,
    comment: r.comment || '',
    userName: r.customer?.name || 'Traveller',
    userImage: r.customer?.image || null,
    createdAt: r.createdAt,
    tripTitle: r.booking?.product?.title,
  }));

  const stats = {
    avgRating: guideStats._avg.averageRating ?? 4.5,
    totalReviews: guideStats._sum.totalReviews ?? 0,
    completedTrips: guideStats._sum.totalTrips ?? 0,
    totalGuides: guideStats._count ?? 0,
  };

  return { landing, wp, packages: packageCards, reviews: reviewCards, stats };
}

/**
 * Generate SEO metadata for a landing page.
 */
export async function buildLandingMetadata(region: string, slug: string): Promise<Metadata> {
  const landing = getLandingPage(region, slug);
  if (!landing) return { title: 'Not Found | Book The Guide' };

  const url = `https://www.booktheguide.com/${region}/${slug}`;
  const title = landing.metaTitle;
  const description = landing.defaultDescription;

  // Try WordPress SEO first
  const wpSlug = `${region}-${slug}`;
  const wpPage = await getPageBySlug(wpSlug);
  if (wpPage?.seo) {
    return wpSeoToMetadata(wpPage.seo, { title, description, url });
  }

  return {
    title,
    description,
    keywords: landing.secondaryKeywords.join(', '),
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      images: [{ url: '/images/btg/optimized/frame-7.webp', width: 1200, height: 630, alt: landing.defaultH1 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: { canonical: url },
  };
}
