import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Star, ChevronRight, ArrowRight, Calendar, Users, Filter, SlidersHorizontal, Shield, HelpCircle, CheckCircle2, ThumbsUp } from 'lucide-react';
import prisma from '@/lib/prisma';
import { getStateBySlug, getAllStateSlugs } from '@/lib/states';
import { CATEGORY_MAP, CATEGORIES_ORDERED, type PackageCategorySlug } from '@/lib/categories';
import { getDisabledCategorySlugs } from '@/lib/active-packages';
import { PackageCard, type PackageCardData } from '@/components/PackageCard';
import { getStateCategory, getStateCategoryContent } from '@/lib/wordpress';
import { wpSeoToMetadata } from '@/lib/wordpress';
import { WPFaqSection, WPSeoContentBlock, WPInternalLinksGrid } from '@/components/wordpress/WPContentBlocks';

interface PageProps {
  params: { state: string; category: string };
}

/** Reverse lookup: URL slug → category key */
const URL_SLUG_TO_CATEGORY: Record<string, PackageCategorySlug> = {};
for (const cat of CATEGORIES_ORDERED) {
  URL_SLUG_TO_CATEGORY[cat.urlSlug] = cat.slug;
}

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
    packageCategory: p.packageCategory || 'TOURIST_GUIDES',
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

// ISR: render on-demand, cache for 60s, regenerate in background
export const revalidate = 60;

