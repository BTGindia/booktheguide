import Link from 'next/link';
import type { Metadata } from 'next';
import { Search, MapPin, Clock, Star, Sparkles, MessageCircle } from 'lucide-react';
import prisma from '@/lib/prisma';
import { CATEGORIES_ORDERED } from '@/lib/categories';

// Revalidate homepage every 60 seconds (ISR)
export const revalidate = 60;
import { getActiveCategories, getActiveStateSlugs, getActiveStates } from '@/lib/active-packages';
import { type PackageCardData } from '@/components/PackageCard';
import { HeroSearch } from '@/components/search/HeroSearch';
import { getPageBySlug, wpSeoToMetadata, getPageContent } from '@/lib/wordpress';
import { WPFaqSection, WPSeoContentBlock, WPInternalLinksGrid } from '@/components/wordpress/WPContentBlocks';
import { getUIConfig, isSectionVisible, getSectionSort, getSectionLimit, getFeaturedIds, applySorting, applyFeaturedPinning } from '@/lib/ui-config';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Book The Guide � India\'s Premier Guide Booking Platform',
    description: 'Book verified local guides for treks, heritage walks, group trips, and adventure experiences across India. 500+ guides, 50+ destinations.',
    keywords: 'book guide India, local guides, trek guide, heritage walk, group trips India, adventure guide, travel India',
    openGraph: {
      title: 'Book The Guide � India\'s Premier Guide Booking Platform',
      description: 'Book verified local guides for treks, heritage walks, group trips, and adventures across India.',
      url: 'https://www.booktheguide.com',
      siteName: 'Book The Guide',
    },
    alternates: { canonical: 'https://www.booktheguide.com' },
  };
}

/* Build a PackageCardData from a product row with its includes */
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

