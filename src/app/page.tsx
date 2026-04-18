import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { Search, MapPin, Clock, Star, Sparkles, MessageCircle, Mountain, ArrowLeftRight, Users, Wallet, BookOpen } from 'lucide-react';
import prisma from '@/lib/prisma';
import { CATEGORIES_ORDERED } from '@/lib/categories';

// Revalidate homepage every 5 minutes (ISR) — reduces server load
export const revalidate = 300;
import { getActiveCategories, getActiveStateSlugs, getActiveStates } from '@/lib/active-packages';
import { type PackageCardData } from '@/components/PackageCard';
import { HeroSearch } from '@/components/search/HeroSearch';
import { getPageBySlug, wpSeoToMetadata, getPageContent, getPosts } from '@/lib/wordpress';
import { WPFaqSection, WPSeoContentBlock, WPInternalLinksGrid } from '@/components/wordpress/WPContentBlocks';
import { getUIConfig, isSectionVisible, getSectionSort, getSectionLimit, getFeaturedIds, applySorting, applyFeaturedPinning } from '@/lib/ui-config';
import TalkToPabloButton from '@/components/ai/TalkToPabloButton';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Book The Guide - India\'s Premier Guide Booking Platform',
    description: 'Book verified local guides for treks, heritage walks, group trips, and adventure experiences across India. 500+ guides, 50+ destinations.',
    keywords: 'book guide India, local guides, trek guide, heritage walk, group trips India, adventure guide, travel India',
    openGraph: {
      title: 'Book The Guide - India\'s Premier Guide Booking Platform',
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
  guide: { include: { user: { select: { name: true } } } },
  fixedDepartures: {
    where: { isActive: true, approvalStatus: 'APPROVED', startDate: { gte: new Date() } },
    orderBy: { pricePerPerson: 'asc' as const },
    take: 1,
    select: { pricePerPerson: true, meetingPoint: true, totalSeats: true, bookedSeats: true },
  },
} as any;