export async function generateStaticParams() {
  // Return empty to skip build-time prerendering (avoids DB connection exhaustion)
  // Pages will be rendered on first request via ISR
  return [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const state = getStateBySlug(params.state);
  const catKey = URL_SLUG_TO_CATEGORY[params.category];
  const cat = catKey ? CATEGORY_MAP[catKey] : undefined;

  if (!state || !cat) return { title: 'Page Not Found | Book The Guide' };

  // Try WordPress state-category combo first
  const wpStateCategory = await getStateCategory(`${params.state}-${params.category}`);
  if (wpStateCategory?.seo) {
    return wpSeoToMetadata(wpStateCategory.seo, {
      title: `Best ${cat.label} in ${state.name} 2026 — Book Verified Guides | Book The Guide`,
      description: `Find the best ${cat.label.toLowerCase()} in ${state.name}. ${cat.description}.`,
      url: `https://www.booktheguide.com/explore/${state.slug}/${cat.urlSlug}`,
    });
  }

  const title = `Best ${cat.label} in ${state.name} 2026 — Book Verified Guides | Book The Guide`;
  const description = `Find the best ${cat.label.toLowerCase()} in ${state.name}. ${cat.description}. Book verified local guides on Book The Guide. ✓ Verified ✓ Reviewed ✓ Instant Booking`;

  return {
    title,
    description,
    keywords: `${cat.label} ${state.name}, ${state.name} ${cat.label.toLowerCase()}, ${cat.activityTypes.join(', ')}, book guide ${state.name}, best ${cat.label.toLowerCase()} ${state.name} 2026`,
    openGraph: {
      title: `${cat.label} in ${state.name} | Book The Guide`,
      description,
      url: `https://www.booktheguide.com/explore/${state.slug}/${cat.urlSlug}`,
      images: (cat.image || state.heroImage) ? [{ url: cat.image || state.heroImage, width: 1200, height: 630, alt: `${cat.label} in ${state.name}` }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${cat.label} in ${state.name} | Book The Guide`,
      description: `Find the best ${cat.label.toLowerCase()} in ${state.name}. Book verified guides instantly.`,
    },
    alternates: {
      canonical: `https://www.booktheguide.com/explore/${state.slug}/${cat.urlSlug}`,
    },
  };
}

export default async function StateCategoryPage({ params }: PageProps) {
  const state = getStateBySlug(params.state);
  const catKey = URL_SLUG_TO_CATEGORY[params.category];
  const cat = catKey ? CATEGORY_MAP[catKey] : undefined;

  if (!state || !cat) notFound();

  // Check if this category is disabled
  const disabledSlugs = await getDisabledCategorySlugs();
  if (disabledSlugs.has(catKey)) notFound();

  /* Fetch products for this state + category */
  const [products, relatedGuides, destinations, wpStateCategory, wp] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: 'APPROVED',
        isActive: true,
        packageCategory: catKey,
        destination: { city: { state: { name: state.name } } },
        // Only show packages that have at least 1 upcoming approved departure
        fixedDepartures: {
          some: { isActive: true, approvalStatus: 'APPROVED', startDate: { gte: new Date() } },
        },
      },
      include: productInclude,
      orderBy: [{ isTrending: 'desc' }, { createdAt: 'desc' }],
      take: 24,
    }),
    prisma.guideProfile.findMany({
      where: {
        isVerified: true,
        user: { isActive: true },
        specializations: { hasSome: cat.activityTypes },
        serviceAreas: { some: { state: { name: state.name } } },
      },
      include: { user: { select: { name: true, image: true } } },
      orderBy: { averageRating: 'desc' },
      take: 6,
    }),
    prisma.destination.findMany({
      where: {
        isActive: true,
        city: { state: { name: state.name } },
        products: { some: { status: 'APPROVED', isActive: true, packageCategory: catKey } },
      },
      include: { _count: { select: { products: true } } },
      orderBy: { products: { _count: 'desc' } },
      take: 10,
    }),
    getStateCategory(`${params.state}-${params.category}`),
    getStateCategoryContent(`${params.state}-${params.category}`),
  ]);

  const cards = products.map(toCard);

  /* Activity type filter tabs (from this category's activity types) */
  const activityCounts: Record<string, number> = {};
  for (const p of products) {
    activityCounts[p.activityType] = (activityCounts[p.activityType] || 0) + 1;
  }
  const activityFilters = Object.entries(activityCounts).sort((a, b) => b[1] - a[1]);

  /* Other categories for cross-links (exclude disabled) */
  const otherCategories = CATEGORIES_ORDERED.filter((c) => c.slug !== catKey && !disabledSlugs.has(c.slug));

  return (
    <main className="bg-btg-cream min-h-screen">
      {/* ───── Hero ───── */}
      <section className="relative h-[50vh] min-h-[380px] flex items-end overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${cat.image || state.heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-16 pb-10">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-btg-primary mb-2 font-heading">
            {wp.plainText('hero_badge', `${state.name} · ${cat.label}`)}
          </p>
          <h1 className="font-heading text-3xl md:text-5xl font-bold text-white mb-2 leading-tight">
            {wp.plainText('hero_title', `${cat.label} in ${state.name}`)}
          </h1>
          <p className="text-base text-white/70 font-body max-w-2xl">
            {wp.plainText('hero_description', `${cat.description} — curated from ${state.name}'s best local guides.`)}
          </p>
        </div>
      </section>

      {/* ───── Breadcrumb ───── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-16 py-4">
        <nav className="flex items-center gap-2 text-sm text-btg-light-text font-body flex-wrap">
          <Link href="/" className="hover:text-btg-primary transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/explore" className="hover:text-btg-primary transition-colors">Explore</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href={`/explore/${state.slug}`} className="hover:text-btg-primary transition-colors">{state.name}</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-btg-dark font-medium">{cat.label}</span>
        </nav>
      </div>

      {/* ───── Filter Destinations ───── */}
      {destinations.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 lg:px-16 pt-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-btg-primary" />
            <h3 className="font-heading text-sm font-semibold text-btg-dark uppercase tracking-wider">{wp.plainText('filter_dest_label', 'Filter by City / Destination')}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {destinations.map((dest: any) => (
              <Link
                key={dest.id}
                href={`/search?state=${state.slug}&category=${catKey}&destination=${dest.id}`}
                className="text-xs bg-white text-btg-dark px-3.5 py-2 rounded-full border border-btg-sand hover:border-btg-primary hover:text-btg-primary transition-colors font-body"
              >
                {dest.name} <span className="text-btg-light-text">({dest._count.products})</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ───── Activity Type Filters ───── */}
      {activityFilters.length > 1 && (
        <section className="max-w-7xl mx-auto px-6 lg:px-16 pt-6">
          <div className="flex items-center gap-2 mb-3">
            <SlidersHorizontal className="w-4 h-4 text-btg-primary" />
            <h3 className="font-heading text-sm font-semibold text-btg-dark uppercase tracking-wider">{wp.plainText('filter_activity_label', 'Activity Type')}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {activityFilters.map(([activity, count]) => (
              <Link
                key={activity}
                href={`/search?state=${state.slug}&category=${catKey}&activity=${encodeURIComponent(activity)}`}
                className="text-xs bg-btg-primary/10 text-btg-primary px-3.5 py-2 rounded-full hover:bg-btg-primary hover:text-white transition-colors font-body font-medium"
              >
                {activity} ({count})
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ───── Products ───── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-16 py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-heading text-2xl font-bold text-btg-dark">
              {cards.length} {cat.label} {cards.length === 1 ? 'Experience' : 'Experiences'}
            </h2>
            <p className="text-sm text-btg-light-text font-body">
              in {state.name}
            </p>
          </div>
        </div>

        {cards.length > 0 ? (
          <div className="space-y-5">
            {cards.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-btg-sand">
            <div className="text-5xl mb-4">🏔️</div>
            <h3 className="font-heading text-xl font-semibold text-btg-dark mb-2">
              No {cat.label} Available Yet
            </h3>
            <p className="text-btg-light-text font-body mb-6 max-w-md mx-auto">
              We&apos;re expanding in {state.name}. Check back soon or explore other states.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/explore/${state.slug}`}
                className="text-sm font-semibold text-btg-primary hover:underline font-heading"
              >
                Back to {state.name}
              </Link>
              <Link
                href={`/experiences/${cat.urlSlug}`}
                className="text-sm font-semibold text-btg-primary hover:underline font-heading"
              >
                View {cat.label} in All States
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ───── Related Guides ───── */}
      {relatedGuides.length > 0 && (
        <section className="bg-white py-14">
          <div className="max-w-7xl mx-auto px-6 lg:px-16">
            <h2 className="font-heading text-2xl font-bold text-btg-dark mb-2">
              {wp.plainText('guides_title', `Guides for ${cat.label} in ${state.name}`)}
            </h2>
            <p className="text-sm text-btg-light-text font-body mb-6">
              {wp.plainText('guides_subtitle', `Verified guides specialising in ${cat.activityTypes.slice(0, 3).join(', ')}.`)}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {relatedGuides.map((guide: any) => (
                <Link
                  key={guide.id}
                  href={`/guides/${guide.slug || guide.id}`}
                  className="group bg-btg-cream rounded-xl p-5 border border-btg-sand hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 rounded-full bg-btg-primary/15 flex items-center justify-center text-btg-primary font-heading font-bold text-base">
                      {(guide.user.name || 'G').charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-heading text-sm font-semibold text-btg-dark group-hover:text-btg-primary transition-colors">
                        {guide.user.name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-btg-light-text font-body">
                        <Star className="w-3 h-3 text-btg-gold fill-btg-gold" />
                        <span>{guide.averageRating.toFixed(1)}</span>
                        <span>· {guide.totalReviews} reviews</span>
                      </div>
                    </div>
                  </div>
                  {guide.specializations?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {guide.specializations.slice(0, 3).map((s: string) => (
                        <span key={s} className="text-[10px] bg-btg-primary/10 text-btg-primary px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───── Other Categories ───── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-16 py-12">
        <h2 className="font-heading text-2xl font-bold text-btg-dark mb-6">
          {wp.plainText('other_title', `Other Experiences in ${state.name}`)}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {otherCategories.map((other) => (
            <Link
              key={other.slug}
              href={`/explore/${state.slug}/${other.urlSlug}`}
              className="bg-white rounded-xl p-4 text-center border border-btg-sand hover:border-btg-primary hover:shadow-md transition-all group"
            >
              <h3 className="font-heading text-sm font-semibold text-btg-dark group-hover:text-btg-primary transition-colors mb-1">
                {other.label}
              </h3>
              <p className="text-[11px] text-btg-light-text font-body">{other.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ───── CTA ───── */}
      <section className="bg-gradient-to-r from-btg-primary to-btg-sage py-14">
        <div className="max-w-3xl mx-auto text-center px-6">
          <h2 className="font-heading text-3xl font-bold text-white mb-4">
            {wp.plainText('cta_title', `Book Your ${cat.label} Experience`)}
          </h2>
          <p className="text-white/80 font-body mb-8 max-w-xl mx-auto">
            {wp.plainText('cta_description', `Connect with verified local guides in ${state.name} and create memories that last a lifetime.`)}
          </p>
          <Link
            href={`/search?state=${state.slug}&category=${catKey}`}
            className="bg-white text-btg-dark font-semibold px-8 py-3.5 rounded-full hover:bg-btg-cream transition-colors font-heading text-sm"
          >
            Search {cat.label} in {state.name}
          </Link>
        </div>
      </section>

      {/* ───── FAQ ───── */}
      <section className="bg-white py-14">
        <div className="max-w-4xl mx-auto px-6 lg:px-16">
          <h2 className="font-heading text-2xl font-bold text-btg-dark mb-8 text-center">
            {wp.plainText('faq_title', `FAQ — ${cat.label} in ${state.name}`)}
          </h2>
          <div className="space-y-4">
            {[
              { q: `What ${cat.label.toLowerCase()} are available in ${state.name}?`, a: `${state.name} offers ${cards.length} ${cat.label.toLowerCase()} experiences including ${cat.activityTypes.slice(0, 3).join(', ')}. Browse and book with verified local guides.` },
              { q: `What is the best time for ${cat.label.toLowerCase()} in ${state.name}?`, a: `The best time to visit ${state.name} for ${cat.label.toLowerCase()} is ${state.bestTimeToVisit}. Weather conditions are ideal for outdoor activities during this period.` },
              { q: `How much do ${cat.label.toLowerCase()} cost in ${state.name}?`, a: `Prices vary by trip duration, guide, and activity. Browse our listings to compare prices from verified guides. Many offer custom quotes for personalised trips.` },
              { q: `Are ${cat.label.toLowerCase()} guides in ${state.name} verified?`, a: `Yes! Every guide on Book The Guide undergoes thorough verification including ID checks and experience validation. Look for the ✓ Verified badge on profiles.` },
            ].map((faq, idx) => (
              <div key={idx} className="bg-btg-cream rounded-2xl p-6 border border-btg-sand">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-btg-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-heading text-base font-semibold text-btg-dark mb-2">{faq.q}</h3>
                    <p className="text-sm text-btg-light-text font-body leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── WordPress SEO Content ───── */}
      {wpStateCategory?.stateCategoryFields && (
        <>
          <WPSeoContentBlock content={wpStateCategory.stateCategoryFields.seoContentBlock} />
          <WPFaqSection faqs={wpStateCategory.stateCategoryFields.faqItems} />
          <WPInternalLinksGrid links={wpStateCategory.stateCategoryFields.internalLinks} />
        </>
      )}

      {/* ───── JSON-LD: CollectionPage + FAQPage + BreadcrumbList ───── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `${cat.label} in ${state.name}`,
            description: `${cat.description} in ${state.name}`,
            url: `https://www.booktheguide.com/explore/${state.slug}/${cat.urlSlug}`,
            numberOfItems: cards.length,
            isPartOf: {
              '@type': 'WebPage',
              name: `Explore ${state.name}`,
              url: `https://www.booktheguide.com/explore/${state.slug}`,
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              { '@type': 'Question', name: `What ${cat.label.toLowerCase()} are available in ${state.name}?`, acceptedAnswer: { '@type': 'Answer', text: `${state.name} offers ${cat.label.toLowerCase()} experiences with verified local guides.` } },
              { '@type': 'Question', name: `What is the best time for ${cat.label.toLowerCase()} in ${state.name}?`, acceptedAnswer: { '@type': 'Answer', text: `The best time is ${state.bestTimeToVisit}.` } },
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.booktheguide.com' },
              { '@type': 'ListItem', position: 2, name: 'Explore', item: 'https://www.booktheguide.com/explore' },
              { '@type': 'ListItem', position: 3, name: state.name, item: `https://www.booktheguide.com/explore/${state.slug}` },
              { '@type': 'ListItem', position: 4, name: cat.label, item: `https://www.booktheguide.com/explore/${state.slug}/${cat.urlSlug}` },
            ],
          }),
        }}
      />
    </main>
  );
}