export default async function HomePage() {
  // ---- Fetch WordPress page content (with fallback if unavailable) ----
  const content = await getPageContent('home');

  // ---- Calculate this weekend date range ----
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7; // next Saturday
  const weekendStart = new Date(now);
  weekendStart.setDate(now.getDate() + (dayOfWeek === 6 ? 0 : dayOfWeek === 0 ? -1 : daysUntilSaturday));
  weekendStart.setHours(0, 0, 0, 0);
  const weekendEnd = new Date(weekendStart);
  weekendEnd.setDate(weekendStart.getDate() + 8); // Include next weekend too
  weekendEnd.setHours(23, 59, 59, 999);

  // ---- Fetch ALL dynamic data in parallel ----
  const [
    destinations,
    trendingProducts,
    heritageProducts,
    groupProducts,
    adventureProducts,
    influencerProducts,
    weekendProducts,
    offbeatProducts,
    featuredGuides,
    platformSettings,
    uiConfig,
    activeDbCategories,
    activeStateNames,
    stateCities,
    activeStatesFromDB,
  ] = await Promise.all([
    prisma.destination.findMany({
      where: { isActive: true, products: { some: { status: 'APPROVED', isActive: true } } },
      include: {
        city: { include: { state: { select: { name: true } } } },
        _count: { select: { products: true } },
      },
      orderBy: { products: { _count: 'desc' } },
      take: 8,
    }),
    prisma.product.findMany({
      where: { packageCategory: 'TREKKING', status: 'APPROVED', isActive: true },
      include: productInclude,
      orderBy: [{ guide: { guideScore: 'desc' } }, { createdAt: 'desc' }],
      take: 8,
    }) as any,
    prisma.product.findMany({
      where: { packageCategory: 'HERITAGE_WALKS', status: 'APPROVED', isActive: true },
      include: productInclude,
      orderBy: { createdAt: 'desc' },
      take: 5,
    }) as any,
    prisma.product.findMany({
      where: { packageCategory: 'GROUP_TRIPS', status: 'APPROVED', isActive: true },
      include: productInclude,
      orderBy: { createdAt: 'desc' },
      take: 5,
    }) as any,
    prisma.product.findMany({
      where: { packageCategory: 'ADVENTURE_GUIDES', status: 'APPROVED', isActive: true },
      include: productInclude,
      orderBy: { createdAt: 'desc' },
      take: 5,
    }) as any,
    prisma.product.findMany({
      where: { packageCategory: 'TRAVEL_WITH_INFLUENCERS', status: 'APPROVED', isActive: true },
      include: productInclude,
      orderBy: { createdAt: 'desc' },
      take: 5,
    }) as any,
    // Weekend departures - products with fixed departures this or next weekend
    prisma.product.findMany({
      where: {
        status: 'APPROVED',
        isActive: true,
        fixedDepartures: {
          some: {
            isActive: true,
            approvalStatus: 'APPROVED',
            startDate: { gte: weekendStart, lte: weekendEnd },
          },
        },
      },
      include: {
        ...productInclude,
        fixedDepartures: {
          where: {
            isActive: true,
            approvalStatus: 'APPROVED',
            startDate: { gte: weekendStart, lte: weekendEnd },
          },
          orderBy: { startDate: 'asc' as const },
          take: 1,
          select: { pricePerPerson: true, meetingPoint: true, totalSeats: true, bookedSeats: true, startDate: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }) as any,
    // Offbeat Travel products
    prisma.product.findMany({
      where: { packageCategory: 'OFFBEAT_TRAVEL', status: 'APPROVED', isActive: true },
      include: productInclude,
      orderBy: { createdAt: 'desc' },
      take: 6,
    }) as any,
    // Featured Guides � highest scoring from each category (include unscored too)
    prisma.guideProfile.findMany({
      where: { isActive: true, isVerified: true },
      orderBy: [{ guideScore: 'desc' }, { averageRating: 'desc' }, { totalReviews: 'desc' }],
      take: 30,
      select: {
        id: true,
        slug: true,
        averageRating: true,
        totalReviews: true,
        guideScore: true,
        specializations: true,
        coverImage: true,
        portfolioImages: true,
        guideTypes: true,
        serviceAreas: { include: { state: { select: { name: true } } }, take: 1 },
        user: { select: { name: true, image: true } },
      },
    }),
    prisma.platformSettings.findFirst({ where: { key: 'platform_name' } }),
    getUIConfig('homepage'),
    getActiveCategories().catch(() => []),
    getActiveStateSlugs().catch(() => new Set<string>()),
    // Cities with active packages per state (for Top Destinations tags)
    prisma.city.findMany({
      where: {
        destinations: {
          some: { products: { some: { status: 'APPROVED', isActive: true } } }
        }
      },
      select: { name: true, state: { select: { name: true } } },
      orderBy: { name: 'asc' },
    }),
    getActiveStates().catch(() => []),
  ]);

  // Build state ? active cities map
  const cityByState: Record<string, string[]> = {};
  (stateCities as any[]).forEach((c: any) => {
    const sn = c.state?.name;
    if (sn) {
      if (!cityByState[sn]) cityByState[sn] = [];
      if (!cityByState[sn].includes(c.name)) cityByState[sn].push(c.name);
    }
  });

  // Determine which categories to show (hide empty + disabled categories)
  const activeSlugs = new Set(activeDbCategories.map((c: any) => c.slug || c.packageCategory));
  let displayCategories = CATEGORIES_ORDERED;
  if (activeDbCategories.length > 0) {
    const filtered = CATEGORIES_ORDERED.filter(cat => activeSlugs.has(cat.slug));
    if (filtered.length > 0) displayCategories = filtered;
  }

  // Filter trending products to exclude disabled categories
  const filteredTrending = activeSlugs.size > 0
    ? trendingProducts.filter((p: any) => activeSlugs.has(p.packageCategory))
    : trendingProducts;

  const trendingCards = applyFeaturedPinning(
    applySorting(filteredTrending, getSectionSort(uiConfig, 'trending')),
    getFeaturedIds(uiConfig, 'trending')
  ).slice(0, getSectionLimit(uiConfig, 'trending', 5)).map(toCard);

  // Only build section cards if that category is active
  const isCategoryActive = (slug: string) => activeSlugs.size === 0 || activeSlugs.has(slug);

  const heritageCards = isCategoryActive('HERITAGE_WALKS') ? applyFeaturedPinning(
    applySorting(heritageProducts, getSectionSort(uiConfig, 'heritage')),
    getFeaturedIds(uiConfig, 'heritage')
  ).slice(0, getSectionLimit(uiConfig, 'heritage', 5)).map(toCard) : [];

  const groupCards = isCategoryActive('GROUP_TRIPS') ? applySorting(groupProducts, getSectionSort(uiConfig, 'weekend'))
    .slice(0, getSectionLimit(uiConfig, 'weekend', 5)).map(toCard) : [];

  const adventureCards = isCategoryActive('ADVENTURE_GUIDES') ? applyFeaturedPinning(
    applySorting(adventureProducts, getSectionSort(uiConfig, 'adventure')),
    getFeaturedIds(uiConfig, 'adventure')
  ).slice(0, getSectionLimit(uiConfig, 'adventure', 5)).map(toCard) : [];

  const influencerCards = isCategoryActive('TRAVEL_WITH_INFLUENCERS') ? applyFeaturedPinning(
    applySorting(influencerProducts, getSectionSort(uiConfig, 'influencers')),
    getFeaturedIds(uiConfig, 'influencers')
  ).slice(0, getSectionLimit(uiConfig, 'influencers', 5)).map(toCard) : [];

  const weekendCards = weekendProducts
    .filter((p: any) => activeSlugs.size === 0 || activeSlugs.has(p.packageCategory))
    .map((p: any) => ({
      ...toCard(p),
      departureDate: p.fixedDepartures?.[0]?.startDate || null,
    }));

  const offbeatCards = isCategoryActive('OFFBEAT_TRAVEL') ? offbeatProducts.map(toCard) : [];

  // Build featured guides � pick highest scoring per category type
  const categoryTypeLabels: Record<string, string> = {
    TREK_GUIDE: 'Trekking',
    ADVENTURE_SPORTS_GUIDE: 'Adventure Sports',
    GROUP_TRIP_LEADER: 'Group Trips',
    HERITAGE_GUIDE: 'Heritage Walks',
    OFFBEAT_GUIDE: 'Offbeat Travel',
    INFLUENCER: 'Influencer Trips',
    TOURIST_GUIDE: 'Tourist Guide',
  };
  const seenCategories = new Set<string>();
  const topGuides = (featuredGuides as any[]).reduce((acc: any[], g: any) => {
    const mainType = g.guideTypes?.[0] || 'TOURIST_GUIDE';
    if (!seenCategories.has(mainType)) {
      seenCategories.add(mainType);
      acc.push({
        id: g.id,
        slug: g.slug,
        name: g.user?.name || 'Guide',
        photo: g.user?.image || g.coverImage || g.portfolioImages?.[0] || null,
        rating: g.averageRating,
        reviewCount: g.totalReviews,
        expertise: categoryTypeLabels[mainType] || mainType.replace(/_/g, ' '),
        location: g.serviceAreas?.[0]?.state?.name || 'India',
        score: g.guideScore,
      });
    }
    return acc;
  }, []).slice(0, 8);

  /* Reusable horizontal card scroller */
  const PackageScroller = ({ cards, emptyMsg }: { cards: PackageCardData[]; emptyMsg: string }) =>
    cards.length > 0 ? (
      <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
        {cards.map((pkg) => (
          <Link
            key={pkg.id}
            href={`/trips/${pkg.slug}`}
            className="flex-shrink-0 w-[320px] rounded-[20px] overflow-hidden bg-white shadow-[0_2px_16px_rgba(28,26,23,0.06)] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(28,26,23,0.12)] transition-all duration-300 snap-start group"
          >
            <div className="relative w-full h-[210px] overflow-hidden">
              {pkg.coverImage ? (
                <img src={pkg.coverImage} alt={pkg.title} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-btg-terracotta/10 to-btg-sage/10 flex items-center justify-center"><span className="text-4xl">???</span></div>
              )}
              {pkg.seatsLeft !== undefined && pkg.seatsLeft > 0 && (
                <span className="absolute top-3 left-3 bg-[#58bdae] text-white text-[11px] font-semibold tracking-[0.1em] px-3 py-1.5 rounded-full uppercase">
                  {pkg.seatsLeft} seats left
                </span>
              )}
            </div>
            <div className="p-5">
              <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#58bdae] mb-1.5 font-body">
                {pkg.activityType.replace(/_/g, ' ')}
              </div>
              <h3 className="font-heading text-[20px] font-bold text-[#1A1A18] mb-2 leading-snug line-clamp-2 group-hover:text-[#58bdae] transition-colors">{pkg.title}</h3>
              <div className="flex gap-3.5 mb-4">
                <span className="text-[13px] text-btg-light-text flex items-center gap-1.5 font-body"><MapPin className="w-3.5 h-3.5" /> {pkg.stateName}</span>
                <span className="text-[13px] text-btg-light-text flex items-center gap-1.5 font-body"><Clock className="w-3.5 h-3.5" /> {pkg.durationDays}D{pkg.durationNights > 0 && `/${pkg.durationNights}N`}</span>
                <span className="text-[13px] text-btg-light-text flex items-center gap-1.5 font-body"><Star className="w-3.5 h-3.5 fill-[#E8943A] text-[#E8943A]" /> {pkg.guideRating.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-[20px] font-semibold text-btg-dark font-heading">
                  {pkg.price ? `?${pkg.price.toLocaleString('en-IN')}` : 'On Request'} <small className="text-[12px] text-btg-light-text font-light font-body">/person</small>
                </div>
                <span className="text-[13px] font-semibold text-btg-cta bg-btg-cta/10 px-4 py-2 rounded-full hover:bg-btg-cta-hover hover:text-white transition-colors font-heading">
                  Book Now
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    ) : (
      <p className="text-btg-light-text text-center py-12">{emptyMsg}</p>
    );

  return (
    <div className="bg-btg-cream">
      {/* --------------- HERO --------------- */}
      <section className="relative h-[85vh] min-h-[600px] flex flex-col justify-end pb-[60px]">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="/images/btg/hero-banner.png"
            alt="India travel"
            className="w-full h-full object-cover scale-[1.04] animate-subtle-zoom"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[rgba(28,26,23,0.15)] to-[rgba(28,26,23,0.55)]" />
        </div>
        <div className="relative z-10 px-6 md:px-12">
          <p className="text-[15px] font-bold tracking-[0.12em] text-[#58bdae] mb-4 flex items-center gap-2.5">
            <span className="w-8 h-px bg-[#58bdae] inline-block" />
            India's most trusted Guide Booking website vetted by Experts & Locals
          </p>
          <h1 className="font-heading text-[clamp(32px,5vw,60px)] font-bold leading-[1.1] text-white tracking-tight mb-9">
            Treks, Adventure Sports or<br /><span className="uppercase text-[#58bdae] text-[clamp(22px,3.5vw,42px)]">Offbeat Travel Packages combining all</span>
          </h1>

          {/* Search Bar */}
          <HeroSearch variant="hero" />
        </div>
      </section>

      {/* --------------- TRAVEL SIMPLIFIED � Feature Grid --------------- */}
      {isSectionVisible(uiConfig, 'how_it_works') && (
      <section className="py-8 px-6 md:px-12">
        <div className="text-center mb-6">
          <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#58bdae] mb-1.5">{content.plainText('how_it_works_label', 'How It Works')}</p>
          <h2 className="font-heading text-[clamp(24px,3vw,34px)] font-bold leading-[1.15] text-[#1A1A18]"
              dangerouslySetInnerHTML={{ __html: content.text('how_it_works_title', 'Travel <em class="italic text-[#58bdae]">Simplified</em>') }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {[
            { icon: '??', kw: content.plainText('feature_1_label', 'Search'), title: content.plainText('feature_1_title', 'Find Your Perfect Journey'), desc: content.plainText('feature_1_desc', 'Choose your preferred destination, experience type and when you wish to travel. Hundreds of curated experiences await.') },
            { icon: '??', kw: content.plainText('feature_2_label', 'Compare & Choose'), title: content.plainText('feature_2_title', 'Pick Your Ideal Guide'), desc: content.plainText('feature_2_desc', 'Browse verified guides and trip leaders with detailed profiles, ratings, transparent pricing, and full itineraries.') },
            { icon: '??', kw: content.plainText('feature_3_label', 'Book & Go!'), title: content.plainText('feature_3_title', 'Start Your Adventure'), desc: content.plainText('feature_3_desc', 'Join fixed departures with fellow travellers or book a private guide for your own dates. It\'s that simple.') },
          ].map((step) => (
            <div key={step.kw} className="bg-white rounded-xl px-6 py-5 border border-btg-dark/[0.06] hover:border-[#58bdae] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(88,189,174,0.12)] transition-all duration-300 flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-[#58bdae]/10 flex items-center justify-center flex-shrink-0 text-[24px]">{step.icon}</div>
              <div>
                <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#58bdae] mb-1 font-body">{step.kw}</div>
                <h3 className="font-heading text-base font-bold text-[#1A1A18] mb-1">{step.title}</h3>
                <p className="text-[13px] leading-[1.5] text-[#6B6560] font-light font-body">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      )}

      {/* --------------- SEO DESCRIPTION --------------- */}
      <section className="py-12 px-6 md:px-12">
        <h1 className="font-heading text-[clamp(28px,4vw,42px)] font-bold leading-[1.15] text-[#1A1A18] mb-3">
          Book Verified Local Guides for Treks, Adventure Sports &amp; Offbeat Trips Across India
        </h1>
        <h2 className="font-heading text-[clamp(18px,2.5vw,24px)] font-semibold text-[#58bdae] mb-5">
          Your One-Stop Platform to Discover Certified Trek Leaders, Adventure Specialists &amp; Curated Local Experiences
        </h2>
        <p className="text-[15px] leading-[1.85] text-[#6B6560] font-body">
          Book The Guide is India&apos;s most trusted guide booking platform, purpose-built for travellers who seek authentic, expert-led experiences beyond the ordinary. Whether you&apos;re planning a Himalayan trek through Uttarakhand and Himachal Pradesh, an adrenaline-pumping adventure sports session in Rishikesh or Manali, or an offbeat journey into hidden villages and unexplored valleys of Ladakh and Kashmir � we connect you directly with verified, locally-rooted guides who know every trail, every shortcut, and every hidden gem. Our platform hosts 50+ certified trek leaders, experienced adventure sports instructors, heritage walk storytellers, group trip organisers, and local experience curators � all vetted through rigorous background checks, certification verification, and community ratings. Every guide on Book The Guide has been handpicked by our regional admin teams to ensure quality, safety, and authenticity. From fixed-date group departures that let you travel with like-minded strangers to fully customised private itineraries, from weekend escapes near Delhi and Bangalore to multi-day expeditions in Spiti and Zanskar � we cover it all. Our transparent pricing model means no hidden fees; guides set their own rates and you see exactly what you pay for. Read real reviews from verified travellers, compare guides side-by-side, check live availability, and book securely � all in one place. Whether you&apos;re a solo backpacker, a couple seeking a romantic getaway, a family looking for safe curated holidays, or a corporate team planning an offsite, Book The Guide makes the entire journey seamless � from discovery to booking to the summit.
        </p>
      </section>

      {/* --------------- TRUST SIGNALS --------------- */}
      <section className="py-10 px-6 md:px-12 bg-[#EDE8DF]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: '???', number: '50+', label: 'Certified Trek Leaders', desc: 'Expert-led summit expeditions and high-altitude trails' },
              { icon: '??', number: '50+', label: 'Adventure Sports Guides', desc: 'Rafting, paragliding, skiing & more with certified pros' },
              { icon: '???', number: '20+', label: 'Local-Curated Experiences in Hidden Spots', desc: 'Offbeat destinations handpicked by locals who live there' },
            ].map((badge) => (
              <div key={badge.label} className="bg-white rounded-2xl p-6 text-center border border-btg-dark/[0.06] hover:border-[#58bdae] hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(88,189,174,0.12)] transition-all duration-300">
                <div className="text-4xl mb-3">{badge.icon}</div>
                <div className="font-heading text-[36px] font-bold text-[#58bdae] leading-none mb-1">{badge.number}</div>
                <h3 className="font-heading text-[16px] font-bold text-[#1A1A18] mb-1">{badge.label}</h3>
                <p className="text-[13px] text-[#6B6560] font-body">{badge.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------- EXPERIENCES � Categories --------------- */}
      {isSectionVisible(uiConfig, 'categories') && (
      <section className="py-12 px-6 md:px-12">
        <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#58bdae] mb-2">{content.plainText('categories_label', 'Explore Categories')}</p>
        <div className="mb-8">
          <h2 className="font-heading text-[clamp(26px,3.5vw,40px)] font-bold leading-[1.1] text-[#1A1A18]">{content.plainText('categories_title', 'Experiences led by Verified Experts')}</h2>
          <p className="text-[15px] text-[#6B6560] font-medium mt-1 font-body">{content.plainText('categories_subtitle', 'Select how you wish to see India')}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayCategories.map((cat) => {
            const subtexts: Record<string, string> = {
              'Tourist Guides': content.plainText('cat_tourist_guides_desc', 'Hire a verified local guide for personalised sightseeing tours across India.'),
              'Group Trips': content.plainText('cat_group_trips_desc', 'Join fixed-date group departures with fellow travellers and expert trip leaders.'),
              'Adventure Sports': content.plainText('cat_adventure_guides_desc', 'Trek, raft, climb and explore with certified adventure specialists.'),
              'Heritage Walks': content.plainText('cat_heritage_walks_desc', 'Walk through India\'s rich history with storytellers who bring monuments alive.'),
              'Travel with Influencers': content.plainText('cat_influencers_desc', 'Travel alongside popular creators on curated, content-worthy experiences.'),
              'Offbeat Travel': content.plainText('cat_offbeat_travel_desc', 'Discover hidden gems and unexplored destinations beyond the tourist trail.'),
              'Trekking': content.plainText('cat_trekking_desc', 'Summit iconic peaks and traverse breathtaking trails with experienced trek leaders.'),
            };
            return (
              <Link key={cat.slug} href={cat.href} className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={cat.image} alt={cat.label} className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500" />
                </div>
                <div className="p-4">
                  <h3 className="font-heading text-[18px] font-bold text-[#1A1A18] mb-1.5 group-hover:text-[#58bdae] transition-colors">{cat.label}</h3>
                  <p className="text-[13px] leading-[1.5] text-[#6B6560] line-clamp-2">{subtexts[cat.label] || ''}</p>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="text-center mt-8">
          <Link href="/search" className="inline-block text-sm font-bold text-white bg-btg-cta px-8 py-3 rounded-full hover:bg-btg-cta-hover hover:text-white hover:-translate-y-0.5 transition-all tracking-wide font-heading">
            Explore More ?
          </Link>
        </div>
      </section>
      )}

      {/* --------------- TRENDING TREKS --------------- */}
      {isSectionVisible(uiConfig, 'trending') && (
      <section className="py-12 px-6 md:px-12">
        <div className="mb-8">
          <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#58bdae] mb-2">{content.plainText('trending_label', "Season's Favorite")}</p>
          <h2 className="font-heading text-[clamp(26px,3.5vw,40px)] font-bold leading-[1.1] text-[#1A1A18]"
              dangerouslySetInnerHTML={{ __html: content.text('trending_title', 'Trending <em class="italic text-[#58bdae]">Treks</em> � Season\'s Favorite') }} />
        </div>
        <PackageScroller cards={trendingCards} emptyMsg="Trending treks coming soon!" />
        <div className="text-center mt-8">
          <Link href="/experiences/trekking" className="inline-block text-sm font-bold text-white bg-btg-cta px-8 py-3 rounded-full hover:bg-btg-cta-hover hover:-translate-y-0.5 transition-all tracking-wide">
            Explore All ?
          </Link>
        </div>
      </section>
      )}

      {/* --------------- MEET THE LOCAL GUIDES --------------- */}
      <section className="py-12 px-6 md:px-12 bg-[#EDE8DF]">
        <div className="mb-8">
          <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#58bdae] mb-2 font-body">Local Expertise</p>
          <h2 className="font-heading text-[clamp(26px,3.5vw,40px)] font-bold leading-[1.1] text-[#1A1A18]">
            Meet the Local Guides behind your <em className="italic text-[#58bdae]">perfect vacation</em>
          </h2>
        </div>
        {topGuides.length > 0 ? (
          <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
            {topGuides.map((guide: any) => (
              <Link
                key={guide.id}
                href={`/guides/${guide.slug}`}
                className="flex-shrink-0 w-[240px] bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 snap-start group"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#58bdae]/20 to-[#7A9E7E]/20">
                  {guide.photo ? (
                    <img src={guide.photo} alt={guide.name} className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-5xl font-heading font-bold text-[#58bdae]/40">{guide.name?.[0] || 'G'}</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-heading text-[16px] font-bold text-[#1A1A18] mb-1 group-hover:text-[#58bdae] transition-colors">{guide.name}</h3>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Star className="w-3.5 h-3.5 fill-[#E8943A] text-[#E8943A]" />
                    <span className="text-[13px] font-semibold text-[#1A1A18]">{guide.rating.toFixed(1)}</span>
                    {guide.reviewCount > 0 && <span className="text-[11px] text-[#6B6560]">({guide.reviewCount})</span>}
                  </div>
                  <div className="text-[12px] text-[#58bdae] font-medium mb-1">{guide.expertise}</div>
                  <div className="flex items-center gap-1 text-[12px] text-[#6B6560]">
                    <MapPin className="w-3 h-3 text-[#58bdae]" />{guide.location}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-[#58bdae]/30">
            <span className="text-5xl mb-4 block">?????</span>
            <h3 className="font-heading text-[22px] font-bold text-[#1A1A18] mb-2">Guides Coming Soon</h3>
            <p className="text-[15px] text-[#6B6560]">Our verified local guides are being onboarded. Check back shortly!</p>
          </div>
        )}
      </section>

      {/* --------------- ADVENTURE PICKS (DYNAMIC) --------------- */}
      {isSectionVisible(uiConfig, 'adventure') && adventureCards.length > 0 && (
        <section className="py-12 px-6 md:px-12 bg-btg-sand">
          <div className="mb-8">
            <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#58bdae] mb-2">{content.plainText('adventure_label', 'Push Your Limits')}</p>
            <h2 className="font-heading text-[clamp(26px,3.5vw,40px)] font-bold leading-[1.1] text-[#1A1A18]"
                dangerouslySetInnerHTML={{ __html: content.text('adventure_title', 'Best Adventure Sports <em class="italic text-[#58bdae]">Packages in India</em>') }} />
            <p className="text-[16px] text-btg-mid font-bold mt-1">{content.plainText('adventure_subtitle', 'For that extra adrenaline rush!')}</p>
          </div>
          <PackageScroller cards={adventureCards} emptyMsg="" />
          <div className="text-center mt-8">
            <Link href="/experiences/adventure-guides" className="inline-block text-sm font-bold text-white bg-btg-cta px-8 py-3 rounded-full hover:bg-btg-cta-hover hover:-translate-y-0.5 transition-all tracking-wide">
              Explore More ?
            </Link>
          </div>
        </section>
      )}

      {/* --------------- OFFBEAT TRAVEL --------------- */}
      <section className="py-12 px-6 md:px-12">
        <div className="mb-8">
          <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#58bdae] mb-2">Offbeat Travel</p>
          <h2 className="font-heading text-[clamp(26px,3.5vw,40px)] font-bold leading-[1.1] text-[#1A1A18]">
            Can&apos;t decide what to do? Explore packages <em className="italic text-[#58bdae]">combining all</em> in Offbeat Destinations in India
          </h2>
          <p className="text-[16px] text-btg-mid font-bold mt-1">Group trip packages combining treks, adventure sports and activities � all inclusive.</p>
        </div>
        {offbeatCards.length > 0 ? (
          <PackageScroller cards={offbeatCards} emptyMsg="" />
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-[#58bdae]/30">
            <span className="text-5xl mb-4 block">???</span>
            <h3 className="font-heading text-[22px] font-bold text-[#1A1A18] mb-2">Coming Soon</h3>
            <p className="text-[15px] text-[#6B6560]">Offbeat travel packages combining treks, adventure sports &amp; local experiences are being curated. Stay tuned!</p>
          </div>
        )}
        <div className="text-center mt-8">
          <Link href="/experiences/offbeat-travel" className="inline-block text-sm font-bold text-white bg-btg-cta px-8 py-3 rounded-full hover:bg-btg-cta-hover hover:-translate-y-0.5 transition-all tracking-wide">
            Explore Offbeat Trips ?
          </Link>
        </div>
      </section>

      {/* --------------- WEEKEND TRAVEL PACKAGES --------------- */}
      <section className="py-12 px-6 md:px-12 bg-gradient-to-b from-white to-btg-sand/30">
        <div className="mb-8">
          <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#58bdae] mb-2">This Weekend</p>
          <h2 className="font-heading text-[clamp(26px,3.5vw,40px)] font-bold leading-[1.1] text-[#1A1A18]">
            Weekend Travel <em className="italic text-[#58bdae]">Packages India</em>
          </h2>
          <p className="text-[16px] text-btg-mid font-bold mt-1">Trekking, adventure sports and offbeat travel packages for the upcoming weekend.</p>
        </div>
        {weekendCards.length > 0 ? (
          <PackageScroller cards={weekendCards as PackageCardData[]} emptyMsg="" />
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-[#58bdae]/30">
            <span className="text-5xl mb-4 block">??</span>
            <h3 className="font-heading text-[22px] font-bold text-[#1A1A18] mb-2">No Weekend Trips Yet</h3>
            <p className="text-[15px] text-[#6B6560]">Check back soon for this weekend&apos;s best trekking, adventure &amp; offbeat packages.</p>
          </div>
        )}
        <div className="text-center mt-8">
          <Link href="/upcoming-trips" className="inline-block text-sm font-bold text-white bg-btg-cta px-8 py-3 rounded-full hover:bg-btg-cta-hover hover:-translate-y-0.5 transition-all tracking-wide">
            View All Weekend Trips ?
          </Link>
        </div>
      </section>

      {/* --------------- DESTINATIONS � State Cards --------------- */}
      {isSectionVisible(uiConfig, 'destinations') && (
      <section className="py-12 px-6 md:px-12 bg-[#EDE8DF]">
        <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#58bdae] mb-2 font-body">{content.plainText('destinations_label', 'Top Destinations')}</p>
        <div className="mb-8">
          <h2 className="font-heading text-[clamp(26px,3.5vw,40px)] font-bold leading-[1.1] text-[#1A1A18]">{content.plainText('destinations_title', 'Where to go in India?')}</h2>
          <p className="text-[15px] text-[#6B6560] font-bold mt-1 font-body">{content.plainText('destinations_subtitle', 'Choose where you wish to travel')}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {(activeStatesFromDB as any[]).map((st: any) => (
            <div
              key={st.slug}
              className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300"
            >
              <Link href={`/explore/${st.slug}`} className="block">
                <div className="relative aspect-[4/3] overflow-hidden">
                  {st.heroImage ? (
                    <img src={st.heroImage} alt={st.name} className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#58bdae]/20 to-[#7A9E7E]/20 flex items-center justify-center">
                      <span className="text-4xl">???</span>
                    </div>
                  )}
                </div>
                <div className="px-4 pt-4">
                  <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#58bdae] mb-1">{st.isNorthIndia ? 'North India' : 'India'} � {st.code}</p>
                  <h3 className="font-heading text-[18px] font-bold text-[#1A1A18] mb-1 group-hover:text-[#58bdae] transition-colors">{st.name}</h3>
                  <p className="text-[13px] text-[#6B6560] line-clamp-1 mb-2">{st.tagline}</p>
                </div>
              </Link>
              {(() => {
                const cities = cityByState[st.name]?.length ? cityByState[st.name] : st.popularCities;
                return cities && cities.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 px-4 pb-4">
                    {cities.slice(0, 6).map((city: string) => (
                      <Link
                        key={city}
                        href={`/explore/${(st as any).slug}?city=${encodeURIComponent(city as string)}`}
                        className="text-[11px] font-medium text-[#58bdae] bg-[#58bdae]/10 px-2.5 py-1 rounded-full hover:bg-[#58bdae] hover:text-white transition-colors"
                      >
                        {city}
                      </Link>
                    ))}
                  </div>
                ) : null;
              })()}
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/explore" className="inline-block text-sm font-bold text-white bg-btg-cta px-8 py-3 rounded-full hover:bg-btg-cta-hover hover:-translate-y-0.5 transition-all tracking-wide">
            Explore All States ?
          </Link>
        </div>
      </section>
      )}

      {/* --------------- TRAVEL WITH INFLUENCERS (DYNAMIC) � Star Offering --------------- */}
      {isSectionVisible(uiConfig, 'influencers') && influencerCards.length > 0 && (
        <section className="relative py-16 px-6 md:px-12 overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A18] via-[#2a2a28] to-[#1A1A18]" />
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #58bdae 1px, transparent 1px), radial-gradient(circle at 80% 20%, #FF7F50 1px, transparent 1px)', backgroundSize: '60px 60px, 40px 40px' }} />
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF7F50] via-[#58bdae] to-[#FFD96A]" />
          
          <div className="relative z-10">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FF7F50]/20 to-[#FFD96A]/20 border border-[#FF7F50]/30 rounded-full px-5 py-2 mb-4">
                <span className="text-[13px] font-bold tracking-wide text-[#FFD96A]">{content.plainText('influencer_badge', '? STAR EXPERIENCE')}</span>
              </div>
              <h2 className="font-heading text-[clamp(28px,4vw,46px)] font-bold leading-[1.1] text-white mb-3"
                  dangerouslySetInnerHTML={{ __html: content.text('influencer_title', 'Travel with Your <em class="italic bg-gradient-to-r from-[#FF7F50] to-[#FFD96A] bg-clip-text text-transparent">Favourite Influencer!</em>') }} />
              <p className="text-[16px] text-white/50 font-medium max-w-lg mx-auto">{content.plainText('influencer_subtitle', "Curated group trips led by India's best content creators. Live the reel life, for real.")}</p>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide justify-center">
              {influencerCards.map((pkg: PackageCardData) => (
                <Link
                  key={pkg.id}
                  href={`/trips/${pkg.slug}`}
                  className="flex-shrink-0 w-[280px] rounded-[24px] overflow-hidden relative snap-start cursor-pointer group hover:-translate-y-2 transition-all duration-400 border-2 border-white/10 hover:border-[#FF7F50]/40"
                >
                  <div className="relative aspect-[3/4] overflow-hidden">
                    {pkg.coverImage ? (
                      <img src={pkg.coverImage} alt={pkg.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#FF7F50]/30 to-[#FFD96A]/30 flex items-center justify-center">
                        <span className="text-5xl">?</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                    {pkg.seatsLeft !== undefined && pkg.seatsLeft > 0 && (
                      <div className="absolute top-4 left-4 bg-[#FF7F50] text-white text-[11px] font-bold tracking-[0.1em] px-4 py-1.5 rounded-full uppercase shadow-lg">
                        {pkg.seatsLeft} seats left
                      </div>
                    )}
                    <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-lg">
                      ?
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="inline-flex items-center gap-1.5 bg-[#58bdae]/20 backdrop-blur-sm rounded-full px-3 py-1 mb-2">
                      <span className="text-[11px] font-semibold text-[#58bdae]">by {pkg.guideName}</span>
                    </div>
                    <div className="font-heading text-[20px] text-white font-bold mb-2 line-clamp-2 leading-tight">{pkg.title}</div>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-white/60">{pkg.destinationName} � {pkg.durationDays}D{pkg.durationNights > 0 ? `/${pkg.durationNights}N` : ''}</span>
                      <span className="text-[#FFD96A] font-bold">{pkg.price ? `?${pkg.price.toLocaleString('en-IN')}` : 'On Request'}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link href="/experiences/travel-with-influencers" className="inline-flex items-center gap-2 text-[15px] font-bold text-[#1A1A18] bg-gradient-to-r from-[#FFD96A] to-[#FF7F50] px-10 py-4 rounded-full hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(255,127,80,0.3)] transition-all tracking-wide">
                Explore Creator Trips ?
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* --------------- NEEV � AI Travel Planner --------------- */}
      {isSectionVisible(uiConfig, 'neev_ai') && (
      <section className="mx-6 md:mx-12 my-10 relative">
        <div className="rounded-[24px] overflow-hidden relative bg-gradient-to-r from-[#0f2027] via-[#203a43] to-[#58bdae]">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #FFD96A 1px, transparent 1px), radial-gradient(circle at 70% 30%, #58bdae 1px, transparent 1px)', backgroundSize: '40px 40px, 30px 30px' }} />
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#FF7F50] via-[#FFD96A] to-[#58bdae]" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 px-6 py-8 md:px-10 md:py-8">
            {/* Left: Icon + Content */}
            <div className="flex items-center gap-5 flex-1">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#58bdae] to-[#FFD96A] flex items-center justify-center flex-shrink-0 shadow-lg animate-pulse">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#FFD96A]">Meet NEEV</span>
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                </div>
                <h2 className="font-heading text-[clamp(20px,3vw,28px)] font-bold text-white leading-tight mb-1"
                    dangerouslySetInnerHTML={{ __html: content.text('neev_title', 'Not sure where to go? Let <em class="italic text-[#FFD96A]">NEEV</em> plan it!') }} />
                <p className="text-[14px] text-white/50 max-w-md hidden sm:block">
                  {content.plainText('neev_description', "Your AI travel buddy that knows every trail, hidden spot and the perfect guide for you.")}
                </p>
              </div>
            </div>
            
            {/* Right: CTA */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <Link
                href="/search"
                className="inline-flex items-center gap-2 text-[14px] font-bold text-[#0f2027] bg-gradient-to-r from-[#FFD96A] to-[#FF7F50] px-7 py-3.5 rounded-full hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(255,217,106,0.4)] transition-all"
              >
                <MessageCircle className="w-4 h-4" /> Talk to NEEV
              </Link>
              <span className="text-[12px] text-white/30 hidden sm:block">Free � No sign-up</span>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* --------------- HERITAGE & CULTURE (DYNAMIC) --------------- */}
      {isSectionVisible(uiConfig, 'heritage') && heritageCards.length > 0 && (
        <section className="py-12 px-6 md:px-12">
          <div className="mb-8">
            <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#58bdae] mb-2">{content.plainText('heritage_label', 'Curated for You')}</p>
            <h2 className="font-heading text-[clamp(24px,3.5vw,38px)] font-bold leading-[1.1] text-[#1A1A18]"
                dangerouslySetInnerHTML={{ __html: content.text('heritage_title', 'Most Loved <em class="italic text-[#58bdae]">Heritage Walks</em>') }} />
          </div>
          <PackageScroller cards={heritageCards} emptyMsg="" />
          <div className="text-center mt-8">
            <Link href="/experiences/heritage-walks" className="inline-block text-sm font-bold text-white bg-btg-cta px-8 py-3 rounded-full hover:bg-btg-cta-hover hover:-translate-y-0.5 transition-all tracking-wide">
              Explore More ?
            </Link>
          </div>
        </section>
      )}

      {/* --------------- GROUP TRIPS (DYNAMIC) --------------- */}
      {groupCards.length > 0 && (
        <section className="py-12 px-6 md:px-12 bg-btg-sand">
          <div className="mb-8">
            <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#58bdae] mb-2">{content.plainText('group_trips_label', 'Travel with New Friends')}</p>
            <h2 className="font-heading text-[clamp(26px,3.5vw,40px)] font-bold leading-[1.1] text-[#1A1A18]"
                dangerouslySetInnerHTML={{ __html: content.text('group_trips_title', 'Trending <em class="italic text-[#58bdae]">Group Trips</em>') }} />
            <p className="text-[16px] text-btg-mid font-bold mt-1">{content.plainText('group_trips_subtitle', 'Because You Only Live Once!')}</p>
          </div>
          <PackageScroller cards={groupCards} emptyMsg="" />
          <div className="text-center mt-8">
            <Link href="/experiences/group-trips" className="inline-block text-sm font-bold text-white bg-btg-cta px-8 py-3 rounded-full hover:bg-btg-cta-hover hover:-translate-y-0.5 transition-all tracking-wide">
              Explore More ?
            </Link>
          </div>
        </section>
      )}

      {/* --------------- REVIEWS & GALLERY --------------- */}
      <section className="py-14 px-6 md:px-12 bg-btg-cream">
        <div className="text-center mb-10">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#58bdae] mb-2">{content.plainText('reviews_label', 'What Travellers Say')}</p>
          <h2 className="font-heading text-[clamp(28px,3.5vw,42px)] font-bold leading-[1.1] text-[#1A1A18]"
              dangerouslySetInnerHTML={{ __html: content.text('reviews_title', 'Real Stories, Real <em class="italic text-[#58bdae]">Experiences</em>') }} />
          <p className="text-[15px] text-[#6B6560] mt-2 max-w-md mx-auto">{content.plainText('reviews_subtitle', 'Hear from fellow travellers who explored India with our verified guides')}</p>
        </div>

        {/* Reviews */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {(content.reviews && content.reviews.length > 0 ? content.reviews.map((review: any) => ({
            name: review.name,
            location: review.location,
            rating: review.rating,
            text: review.text,
            trip: review.trip,
            avatar: review.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
            avatarImage: review.avatar?.sourceUrl || null,
          })) : [
            { name: 'Priya Sharma', location: 'Delhi', rating: 5, text: 'An incredible trek to Hampta Pass with a guide who knew every trail and story. The whole experience was seamless from booking to the summit!', avatar: 'PS', trip: 'Hampta Pass Trek', avatarImage: null },
            { name: 'Rohit Agarwal', location: 'Mumbai', rating: 5, text: 'Booked a heritage walk in Jaipur � our guide\'s knowledge of Rajasthani history was outstanding. Highly recommend for culture lovers.', avatar: 'RA', trip: 'Jaipur Heritage Walk', avatarImage: null },
            { name: 'Ananya Reddy', location: 'Bangalore', rating: 4, text: 'The group trip to Ladakh was life-changing. Met amazing people and our guide made sure every detail was perfect. Will book again!', avatar: 'AR', trip: 'Ladakh Group Trip', avatarImage: null },
          ]).map((review: any) => (
            <div key={review.name} className="bg-white rounded-2xl p-6 border border-btg-dark/[0.06] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                {review.avatarImage ? (
                  <img src={review.avatarImage} alt={review.name} className="w-12 h-12 rounded-full object-cover shadow-sm" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#58bdae] to-[#4aa99b] flex items-center justify-center text-white text-sm font-bold shadow-sm">{review.avatar}</div>
                )}
                <div>
                  <div className="font-heading text-[15px] font-bold text-btg-dark">{review.name}</div>
                  <div className="text-[13px] text-btg-light-text">{review.location} � {review.trip}</div>
                </div>
              </div>
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={`text-[15px] ${i < review.rating ? 'text-[#E8943A]' : 'text-gray-300'}`}>?</span>
                ))}
              </div>
              <p className="text-[14px] text-[#6B6560] leading-relaxed">&ldquo;{review.text}&rdquo;</p>
            </div>
          ))}
        </div>

        {/* Image Gallery Grid � 2 rows with travel images */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-14">
          {[
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80',
            'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=400&q=80',
            'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&q=80',
            'https://images.unsplash.com/photo-1548013146-72479768bada?w=400&q=80',
            'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80',
            'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&q=80',
            'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&q=80',
            'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=400&q=80',
          ].map((src, idx) => (
            <div key={idx} className="rounded-xl overflow-hidden aspect-square group cursor-pointer">
              <img src={src} alt={`Travel Gallery ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
          ))}
        </div>

        {/* Join us on Social Media */}
        <div>
          <div className="text-center mb-8">
            <h3 className="font-heading text-[clamp(22px,3vw,32px)] font-bold text-[#1A1A18]">
              Join us on <span className="bg-gradient-to-r from-[#E1306C] via-[#F77737] to-[#FCAF45] bg-clip-text text-transparent">Instagram</span> & <span className="text-[#FF0000]">YouTube</span>
            </h3>
            <p className="text-[14px] text-[#6B6560] mt-1">Follow our journey and get inspired for your next adventure</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Instagram Embed Section */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E1306C] via-[#F77737] to-[#FCAF45] flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </div>
                <div>
                  <div className="font-heading text-[15px] font-bold text-[#1A1A18]">@booktheguide</div>
                  <div className="text-[12px] text-[#6B6560]">Follow us on Instagram</div>
                </div>
                <a href="https://instagram.com/booktheguide" target="_blank" rel="noopener noreferrer" className="ml-auto text-[12px] font-bold text-white bg-gradient-to-r from-[#E1306C] to-[#F77737] px-4 py-2 rounded-full hover:opacity-90 transition-opacity">
                  Follow
                </a>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&q=80',
                  'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=300&q=80',
                  'https://images.unsplash.com/photo-1548013146-72479768bada?w=300&q=80',
                  'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=300&q=80',
                  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=300&q=80',
                  'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=300&q=80',
                ].map((src, idx) => (
                  <div key={idx} className="aspect-square rounded-lg overflow-hidden group cursor-pointer">
                    <img src={src} alt={`Instagram post ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  </div>
                ))}
              </div>
            </div>

            {/* YouTube Embed Section */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-[#FF0000] flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </div>
                <div>
                  <div className="font-heading text-[15px] font-bold text-[#1A1A18]">Book The Guide</div>
                  <div className="text-[12px] text-[#6B6560]">Subscribe on YouTube</div>
                </div>
                <a href="https://youtube.com/@booktheguide" target="_blank" rel="noopener noreferrer" className="ml-auto text-[12px] font-bold text-white bg-[#FF0000] px-4 py-2 rounded-full hover:bg-[#cc0000] transition-colors">
                  Subscribe
                </a>
              </div>
              <div className="space-y-3">
                {[
                  { title: 'Top 5 Hidden Treks in Himachal Pradesh', views: '12K views', duration: '8:42', thumb: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80' },
                  { title: 'Heritage Walk Through Old Delhi', views: '8.5K views', duration: '12:15', thumb: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&q=80' },
                  { title: 'Ladakh Road Trip with Local Guide', views: '21K views', duration: '15:30', thumb: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80' },
                ].map((video, idx) => (
                  <div key={idx} className="flex gap-3 group cursor-pointer hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors">
                    <div className="relative w-[140px] h-[80px] rounded-lg overflow-hidden flex-shrink-0">
                      <img src={video.thumb} alt={video.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                          <span className="text-[#FF0000] text-sm ml-0.5">?</span>
                        </div>
                      </div>
                      <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded">{video.duration}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[14px] font-semibold text-[#1A1A18] line-clamp-2 group-hover:text-[#58bdae] transition-colors">{video.title}</h4>
                      <p className="text-[12px] text-[#6B6560] mt-1">{video.views}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --------------- WHY BOOK THE GUIDE --------------- */}
      <section className="py-14 px-6 md:px-12 bg-btg-sand">
        <div className="text-center mb-10">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#58bdae] mb-2">{content.plainText('why_btg_label', 'Our Promise')}</p>
          <h2 className="font-heading text-[clamp(28px,3.5vw,42px)] font-bold leading-[1.1] text-[#1A1A18]"
              dangerouslySetInnerHTML={{ __html: content.text('why_btg_title', 'Why Book <em class="italic text-[#58bdae]">The Guide?</em>') }} />
          <p className="text-[15px] text-btg-light-text font-light max-w-[600px] leading-[1.7] mt-3 mx-auto">
            {content.plainText('why_btg_description', 'We connect you with verified, experienced local guides who know every trail, every shortcut, and every hidden gem. No middlemen, no surprises � just authentic local expertise.')}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 max-w-6xl mx-auto">
          {[
            { icon: '???', title: content.plainText('why_1_title', 'Verified Local Guides'), desc: content.plainText('why_1_desc', 'Every guide is verified by our regional admins with background checks and certification validation.') },
            { icon: '??', title: content.plainText('why_2_title', 'Transparent Pricing'), desc: content.plainText('why_2_desc', 'Guides set their own prices. No hidden fees. See exactly what you pay for, always.') },
            { icon: '?', title: content.plainText('why_3_title', 'Real Reviews'), desc: content.plainText('why_3_desc', 'Only verified customers who completed trips can leave reviews. 100% authentic feedback.') },
            { icon: '???', title: content.plainText('why_4_title', 'Flexible Booking'), desc: content.plainText('why_4_desc', 'Join group departures or hire a personal guide. Fixed dates or custom trips � your choice.') },
            { icon: '??', title: content.plainText('why_5_title', 'Secure Booking'), desc: content.plainText('why_5_desc', 'Your personal details stay private. We never share contact info between guests and guides before booking.') },
          ].map((card) => (
            <div key={card.title} className="bg-white rounded-[20px] p-7 border border-btg-dark/[0.06] hover:border-[#58bdae] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(88,189,174,0.1)] transition-all duration-300 text-center">
              <div className="w-14 h-14 rounded-[16px] bg-[#58bdae]/10 flex items-center justify-center mb-4 text-[26px] mx-auto">{card.icon}</div>
              <h3 className="font-heading text-[17px] font-bold text-[#1A1A18] mb-2">{card.title}</h3>
              <p className="text-[13px] leading-[1.7] text-btg-light-text font-light">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --------------- GUIDE CTA � Centre Aligned --------------- */}
      <div className="mx-6 md:mx-12 my-12 rounded-[32px] bg-btg-dark p-8 md:py-14 md:px-[60px] text-center relative overflow-hidden">
        <div className="absolute right-[60px] top-1/2 -translate-y-1/2 font-heading text-[200px] font-bold text-white/[0.03] tracking-tight pointer-events-none select-none">
          BTG
        </div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#58bdae] mb-2">{content.plainText('guide_cta_label', 'Join Our Community')}</p>
          <h2 className="font-heading text-[clamp(26px,3.5vw,40px)] font-bold leading-[1.1] text-btg-cream"
              dangerouslySetInnerHTML={{ __html: content.text('guide_cta_title', 'Are you a Guide or <em class="italic text-[#58bdae]">Experience Leader?</em>') }} />
          <p className="text-[15px] font-light text-btg-cream/55 leading-[1.7] mt-3 max-w-[480px] mx-auto">
            {content.plainText('guide_cta_description', "Join India's fastest-growing guide booking platform. Create your profile, set your prices, get verified and start getting bookings from travellers across the world.")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link href="/register?role=guide" className="text-sm font-bold text-white bg-btg-cta px-8 py-3.5 rounded-full hover:bg-btg-cta-hover hover:-translate-y-0.5 transition-all text-center whitespace-nowrap tracking-wide">
              Register as a Guide
            </Link>
            <Link href="/about#for-guides" className="text-sm font-bold text-btg-cream/70 bg-white/[0.07] border border-white/15 px-8 py-3.5 rounded-full hover:border-[#58bdae] hover:text-[#58bdae] transition-all text-center whitespace-nowrap tracking-wide">
              Learn More →
            </Link>
          </div>
        </div>
      </div>

      {/* ═══════════════ WORDPRESS FAQ / SEO CONTENT ═══════════════ */}
      <WPFaqSection faqs={content.faqItems} />
      <WPSeoContentBlock content={content.seoContentBlock} />
      <WPInternalLinksGrid links={content.internalLinks} />
    </div>
  );
}