const productSelect = {
  id: true,
  title: true,
  slug: true,
  coverImage: true,
  durationDays: true,
  durationNights: true,
  activityType: true,
  packageCategory: true,
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
    stateProductCounts,
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
    // Featured Guides — highest scoring from each category (include unscored too)
    prisma.guideProfile.findMany({
      where: { isActive: true, isVerified: true },
      orderBy: [{ guideScore: 'desc' }, { averageRating: 'desc' }, { totalReviews: 'desc' }],
      take: 12,
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
    // Product counts per state for Himalayan Destinations
    prisma.indianState.findMany({
      where: { isActive: true },
      select: {
        name: true,
        _count: {
          select: {
            cities: {
              where: {
                destinations: {
                  some: { products: { some: { status: 'APPROVED', isActive: true } } }
                }
              }
            }
          }
        }
      }
    }).catch(() => []),
  ]);

  // Fetch latest blog posts (optional — graceful fallback if WP not configured)
  const blogResult = await getPosts({ first: 3 }).catch(() => null);
  const latestPosts = blogResult?.posts ?? [];

  // Build state → active cities map
  const cityByState: Record<string, string[]> = {};
  (stateCities as any[]).forEach((c: any) => {
    const sn = c.state?.name;
    if (sn) {
      if (!cityByState[sn]) cityByState[sn] = [];
      if (!cityByState[sn].includes(c.name)) cityByState[sn].push(c.name);
    }
  });

  // Build state product count map for Himalayan Destinations
  const stateExpCount: Record<string, number> = {};
  (stateProductCounts as any[]).forEach((s: any) => {
    stateExpCount[s.name] = s._count?.cities || 0;
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

  // Build featured guides — pick highest scoring per category type
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
      <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-1 px-1">
        {cards.map((pkg) => (
          <Link
            key={pkg.id}
            href={`/trips/${pkg.slug}`}
            className="flex-shrink-0 w-[280px] sm:w-[320px] rounded-[20px] overflow-hidden bg-white shadow-[0_2px_16px_rgba(28,26,23,0.06)] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(28,26,23,0.12)] transition-all duration-300 snap-start group card-tap"
          >
            <div className="relative w-full h-[180px] sm:h-[210px] overflow-hidden">
              {pkg.coverImage ? (
                <Image src={pkg.coverImage} alt={pkg.title} fill sizes="320px" className="object-cover group-hover:scale-[1.04] transition-transform duration-500" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-btg-terracotta/10 to-btg-sage/10 flex items-center justify-center"><span className="text-4xl">???</span></div>
              )}
              {pkg.seatsLeft !== undefined && pkg.seatsLeft > 0 && (
                <span className="absolute top-3 left-3 bg-[#58bdae] text-white text-[11px] font-semibold tracking-[0.1em] px-3 py-1.5 rounded-full uppercase">
                  {pkg.seatsLeft} seats left
                </span>
              )}
            </div>
            <div className="p-4 sm:p-5">
              <div className="text-[10px] sm:text-[11px] font-semibold tracking-[0.14em] uppercase text-[#58bdae] mb-1 sm:mb-1.5 font-body">
                {pkg.activityType.replace(/_/g, ' ')}
              </div>
              <h3 className="font-heading text-[17px] sm:text-[20px] font-bold text-[#1A1A18] mb-2 leading-snug line-clamp-2 group-hover:text-[#58bdae] transition-colors">{pkg.title}</h3>
              <div className="flex gap-2 sm:gap-3.5 mb-3 sm:mb-4 flex-wrap">
                <span className="text-[12px] sm:text-[13px] text-btg-light-text flex items-center gap-1 sm:gap-1.5 font-body"><MapPin className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> {pkg.stateName}</span>
                <span className="text-[12px] sm:text-[13px] text-btg-light-text flex items-center gap-1 sm:gap-1.5 font-body"><Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> {pkg.durationDays}D{pkg.durationNights > 0 && `/${pkg.durationNights}N`}</span>
                <span className="text-[12px] sm:text-[13px] text-btg-light-text flex items-center gap-1 sm:gap-1.5 font-body"><Star className="w-3 sm:w-3.5 h-3 sm:h-3.5 fill-[#E8943A] text-[#E8943A]" /> {pkg.guideRating.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-[17px] sm:text-[20px] font-semibold text-btg-dark font-heading">
                  {pkg.price ? `\u20B9${pkg.price.toLocaleString('en-IN')}` : 'On Request'} <small className="text-[11px] sm:text-[12px] text-btg-light-text font-light font-body">/person</small>
                </div>
                <span className="text-[12px] sm:text-[13px] font-semibold text-btg-cta bg-btg-cta/10 px-3 sm:px-4 py-2 rounded-full hover:bg-btg-cta-hover hover:text-white transition-colors font-heading">
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
    <div className="bg-white">
      {/* --------------- HERO --------------- */}
      <section className="relative h-[70vh] sm:h-[80vh] md:h-[85vh] min-h-[480px] sm:min-h-[600px] flex flex-col justify-center items-start">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src="/images/btg/optimized/hero-banner.webp"
            alt="Scenic mountain landscape with trekking trails in India — Book The Guide"
            fill
            priority
            sizes="100vw"
            className="object-cover scale-[1.04] animate-subtle-zoom"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[rgba(28,26,23,0.15)] to-[rgba(28,26,23,0.55)]" />
        </div>
        <div className="relative z-10 px-4 sm:px-6 md:px-12 w-full">
          <p className="text-[13px] sm:text-[15px] font-bold tracking-[0.12em] text-white mb-3 sm:mb-4 flex items-center gap-2.5">
            <span className="w-6 sm:w-8 h-px bg-white inline-block" />
            Adventure &nbsp;|&nbsp; Treks &nbsp;|&nbsp; Offbeat Experiences
          </p>
          <h1 className="font-heading text-[clamp(22px,5vw,42px)] font-bold leading-[1.2] text-white tracking-tight mb-5 sm:mb-9 max-w-lg sm:max-w-none">
            Great adventures need great guides.
          </h1>

          {/* Search Bar */}
          <HeroSearch variant="hero" categories={displayCategories.map(c => ({ slug: c.slug, label: c.label }))} />
        </div>
      </section>

      {/* --------------- TRUST BADGES --------------- */}
      <section className="py-10 sm:py-14 px-4 sm:px-6 md:px-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
            {[
              {
                Icon: Mountain,
                gradient: 'from-[#58bdae] to-[#3d9b8e]',
                glow: 'rgba(88,189,174,0.15)',
                title: 'Local Expertise',
                desc: 'Certified local guides with years of experience navigating the trails they were born to.',
              },
              {
                Icon: ArrowLeftRight,
                gradient: 'from-[#E8943A] to-[#c97e2a]',
                glow: 'rgba(232,148,58,0.15)',
                title: 'No Middleman',
                desc: 'Direct booking — local guides earn the full reward of showing you their home region.',
              },
              {
                Icon: Users,
                gradient: 'from-[#7A9E7E] to-[#5c8060]',
                glow: 'rgba(122,158,126,0.15)',
                title: 'For Everyone',
                desc: 'Tick off popular bucket list adventures or discover offbeat trails. Packages for all.',
              },
              {
                Icon: Wallet,
                gradient: 'from-[#8B6DB5] to-[#7058a0]',
                glow: 'rgba(139,109,181,0.15)',
                title: 'Flexible Pricing',
                desc: 'Diverse prices and flexible refund & cancellation policies. Choose what fits your budget.',
              },
            ].map((badge) => (
              <div key={badge.title} className="relative group text-center px-6 py-8 rounded-3xl overflow-hidden hover:-translate-y-1 transition-all duration-300 cursor-default">
                {/* Soft gradient blob background */}
                <div
                  className="absolute inset-0 opacity-70 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `radial-gradient(ellipse 80% 80% at 50% 60%, ${badge.glow} 0%, transparent 70%)` }}
                />
              <div className="relative">
                  {/* Icon */}
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${badge.gradient} flex items-center justify-center mx-auto mb-3 sm:mb-5 shadow-[0_8px_24px_rgba(0,0,0,0.15)] group-hover:scale-110 group-hover:shadow-[0_12px_32px_rgba(0,0,0,0.2)] transition-all duration-300`}>
                    <badge.Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="font-heading text-[14px] sm:text-[17px] font-bold text-[#1A1A18] mb-1 sm:mb-2">{badge.title}</h3>
                  <p className="text-[11px] sm:text-[13px] leading-[1.6] text-[#6B6560] font-body">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------- EXPLORE DESTINATIONS --------------- */}
      <section className="py-10 sm:py-12 px-4 sm:px-6 md:px-12 bg-gradient-to-br from-[#58bdae]/5 via-white to-[#E8943A]/5">
        <div className="mb-8">
          <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#58bdae] mb-2">Destinations</p>
          <h2 className="font-heading text-[clamp(20px,2.5vw,28px)] font-bold leading-[1.3] text-[#1A1A18]">
            Explore <em className="italic text-[#58bdae]">Popular</em> Destinations
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5">
          {(activeStatesFromDB as any[]).slice(0, 8).map((st: any) => (
            <Link
              key={st.slug}
              href={`/explore/${st.slug}`}
              className="group bg-gradient-to-br from-white to-[#58bdae]/5 rounded-2xl overflow-hidden border border-[#58bdae]/10 hover:shadow-[0_8px_30px_rgba(88,189,174,0.12)] hover:-translate-y-1 transition-all duration-300"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                {st.heroImage ? (
                  <Image src={st.heroImage} alt={`${st.name} — travel destination in India`} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover group-hover:scale-[1.06] transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#58bdae]/20 to-[#E8943A]/10 flex items-center justify-center">
                    <span className="text-4xl">🏔️</span>
                  </div>
                )}
              </div>
              <div className="p-3 sm:p-4 text-center">
                <h3 className="font-heading text-[15px] sm:text-[18px] font-bold text-[#1A1A18] mb-0.5 sm:mb-1 group-hover:text-[#58bdae] transition-colors">{st.name}</h3>
                <p className="text-[11px] sm:text-[13px] text-[#6B6560]">{stateExpCount[st.name] || 0} listed experiences</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/destinations" className="inline-block text-sm font-bold text-white bg-btg-cta px-8 py-3 rounded-full hover:bg-btg-cta-hover hover:-translate-y-0.5 transition-all tracking-wide font-heading">
            View All Destinations \u2192
          </Link>
        </div>
      </section>

      {/* --------------- SEO DESCRIPTION --------------- */}
      <section className="py-10 sm:py-12 px-4 sm:px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
        <h1 className="font-heading text-[clamp(22px,2.8vw,28px)] font-bold leading-[1.4] text-[#1A1A18] mb-3">
          Book Verified Local Guides for Treks, Adventure Sports &amp; Offbeat Trips Across India
        </h1>
        <h2 className="font-heading text-[clamp(16px,2vw,20px)] font-semibold text-[#58bdae] mb-5">
          Your One-Stop Platform to Discover Certified Trek Leaders, Adventure Specialists &amp; Curated Local Experiences
        </h2>
        <p className="text-[15px] leading-[1.85] text-[#6B6560] font-body">
          Book The Guide is India&apos;s most trusted guide booking platform, purpose-built for travellers who seek authentic, expert-led experiences beyond the ordinary. Whether you&apos;re planning a Himalayan trek through Uttarakhand and Himachal Pradesh, an adrenaline-pumping adventure sports session in Rishikesh or Manali, or an offbeat journey into hidden villages and unexplored valleys of Ladakh and Kashmir — we connect you directly with verified, locally-rooted guides who know every trail, every shortcut, and every hidden gem. Our platform hosts 50+ certified trek leaders, experienced adventure sports instructors, heritage walk storytellers, group trip organisers, and local experience curators — all vetted through rigorous background checks, certification verification, and community ratings. Every guide on Book The Guide has been handpicked by our regional admin teams to ensure quality, safety, and authenticity. From fixed-date group departures that let you travel with like-minded strangers to fully customised private itineraries, from weekend escapes near Delhi and Bangalore to multi-day expeditions in Spiti and Zanskar — we cover it all. Our transparent pricing model means no hidden fees; guides set their own rates and you see exactly what you pay for. Read real reviews from verified travellers, compare guides side-by-side, check live availability, and book securely — all in one place. Whether you&apos;re a solo backpacker, a couple seeking a romantic getaway, a family looking for safe curated holidays, or a corporate team planning an offsite, Book The Guide makes the entire journey seamless — from discovery to booking to the summit.
        </p>
        </div>
      </section>

      {/* --------------- TRUST SIGNALS --------------- */}
      <section className="py-10 sm:py-14 px-4 sm:px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { Icon: Mountain, gradient: 'from-[#58bdae] to-[#3d9b8e]', glow: 'rgba(88,189,174,0.18)', number: '50+', label: 'Certified Trek Leaders', desc: 'Expert-led summit expeditions and high-altitude trails' },
              { Icon: Users, gradient: 'from-[#E8943A] to-[#c97e2a]', glow: 'rgba(232,148,58,0.18)', number: '50+', label: 'Adventure Sports Guides', desc: 'Rafting, paragliding, skiing & more with certified pros' },
              { Icon: Sparkles, gradient: 'from-[#8B6DB5] to-[#7058a0]', glow: 'rgba(139,109,181,0.18)', number: '20+', label: 'Local-Curated Experiences', desc: 'Offbeat destinations handpicked by locals who live there' },
            ].map((badge) => (
              <div key={badge.label} className="relative group text-center px-6 py-10 rounded-3xl overflow-hidden hover:-translate-y-1 transition-all duration-300">
                {/* Radial gradient glow */}
                <div
                  className="absolute inset-0 opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `radial-gradient(ellipse 90% 90% at 50% 70%, ${badge.glow} 0%, transparent 70%)` }}
                />
                <div className="relative">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${badge.gradient} flex items-center justify-center mx-auto mb-4 shadow-[0_6px_20px_rgba(0,0,0,0.12)] group-hover:scale-110 transition-transform duration-300`}>
                    <badge.Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="font-heading text-[36px] font-bold text-[#1A1A18] leading-none mb-1">{badge.number}</div>
                  <h3 className="font-heading text-[15px] font-bold text-[#1A1A18] mb-1.5">{badge.label}</h3>
                  <p className="text-[13px] text-[#6B6560] font-body leading-relaxed">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------- EXPERIENCES — Categories (3 only) --------------- */}
      {isSectionVisible(uiConfig, 'categories') && (
      <section className="py-10 sm:py-12 px-4 sm:px-6 md:px-12">
        <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#58bdae] mb-2">{content.plainText('categories_label', 'Explore Categories')}</p>
        <div className="mb-8">
          <h2 className="font-heading text-[clamp(20px,2.5vw,28px)] font-bold leading-[1.3] text-[#1A1A18]">{content.plainText('categories_title', 'Experiences led by Verified Experts')}</h2>
          <p className="text-[15px] text-[#6B6560] font-medium mt-1 font-body">{content.plainText('categories_subtitle', 'Select how you wish to see India')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {displayCategories.filter(cat => ['TREKKING', 'ADVENTURE_GUIDES', 'OFFBEAT_TRAVEL'].includes(cat.slug)).map((cat) => {
            const subtexts: Record<string, string> = {
              'Adventure Sports': content.plainText('cat_adventure_guides_desc', 'Trek, raft, climb and explore with certified adventure specialists.'),
              'Offbeat Travel': content.plainText('cat_offbeat_travel_desc', 'Discover hidden gems and unexplored destinations beyond the tourist trail.'),
              'Trekking': content.plainText('cat_trekking_desc', 'Summit iconic peaks and traverse breathtaking trails with experienced trek leaders.'),
            };
            return (
              <Link key={cat.slug} href={cat.href} className="group bg-gradient-to-br from-white to-[#58bdae]/5 rounded-2xl overflow-hidden border border-[#58bdae]/10 hover:shadow-[0_8px_30px_rgba(88,189,174,0.12)] hover:-translate-y-1 transition-all duration-300">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image src={cat.image} alt={`${cat.label} — guided experiences in India`} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover group-hover:scale-[1.06] transition-transform duration-500" />
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
            Explore More →
          </Link>
        </div>
      </section>
      )}

      {/* --------------- TRENDING TREKS --------------- */}
      {isSectionVisible(uiConfig, 'trending') && (
      <section className="py-10 sm:py-12 px-4 sm:px-6 md:px-12">
        <div className="mb-8">
          <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#58bdae] mb-2">Popular Treks</p>
          <h2 className="font-heading text-[clamp(20px,2.5vw,28px)] font-bold leading-[1.3] text-[#1A1A18]">
            Explore Popular <em className="italic text-[#58bdae]">Treks</em> with certified local guides
          </h2>
        </div>
        <PackageScroller cards={trendingCards} emptyMsg="Trending treks coming soon!" />
        <div className="text-center mt-8">
          <Link href="/experiences/trekking" className="inline-block text-sm font-bold text-white bg-btg-cta px-8 py-3 rounded-full hover:bg-btg-cta-hover hover:-translate-y-0.5 transition-all tracking-wide">
            Explore All →
          </Link>
        </div>
      </section>
      )}

      {/* --------------- MEET THE LOCAL GUIDES --------------- */}
      <section className="py-10 sm:py-12 px-4 sm:px-6 md:px-12 bg-gradient-to-br from-[#58bdae]/5 via-white to-[#E8943A]/5">
        <div className="mb-6 sm:mb-8">
          <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#58bdae] mb-2 font-body">Local Expertise</p>
          <h2 className="font-heading text-[clamp(20px,2.5vw,28px)] font-bold leading-[1.3] text-[#1A1A18]">
            Meet the people of mountains, <em className="italic text-[#58bdae]">waiting to show you around</em>
          </h2>
        </div>
        {topGuides.length > 0 ? (
          <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-1 px-1">
            {topGuides.map((guide: any) => (
              <Link
                key={guide.id}
                href={`/guides/${guide.slug}`}
                className="flex-shrink-0 w-[200px] sm:w-[240px] bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 snap-start group card-tap"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#58bdae]/20 to-[#7A9E7E]/20">
                  {guide.photo ? (
                    <Image src={guide.photo} alt={`${guide.name} — local travel guide in India`} fill sizes="240px" className="object-cover group-hover:scale-[1.06] transition-transform duration-500" />
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
            <span className="text-5xl mb-4 block">{String.fromCodePoint(0x1F3D4, 0xFE0F)}</span>
            <h3 className="font-heading text-[22px] font-bold text-[#1A1A18] mb-2">Guides Coming Soon</h3>
            <p className="text-[15px] text-[#6B6560]">Our verified local guides are being onboarded. Check back shortly!</p>
          </div>
        )}
      </section>

      {/* --------------- ADVENTURE PICKS (DYNAMIC) --------------- */}
      {isSectionVisible(uiConfig, 'adventure') && adventureCards.length > 0 && (
        <section className="py-10 sm:py-12 px-4 sm:px-6 md:px-12 bg-gradient-to-r from-[#E8943A]/5 via-white to-[#58bdae]/5">
          <div className="mb-8">
            <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#58bdae] mb-2">{content.plainText('adventure_label', 'Push Your Limits')}</p>
            <h2 className="font-heading text-[clamp(20px,2.5vw,28px)] font-bold leading-[1.3] text-[#1A1A18]"
                dangerouslySetInnerHTML={{ __html: content.text('adventure_title', 'Best Adventure Sports <em class="italic text-[#58bdae]">Packages in India</em>') }} />
            <p className="text-[16px] text-btg-mid font-bold mt-1">{content.plainText('adventure_subtitle', 'For that extra adrenaline rush!')}</p>
          </div>
          <PackageScroller cards={adventureCards} emptyMsg="" />
          <div className="text-center mt-8">
            <Link href="/experiences/adventure-guides" className="inline-block text-sm font-bold text-white bg-btg-cta px-8 py-3 rounded-full hover:bg-btg-cta-hover hover:-translate-y-0.5 transition-all tracking-wide">
              Explore More →
            </Link>
          </div>
        </section>
      )}

      {/* --------------- OFFBEAT TRAVEL --------------- */}
      <section className="py-10 sm:py-12 px-4 sm:px-6 md:px-12">
        <div className="mb-8">
          <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#58bdae] mb-2">Offbeat Travel</p>
          <h2 className="font-heading text-[clamp(20px,2.5vw,28px)] font-bold leading-[1.3] text-[#1A1A18]">
            Offbeat trails and <em className="italic text-[#58bdae]">experiences</em> for you
          </h2>
        </div>
        {offbeatCards.length > 0 ? (
          <PackageScroller cards={offbeatCards} emptyMsg="" />
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-[#58bdae]/30">
            <span className="text-5xl mb-4 block">{String.fromCodePoint(0x1F30D)}</span>
            <h3 className="font-heading text-[22px] font-bold text-[#1A1A18] mb-2">Coming Soon</h3>
            <p className="text-[15px] text-[#6B6560]">Offbeat travel packages combining treks, adventure sports &amp; local experiences are being curated. Stay tuned!</p>
          </div>
        )}
        <div className="text-center mt-8">
          <Link href="/experiences/offbeat-travel" className="inline-block text-sm font-bold text-white bg-btg-cta px-8 py-3 rounded-full hover:bg-btg-cta-hover hover:-translate-y-0.5 transition-all tracking-wide">
            Explore Offbeat Trips →
          </Link>
        </div>
      </section>

      {/* --------------- RECOMMENDED TREKS FOR THE SEASON --------------- */}
      <section className="py-10 sm:py-12 px-4 sm:px-6 md:px-12 bg-gradient-to-br from-white via-[#58bdae]/5 to-white">
        <div className="mb-8">
          <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#58bdae] mb-2">Curated for You</p>
          <h2 className="font-heading text-[clamp(20px,2.5vw,28px)] font-bold leading-[1.3] text-[#1A1A18]">
            Recommended <em className="italic text-[#58bdae]">Treks</em> for the season
          </h2>
        </div>
        <PackageScroller cards={trendingCards} emptyMsg="Recommended treks coming soon!" />
        <div className="text-center mt-8">
          <Link href="/experiences/trekking" className="inline-block text-sm font-bold text-white bg-btg-cta px-8 py-3 rounded-full hover:bg-btg-cta-hover hover:-translate-y-0.5 transition-all tracking-wide">
            Explore All Treks →
          </Link>
        </div>
      </section>

      {/* --------------- ADVENTURE SPORTS — BUCKET LIST --------------- */}
      <section className="py-10 sm:py-12 px-4 sm:px-6 md:px-12 bg-gradient-to-br from-[#E8943A]/5 via-white to-[#58bdae]/5">
        <div className="mb-8">
          <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#58bdae] mb-2">Adventure Sports</p>
          <h2 className="font-heading text-[clamp(20px,2.5vw,28px)] font-bold leading-[1.3] text-[#1A1A18]">
            Biking Trips, Rafting, Paragliding.. <em className="italic text-[#58bdae]">Tick it off</em> the bucket list
          </h2>
        </div>
        <PackageScroller cards={adventureCards} emptyMsg="Adventure sports packages coming soon!" />
        <div className="text-center mt-8">
          <Link href="/experiences/adventure-guides" className="inline-block text-sm font-bold text-white bg-btg-cta px-8 py-3 rounded-full hover:bg-btg-cta-hover hover:-translate-y-0.5 transition-all tracking-wide">
            Explore All →
          </Link>
        </div>
      </section>

      {/* --------------- TRAVEL WITH INFLUENCERS (DYNAMIC) — Star Offering --------------- */}
      {isSectionVisible(uiConfig, 'influencers') && influencerCards.length > 0 && (
        <section className="relative py-10 sm:py-16 px-4 sm:px-6 md:px-12 overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A18] via-[#2a2a28] to-[#1A1A18]" />
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #58bdae 1px, transparent 1px), radial-gradient(circle at 80% 20%, #FF7F50 1px, transparent 1px)', backgroundSize: '60px 60px, 40px 40px' }} />
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF7F50] via-[#58bdae] to-[#FFD96A]" />
          
          <div className="relative z-10">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FF7F50]/20 to-[#FFD96A]/20 border border-[#FF7F50]/30 rounded-full px-5 py-2 mb-4">
                <span className="text-[13px] font-bold tracking-wide text-[#FFD96A]">{content.plainText('influencer_badge', '⭐ STAR EXPERIENCE')}</span>
              </div>
              <h2 className="font-heading text-[clamp(22px,3vw,30px)] font-bold leading-[1.3] text-white mb-3"
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
                      <Image src={pkg.coverImage} alt={pkg.title} fill sizes="280px" className="object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#FF7F50]/30 to-[#FFD96A]/30 flex items-center justify-center">
                        <span className="text-5xl">{String.fromCodePoint(0x1F3D4, 0xFE0F)}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                    {pkg.seatsLeft !== undefined && pkg.seatsLeft > 0 && (
                      <div className="absolute top-4 left-4 bg-[#FF7F50] text-white text-[11px] font-bold tracking-[0.1em] px-4 py-1.5 rounded-full uppercase shadow-lg">
                        {pkg.seatsLeft} seats left
                      </div>
                    )}
                    <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-lg">
                      &#x2661;
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="inline-flex items-center gap-1.5 bg-[#58bdae]/20 backdrop-blur-sm rounded-full px-3 py-1 mb-2">
                      <span className="text-[11px] font-semibold text-[#58bdae]">by {pkg.guideName}</span>
                    </div>
                    <div className="font-heading text-[17px] text-white font-bold mb-2 line-clamp-2 leading-tight">{pkg.title}</div>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-white/60">{pkg.destinationName} &middot; {pkg.durationDays}D{pkg.durationNights > 0 ? `/${pkg.durationNights}N` : ''}</span>
                      <span className="text-[#FFD96A] font-bold">{pkg.price ? `\u20B9${pkg.price.toLocaleString('en-IN')}` : 'On Request'}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link href="/experiences/travel-with-influencers" className="inline-flex items-center gap-2 text-[15px] font-bold text-[#1A1A18] bg-gradient-to-r from-[#FFD96A] to-[#FF7F50] px-10 py-4 rounded-full hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(255,127,80,0.3)] transition-all tracking-wide">
                Explore Creator Trips →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* --------------- Pablo — AI Travel Buddy --------------- */}
      {isSectionVisible(uiConfig, 'neev_ai') && (
      <section className="mx-6 md:mx-12 my-10 relative">
        <div className="rounded-[24px] overflow-hidden relative bg-gradient-to-br from-[#FFF5EE] via-[#FFF0E6] to-[#FFE8D6] border border-[#FF7F50]/15">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#FF7F50] via-[#FFD96A] to-[#FF7F50]" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 px-6 py-8 md:px-10 md:py-8">
            {/* Left: Pablo mascot + Content */}
            <div className="flex items-center gap-5 flex-1">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden flex-shrink-0 shadow-lg ring-2 ring-[#FF7F50]/20">
                <Image src="/images/btg/pablo-mascot.png" alt="Pablo" width={80} height={80} className="object-cover w-full h-full" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-[#FF7F50]">Meet Pablo</span>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </div>
                <h2 className="font-heading text-[clamp(18px,2.5vw,24px)] font-bold text-[#1A1A18] leading-tight mb-1"
                    dangerouslySetInnerHTML={{ __html: content.text('neev_title', 'Not sure where to go? Let <em class="italic text-[#FF7F50]">Pablo</em> figure it out!') }} />
                <p className="text-[14px] text-[#6B6560] max-w-md hidden sm:block">
                    {content.plainText('neev_description', "Your local mountain doggo who knows every trail, hidden spot and the perfect guide for you.")}
                </p>
              </div>
            </div>
            
            {/* Right: CTA */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <TalkToPabloButton />
              <span className="text-[12px] text-[#6B6560]/50 hidden sm:block">Free — No sign-up</span>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* --------------- HERITAGE & CULTURE (DYNAMIC) --------------- */}
      {isSectionVisible(uiConfig, 'heritage') && heritageCards.length > 0 && (
        <section className="py-10 sm:py-12 px-4 sm:px-6 md:px-12">
          <div className="mb-8">
            <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#58bdae] mb-2">{content.plainText('heritage_label', 'Curated for You')}</p>
            <h2 className="font-heading text-[clamp(20px,2.5vw,28px)] font-bold leading-[1.3] text-[#1A1A18]"
                dangerouslySetInnerHTML={{ __html: content.text('heritage_title', 'Most Loved <em class="italic text-[#58bdae]">Heritage Walks</em>') }} />
          </div>
          <PackageScroller cards={heritageCards} emptyMsg="" />
          <div className="text-center mt-8">
            <Link href="/experiences/heritage-walks" className="inline-block text-sm font-bold text-white bg-btg-cta px-8 py-3 rounded-full hover:bg-btg-cta-hover hover:-translate-y-0.5 transition-all tracking-wide">
              Explore More →
            </Link>
          </div>
        </section>
      )}

      {/* --------------- GROUP TRIPS (DYNAMIC) --------------- */}
      {groupCards.length > 0 && (
        <section className="py-10 sm:py-12 px-4 sm:px-6 md:px-12 bg-gradient-to-br from-white via-[#58bdae]/5 to-white">
          <div className="mb-8">
            <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#58bdae] mb-2">{content.plainText('group_trips_label', 'Travel with New Friends')}</p>
            <h2 className="font-heading text-[clamp(20px,2.5vw,28px)] font-bold leading-[1.3] text-[#1A1A18]"
                dangerouslySetInnerHTML={{ __html: content.text('group_trips_title', 'Trending <em class="italic text-[#58bdae]">Group Trips</em>') }} />
            <p className="text-[16px] text-btg-mid font-bold mt-1">{content.plainText('group_trips_subtitle', 'Because You Only Live Once!')}</p>
          </div>
          <PackageScroller cards={groupCards} emptyMsg="" />
          <div className="text-center mt-8">
            <Link href="/experiences/group-trips" className="inline-block text-sm font-bold text-white bg-btg-cta px-8 py-3 rounded-full hover:bg-btg-cta-hover hover:-translate-y-0.5 transition-all tracking-wide">
              Explore More →
            </Link>
          </div>
        </section>
      )}

      {/* --------------- REVIEWS & GALLERY --------------- */}
      <section className="py-10 sm:py-12 px-4 sm:px-6 md:px-12 bg-white">
        <div className="text-center mb-8">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#58bdae] mb-2">{content.plainText('reviews_label', 'What Travellers Say')}</p>
          <h2 className="font-heading text-[clamp(22px,2.8vw,28px)] font-bold leading-[1.3] text-[#1A1A18]"
              dangerouslySetInnerHTML={{ __html: content.text('reviews_title', 'Real Stories, Real <em class="italic text-[#58bdae]">Experiences</em>') }} />
          <p className="text-[15px] text-[#6B6560] mt-2 max-w-md mx-auto">{content.plainText('reviews_subtitle', 'Hear from fellow travellers who explored India with our verified guides')}</p>
        </div>

        {/* Reviews */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
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
            { name: 'Rohit Agarwal', location: 'Mumbai', rating: 5, text: 'Booked a heritage walk in Jaipur — our guide\'s knowledge of Rajasthani history was outstanding. Highly recommend for culture lovers.', avatar: 'RA', trip: 'Jaipur Heritage Walk', avatarImage: null },
            { name: 'Ananya Reddy', location: 'Bangalore', rating: 4, text: 'The group trip to Ladakh was life-changing. Met amazing people and our guide made sure every detail was perfect. Will book again!', avatar: 'AR', trip: 'Ladakh Group Trip', avatarImage: null },
          ]).map((review: any) => (
            <div key={review.name} className="bg-white rounded-2xl p-6 border border-btg-dark/[0.06] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                {review.avatarImage ? (
                  <Image src={review.avatarImage} alt={review.name} width={48} height={48} className="w-12 h-12 rounded-full object-cover shadow-sm" loading="lazy" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#58bdae] to-[#4aa99b] flex items-center justify-center text-white text-sm font-bold shadow-sm">{review.avatar}</div>
                )}
                <div>
                  <div className="font-heading text-[15px] font-bold text-btg-dark">{review.name}</div>
                  <div className="text-[13px] text-btg-light-text">{review.location} — {review.trip}</div>
                </div>
              </div>
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={`text-[15px] ${i < review.rating ? 'text-[#E8943A]' : 'text-gray-300'}`}>&#x2605;</span>
                ))}
              </div>
              <p className="text-[14px] text-[#6B6560] leading-relaxed">&ldquo;{review.text}&rdquo;</p>
            </div>
          ))}
        </div>

        {/* Image Gallery Grid — 2 rows with travel images */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-10">
          {[
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80&fm=webp',
            'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=400&q=80&fm=webp',
            'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&q=80&fm=webp',
            'https://images.unsplash.com/photo-1548013146-72479768bada?w=400&q=80&fm=webp',
            'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80&fm=webp',
            'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&q=80&fm=webp',
            'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&q=80&fm=webp',
            'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=400&q=80&fm=webp',
          ].map((src, idx) => (
            <div key={idx} className="relative rounded-xl overflow-hidden aspect-square group cursor-pointer">
              <Image src={src} alt={`India travel adventure photo ${idx + 1} — Book The Guide gallery`} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
          ))}
        </div>

        {/* Join us on Social Media */}
        <div>
          <div className="text-center mb-8">
            <h3 className="font-heading text-[clamp(18px,2.5vw,24px)] font-bold text-[#1A1A18]">
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
                  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&q=80&fm=webp',
                  'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=300&q=80&fm=webp',
                  'https://images.unsplash.com/photo-1548013146-72479768bada?w=300&q=80&fm=webp',
                  'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=300&q=80&fm=webp',
                  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=300&q=80&fm=webp',
                  'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=300&q=80&fm=webp',
                ].map((src, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer">
                    <Image src={src} alt={`Book The Guide Instagram travel photo ${idx + 1}`} fill sizes="120px" className="object-cover group-hover:scale-110 transition-transform duration-300" />
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
                  { title: 'Top 5 Hidden Treks in Himachal Pradesh', views: '12K views', duration: '8:42', thumb: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80&fm=webp' },
                  { title: 'Heritage Walk Through Old Delhi', views: '8.5K views', duration: '12:15', thumb: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&q=80&fm=webp' },
                  { title: 'Ladakh Road Trip with Local Guide', views: '21K views', duration: '15:30', thumb: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80&fm=webp' },
                ].map((video, idx) => (
                  <div key={idx} className="flex gap-3 group cursor-pointer hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors">
                    <div className="relative w-[140px] h-[80px] rounded-lg overflow-hidden flex-shrink-0">
                      <Image src={video.thumb} alt={video.title} fill sizes="140px" className="object-cover" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                          <span className="text-[#FF0000] text-sm ml-0.5">&#x25B6;</span>
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

      {/* --------------- GET INSPIRED — Blog --------------- */}
      <section className="py-10 sm:py-14 px-4 sm:px-6 md:px-12 bg-gradient-to-br from-[#1A1A18] to-[#2a2a28]">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#58bdae] mb-2">From Our Journal</p>
              <h2 className="font-heading text-[clamp(22px,2.8vw,30px)] font-bold leading-[1.3] text-white">
                Get <em className="italic text-[#58bdae]">Inspired</em>
              </h2>
              <p className="text-[15px] text-white/50 mt-1.5 max-w-md">Stories, tips and guides from the mountains</p>
            </div>
            <Link
              href="/blog"
              className="hidden sm:inline-flex items-center gap-2 text-[13px] font-bold text-[#58bdae] border border-[#58bdae]/30 px-5 py-2.5 rounded-full hover:bg-[#58bdae] hover:text-white transition-all"
            >
              <BookOpen className="w-4 h-4" /> View All Posts
            </Link>
          </div>

          {latestPosts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {latestPosts.map((post: any) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-[#58bdae]/40 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(88,189,174,0.1)] transition-all duration-300"
                >
                  {post.featuredImage?.node?.sourceUrl && (
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <Image src={post.featuredImage.node.sourceUrl} alt={post.title} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  )}
                  <div className="p-5">
                    {post.categories?.nodes?.[0] && (
                      <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-[#58bdae] mb-2 block">{post.categories.nodes[0].name}</span>
                    )}
                    <h3 className="font-heading text-[16px] font-bold text-white leading-snug mb-2 group-hover:text-[#58bdae] transition-colors line-clamp-2">{post.title}</h3>
                    {post.excerpt && (
                      <p className="text-[13px] text-white/50 line-clamp-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: post.excerpt.replace(/<[^>]*>/g, '').slice(0, 120) + '…' }} />
                    )}
                    <div className="mt-4 text-[12px] text-[#58bdae] font-semibold">Read more →</div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            /* Fallback: static preview cards when WP not configured */
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { tag: 'Trekking Tips', title: 'Top 10 Beginner Treks in Uttarakhand', excerpt: 'A curated list of trails that are perfect for first-time trekkers — safe, scenic and unforgettable.', img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=640&q=80&fm=webp', slug: 'beginner-treks-uttarakhand' },
                { tag: 'Adventure', title: 'River Rafting in Rishikesh: The Complete Guide', excerpt: 'Everything you need to know before you hit the rapids — gear, grades, and the best season to go.', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=640&q=80&fm=webp', slug: 'rafting-rishikesh-guide' },
                { tag: 'Offbeat', title: 'Hidden Villages of Spiti Valley', excerpt: 'Beyond the tourist trail — these ancient villages in Spiti are still untouched by mass tourism.', img: 'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=640&q=80&fm=webp', slug: 'hidden-villages-spiti' },
              ].map((post) => (
                <Link
                  key={post.slug}
                  href="/blog"
                  className="group bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-[#58bdae]/40 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(88,189,174,0.1)] transition-all duration-300"
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image src={post.img} alt={post.title} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-5">
                    <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-[#58bdae] mb-2 block">{post.tag}</span>
                    <h3 className="font-heading text-[16px] font-bold text-white leading-snug mb-2 group-hover:text-[#58bdae] transition-colors">{post.title}</h3>
                    <p className="text-[13px] text-white/50 line-clamp-2 leading-relaxed">{post.excerpt}</p>
                    <div className="mt-4 text-[12px] text-[#58bdae] font-semibold">Read more →</div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-8 sm:hidden">
            <Link href="/blog" className="inline-flex items-center gap-2 text-[13px] font-bold text-[#58bdae] border border-[#58bdae]/30 px-5 py-2.5 rounded-full hover:bg-[#58bdae] hover:text-white transition-all">
              <BookOpen className="w-4 h-4" /> View All Posts
            </Link>
          </div>
        </div>
      </section>

      {/* --------------- WHY BOOK THE GUIDE --------------- */}      <section className="py-10 sm:py-12 px-4 sm:px-6 md:px-12 bg-gradient-to-br from-[#58bdae]/5 via-white to-[#E8943A]/5">
        <div className="text-center mb-8">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#58bdae] mb-2">{content.plainText('why_btg_label', 'Our Promise')}</p>
          <h2 className="font-heading text-[clamp(22px,2.8vw,28px)] font-bold leading-[1.3] text-[#1A1A18]"
              dangerouslySetInnerHTML={{ __html: content.text('why_btg_title', 'Why Book <em class="italic text-[#58bdae]">The Guide?</em>') }} />
          <p className="text-[15px] text-btg-light-text font-light max-w-[600px] leading-[1.7] mt-3 mx-auto">
            {content.plainText('why_btg_description', 'We connect you with verified, experienced local guides who know every trail, every shortcut, and every hidden gem. No middlemen, no surprises — just authentic local expertise.')}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 max-w-6xl mx-auto">
          {[
            { icon: String.fromCodePoint(0x2705), title: content.plainText('why_1_title', 'Verified Local Guides'), desc: content.plainText('why_1_desc', 'Every guide is verified by our regional admins with background checks and certification validation.') },
            { icon: String.fromCodePoint(0x1F4B0), title: content.plainText('why_2_title', 'Transparent Pricing'), desc: content.plainText('why_2_desc', 'Guides set their own prices. No hidden fees. See exactly what you pay for, always.') },
            { icon: String.fromCodePoint(0x2B50), title: content.plainText('why_3_title', 'Real Reviews'), desc: content.plainText('why_3_desc', 'Only verified customers who completed trips can leave reviews. 100% authentic feedback.') },
            { icon: String.fromCodePoint(0x1F4C5), title: content.plainText('why_4_title', 'Flexible Booking'), desc: content.plainText('why_4_desc', 'Join group departures or hire a personal guide. Fixed dates or custom trips — your choice.') },
            { icon: String.fromCodePoint(0x1F512), title: content.plainText('why_5_title', 'Secure Booking'), desc: content.plainText('why_5_desc', 'Your personal details stay private. We never share contact info between guests and guides before booking.') },
          ].map((card) => (
            <div key={card.title} className="bg-white rounded-[20px] p-7 border border-btg-dark/[0.06] hover:border-[#58bdae] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(88,189,174,0.1)] transition-all duration-300 text-center">
              <div className="w-14 h-14 rounded-[16px] bg-[#58bdae]/10 flex items-center justify-center mb-4 text-[26px] mx-auto">{card.icon}</div>
              <h3 className="font-heading text-[17px] font-bold text-[#1A1A18] mb-2">{card.title}</h3>
              <p className="text-[13px] leading-[1.7] text-btg-light-text font-light">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --------------- GUIDE CTA — Centre Aligned --------------- */}
      <div className="mx-6 md:mx-12 my-12 rounded-[32px] bg-btg-dark p-8 md:py-14 md:px-[60px] text-center relative overflow-hidden">
        <div className="absolute right-[60px] top-1/2 -translate-y-1/2 font-heading text-[200px] font-bold text-white/[0.03] tracking-tight pointer-events-none select-none">
          BTG
        </div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#58bdae] mb-2">{content.plainText('guide_cta_label', 'Join Our Community')}</p>
          <h2 className="font-heading text-[clamp(22px,2.8vw,30px)] font-bold leading-[1.3] text-btg-cream"
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


