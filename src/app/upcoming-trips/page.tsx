import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { PackageCard, type PackageCardData } from '@/components/PackageCard';
import Link from 'next/link';
import { getPageBySlug, wpSeoToMetadata, getPageContent } from '@/lib/wordpress';

export const revalidate = 120;
import { WPSeoContentBlock, WPFaqSection, WPInternalLinksGrid } from '@/components/wordpress/WPContentBlocks';

export async function generateMetadata(): Promise<Metadata> {
  const wpPage = await getPageBySlug('upcoming-trips');
  if (wpPage?.seo) {
    return wpSeoToMetadata(wpPage.seo, {
      title: 'Upcoming Trips - Fixed Departures | Book The Guide',
      description: 'Browse upcoming approved fixed departure trips across India. Join group treks, tours, and adventures with verified guides.',
      url: 'https://www.booktheguide.com/upcoming-trips',
    });
  }
  return {
    title: 'Upcoming Trips - Fixed Departures | Book The Guide',
    description: 'Browse upcoming approved fixed departure trips across India. Join group treks, tours, and adventures with verified guides.',
    alternates: { canonical: 'https://www.booktheguide.com/upcoming-trips' },
  };
}

export default async function UpcomingTripsPage() {
  const wp = await getPageContent('upcoming-trips');
  const departures = await prisma.fixedDeparture.findMany({
    where: {
      isActive: true,
      approvalStatus: 'APPROVED',
      startDate: { gte: new Date() },
    },
    include: {
      product: {
        include: {
          guide: { include: { user: { select: { name: true } } } },
          destination: { include: { city: { include: { state: { select: { name: true } } } } } },
        },
      },
    },
    orderBy: { startDate: 'asc' },
    take: 50,
  }) as any[];

  const packageCards: PackageCardData[] = departures.map((dep: any) => {
    const p = dep.product;
    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      coverImage: p.coverImage,
      durationDays: p.durationDays,
      durationNights: p.durationNights,
      activityType: p.activityType,
      packageCategory: p.packageCategory || 'TOURIST_GUIDES',
      destinationName: p.destination.name,
      stateName: p.destination.city.state.name,
      guideName: p.guide.user.name || 'Guide',
      guideRating: p.guide.averageRating,
      guideReviewCount: p.guide.totalReviews ?? 0,
      guideCertification: p.guide.certifications?.[0] || undefined,
      meetingPoint: dep.meetingPoint || undefined,
      price: dep.pricePerPerson,
    };
  });

  return (
    <>
      {/* ---- Hero ---- */}
      <section className="bg-btg-dark py-16 lg:py-24">
        <div className="w-full px-6 md:px-12">
          <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-btg-blush mb-3">{wp.plainText('hero_label', 'Fixed Departures')}</p>
          <h1 className="font-heading text-[clamp(36px,5vw,58px)] font-normal leading-[1.1] text-btg-cream mb-4"
              dangerouslySetInnerHTML={{ __html: wp.text('hero_title', 'Upcoming <em class="italic text-btg-blush">Trips</em>') }} />
          <p className="text-[15px] text-btg-cream/50 font-light max-w-2xl">
            {wp.plainText('hero_description', 'Join upcoming fixed departures with other travellers. All trips are approved, verified, and ready to book!')}
          </p>
          <p className="text-btg-cream/30 text-xs mt-4">
            {packageCards.length} upcoming trip{packageCards.length !== 1 ? 's' : ''}
          </p>
        </div>
      </section>

      {/* ---- Grid ---- */}
      <section className="py-16 lg:py-24 bg-btg-cream">
        <div className="w-full px-6 md:px-12">
          {packageCards.length === 0 ? (
            <div className="text-center py-20">
              <span className="text-5xl block mb-4">&#x1F4C5;</span>
              <h3 className="font-heading text-xl font-medium text-btg-dark mb-2">No upcoming trips</h3>
              <p className="text-btg-light-text max-w-md mx-auto mb-6 text-sm">
                No fixed departures are scheduled right now. Check back soon or search for
                guides to plan a personal trip.
              </p>
              <Link
                href="/search"
                className="inline-block text-sm font-medium text-white bg-btg-terracotta px-8 py-3.5 rounded-full hover:bg-btg-rust transition-colors"
              >
                Find Guides &rarr;
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {packageCards.map((pkg, i) => (
                <PackageCard key={`${pkg.id}-${i}`} pkg={pkg} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* WordPress-managed content */}
      <WPSeoContentBlock content={wp.seoContentBlock} />
      <WPFaqSection faqs={wp.faqItems} />
      <WPInternalLinksGrid links={wp.internalLinks} heading="Explore More" />
    </>
  );
}
