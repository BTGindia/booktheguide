import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { PackageCard, type PackageCardData } from '@/components/PackageCard';
import Link from 'next/link';
import { getPageBySlug, wpSeoToMetadata, getPageContent } from '@/lib/wordpress';

export const revalidate = 120;
import { WPSeoContentBlock, WPFaqSection, WPInternalLinksGrid } from '@/components/wordpress/WPContentBlocks';

export async function generateMetadata(): Promise<Metadata> {
  const wpPage = await getPageBySlug('trending');
  if (wpPage?.seo) {
    return wpSeoToMetadata(wpPage.seo, {
      title: 'Trending Packages - Book The Guide',
      description: 'Explore the most popular and trending tour packages handpicked by our team.',
      url: 'https://www.booktheguide.com/trending',
    });
  }
  return {
    title: 'Trending Packages - Book The Guide',
    description: 'Explore the most popular and trending tour packages handpicked by our team.',
    alternates: { canonical: 'https://www.booktheguide.com/trending' },
  };
}

export default async function TrendingPage() {
  const wp = await getPageContent('trending');
  const trendingProducts = await prisma.product.findMany({
    where: { isTrending: true, status: 'APPROVED', isActive: true },
    include: {
      destination: { include: { city: { include: { state: { select: { name: true } } } } } },
      guide: { include: { user: { select: { name: true } } } },
      fixedDepartures: {
        where: { isActive: true, approvalStatus: 'APPROVED', startDate: { gte: new Date() } },
        orderBy: { pricePerPerson: 'asc' },
        take: 1,
        select: { pricePerPerson: true, meetingPoint: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  }) as any[];

  const packageCards: PackageCardData[] = trendingProducts.map((p: any) => ({
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
    meetingPoint: p.fixedDepartures[0]?.meetingPoint || undefined,
    price: p.fixedDepartures[0]?.pricePerPerson ?? null,
  }));

  return (
    <>
      {/* ---- Hero ---- */}
      <section className="bg-btg-dark py-16 lg:py-24">
        <div className="w-full px-6 md:px-12">
          <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-btg-blush mb-3">{wp.plainText('hero_label', "What's Hot")}</p>
          <h1 className="font-heading text-[clamp(36px,5vw,58px)] font-normal leading-[1.1] text-btg-cream mb-4"
              dangerouslySetInnerHTML={{ __html: wp.text('hero_title', 'Trending <em class="italic text-btg-blush">Packages</em>') }} />
          <p className="text-[15px] text-btg-cream/50 font-light max-w-2xl">
            {wp.plainText('hero_description', 'Handpicked adventures that travellers love. These are the most popular tour packages right now.')}
          </p>
          <p className="text-btg-cream/30 text-xs mt-4">
            {packageCards.length} trending package{packageCards.length !== 1 ? 's' : ''}
          </p>
        </div>
      </section>

      {/* ---- Grid ---- */}
      <section className="py-16 lg:py-24 bg-btg-cream">
        <div className="w-full px-6 md:px-12">
          {packageCards.length === 0 ? (
            <div className="text-center py-20">
              <span className="text-5xl block mb-4">&#x1F525;</span>
              <h3 className="font-heading text-xl font-medium text-btg-dark mb-2">No Trending Packages Yet</h3>
              <p className="text-btg-light-text mb-6 text-sm">
                Our team is curating the best packages for you. Check back soon!
              </p>
              <Link
                href="/search"
                className="inline-block text-sm font-medium text-white bg-btg-terracotta px-8 py-3.5 rounded-full hover:bg-btg-rust transition-colors"
              >
                Browse All Packages &rarr;
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {packageCards.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} />
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
