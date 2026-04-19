import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Star, ChevronRight, ArrowRight, Calendar, Users, Mountain, HelpCircle, Clock, Sparkles, TreePine } from 'lucide-react';
import prisma from '@/lib/prisma';
import { getStateBySlug, getAllStateSlugs } from '@/lib/states';
import { getDisabledCategorySlugs, getActiveStates } from '@/lib/active-packages';
import { type PackageCardData } from '@/components/PackageCard';
import { getStateHub, wpSeoToMetadata, getStateHubContent } from '@/lib/wordpress';
import { WPFaqSection, WPSeoContentBlock, WPInternalLinksGrid } from '@/components/wordpress/WPContentBlocks';
import { getUIConfig, getSectionSort, getSectionLimit, getFeaturedIds, applySorting, applyFeaturedPinning } from '@/lib/ui-config';

interface PageProps {
  params: { state: string };
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

/** Placeholder card shown when no real packages exist */
function PlaceholderPackageCard({ idx, stateName, category }: { idx: number; stateName: string; category: string }) {
  const placeholders = [
    { title: `Discover ${stateName} � Coming Soon`, emoji: '???' },
    { title: `Explore Hidden Trails in ${stateName}`, emoji: '??' },
    { title: `${stateName} Adventure Awaits`, emoji: '??' },
    { title: `Experience ${stateName} Like Never Before`, emoji: '??' },
  ];
  const p = placeholders[idx % placeholders.length];
  return (
    <div className="flex-shrink-0 w-[270px] sm:w-[310px] rounded-[20px] overflow-hidden bg-white shadow-[0_2px_16px_rgba(28,26,23,0.06)] snap-start opacity-75">
      <div className="relative w-full h-[200px] overflow-hidden bg-gradient-to-br from-[#58bdae]/10 to-[#7A9E7E]/10 flex items-center justify-center">
        <span className="text-5xl">{p.emoji}</span>
        <span className="absolute top-3 left-3 bg-[#58bdae]/80 text-white text-[11px] font-semibold tracking-[0.1em] px-3 py-1.5 rounded-full uppercase">Coming Soon</span>
      </div>
      <div className="p-4">
        <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#58bdae] mb-1 font-body">{category.replace(/_/g, ' ')}</div>
        <h3 className="font-heading text-[18px] font-bold text-[#1A1A18] mb-2 leading-snug line-clamp-2">{p.title}</h3>
        <div className="flex gap-3 mb-3">
          <span className="text-[12px] text-[#6B6560] flex items-center gap-1 font-body"><MapPin className="w-3.5 h-3.5" /> {stateName}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-[15px] text-[#6B6560] font-body italic">Trips launching soon</div>
          <span className="text-[12px] font-semibold text-white bg-[#58bdae] px-4 py-2 rounded-full font-heading shadow-sm">Soon</span>
        </div>
      </div>
    </div>
  );
}

/** Placeholder guide card */
function PlaceholderGuideCard({ idx, stateName }: { idx: number; stateName: string }) {
  const names = ['Local Expert', 'Mountain Guide', 'Trek Leader', 'Adventure Pro'];
  const specs = [['Trekking', 'Nature'], ['Adventure', 'Culture'], ['Photography', 'Wildlife'], ['Heritage', 'Food']];
  return (
    <div className="flex-shrink-0 w-[220px] sm:w-[270px] rounded-2xl overflow-hidden bg-[#F5F0E8] border border-[#EDE8DF] snap-start opacity-75">
      <div className="p-6 text-center">
        <div className="w-20 h-20 rounded-full mx-auto mb-4 overflow-hidden border-[3px] border-[#58bdae]/30">
          <div className="w-full h-full bg-gradient-to-br from-[#58bdae] to-[#4aa99b] flex items-center justify-center text-white font-heading font-bold text-2xl">
            {names[idx % 4].charAt(0)}
          </div>
        </div>
        <h3 className="font-heading text-lg font-bold text-[#1A1A18] mb-1">{names[idx % 4]}</h3>
        <p className="text-xs text-[#6B6560] font-body mb-3">Verified {stateName} Guide � Coming Soon</p>
        <div className="flex flex-wrap justify-center gap-1.5">
          {specs[idx % 4].map((s) => (
            <span key={s} className="text-[10px] bg-[#58bdae]/10 text-[#58bdae] px-2.5 py-1 rounded-full font-semibold font-body">{s}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Horizontally-scrollable row of package cards */
function PackageRow({ cards, stateName, category }: { cards: PackageCardData[]; stateName?: string; category?: string }) {
  if (cards.length === 0 && stateName) {
    return (
      <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-1 px-1">
        {[0, 1, 2, 3].map((i) => (
          <PlaceholderPackageCard key={i} idx={i} stateName={stateName} category={category || 'EXPERIENCE'} />
        ))}
      </div>
    );
  }
  if (cards.length === 0) return null;
  return (
    <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-1 px-1">
      {cards.map((pkg) => (
        <Link
          key={pkg.id}
          href={`/trips/${pkg.slug}`}
          className="flex-shrink-0 w-[270px] sm:w-[310px] rounded-[20px] overflow-hidden bg-white shadow-[0_2px_16px_rgba(28,26,23,0.06)] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(28,26,23,0.12)] transition-all duration-300 snap-start group"
        >
          <div className="relative w-full h-[200px] overflow-hidden">
            {pkg.coverImage ? (
              <img src={pkg.coverImage} alt={pkg.title} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500" loading="lazy" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#58bdae]/10 to-[#7A9E7E]/10 flex items-center justify-center"><span className="text-4xl">???</span></div>
            )}
            {pkg.seatsLeft !== undefined && pkg.seatsLeft > 0 && pkg.seatsLeft <= 10 && (
              <span className="absolute top-3 left-3 bg-[#FF7F50] text-white text-[11px] font-semibold tracking-[0.1em] px-3 py-1.5 rounded-full uppercase">
                {pkg.seatsLeft} seats left
              </span>
            )}
          </div>
          <div className="p-4">
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#58bdae] mb-1 font-body">
              {pkg.activityType.replace(/_/g, ' ')}
            </div>
            <h3 className="font-heading text-[18px] font-bold text-[#1A1A18] mb-2 leading-snug line-clamp-2 group-hover:text-[#58bdae] transition-colors">{pkg.title}</h3>
            <div className="flex gap-3 mb-3 flex-wrap">
              <span className="text-[12px] text-[#6B6560] flex items-center gap-1 font-body"><MapPin className="w-3.5 h-3.5" /> {pkg.destinationName}</span>
              <span className="text-[12px] text-[#6B6560] flex items-center gap-1 font-body"><Clock className="w-3.5 h-3.5" /> {pkg.durationDays}D{pkg.durationNights > 0 && `/${pkg.durationNights}N`}</span>
              <span className="text-[12px] text-[#6B6560] flex items-center gap-1 font-body"><Star className="w-3.5 h-3.5 fill-[#E8943A] text-[#E8943A]" /> {pkg.guideRating.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-[18px] font-semibold text-[#1A1A18] font-heading">
                {pkg.price ? `?${pkg.price.toLocaleString('en-IN')}` : 'On Request'} <small className="text-[11px] text-[#6B6560] font-light font-body">/person</small>
              </div>
              <span className="text-[12px] font-semibold text-white bg-[#FF7F50] px-4 py-2 rounded-full font-heading shadow-sm">
                View
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ---------------- METADATA ---------------- */

// ISR: render on-demand, cache for 60s, regenerate in background
export const revalidate = 60;

export async function generateStaticParams() {
  // Return empty to skip build-time prerendering (avoids DB connection exhaustion)
  return [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const state = getStateBySlug(params.state);
  if (!state) return { title: 'State Not Found | Book The Guide' };

  const h1 = state.landing?.h1 || `Discover ${state.name} with Certified Local Guides`;
  const desc = state.landing?.descriptionLong || state.description;
  const title = `${h1} | Book The Guide`;
  const description = `${desc} ? Verified Guides ? Instant Booking ? Best Prices`;
  const url = `https://www.booktheguide.com/explore/${state.slug}`;

  const wpHub = await getStateHub(state.slug);
  if (wpHub?.seo) {
    return wpSeoToMetadata(wpHub.seo, { title, description, url, image: state.heroImage });
  }

  return {
    title,
    description,
    keywords: `${state.name} tours, ${state.name} guides, ${state.name} treks, travel ${state.name}, things to do in ${state.name}, book guide ${state.name}`,
    openGraph: {
      title: `Explore ${state.name} � Guides & Trips | Book The Guide`,
      description,
      url,
      images: state.heroImage ? [{ url: state.heroImage, width: 1200, height: 630, alt: `Explore ${state.name}` }] : [],
    },
    twitter: { card: 'summary_large_image', title: `Explore ${state.name} | Book The Guide`, description },
    alternates: { canonical: url },
  };
}

/* ---------------- PAGE ---------------- */

export default async function StateHubPage({ params }: PageProps) {
  const state = getStateBySlug(params.state);
  if (!state) notFound();

  const [wpHub, wp] = await Promise.all([
    getStateHub(state.slug),
    getStateHubContent(state.slug),
  ]);

  const disabledSlugs = await getDisabledCategorySlugs();

  const [
    dbState,
    allProducts,
    cities,
    guides,
    blogs,
    uiConfig,
    allActiveStates,
  ] = await Promise.all([
    prisma.indianState.findFirst({ where: { name: state.name }, select: { id: true, name: true } }),
    prisma.product.findMany({
      where: {
        status: 'APPROVED',
        isActive: true,
        destination: { city: { state: { name: state.name } } },
        fixedDepartures: { some: { isActive: true, approvalStatus: 'APPROVED', startDate: { gte: new Date() } } },
      },
      include: productInclude,
      orderBy: [{ isTrending: 'desc' }, { createdAt: 'desc' }],
      take: 80,
    }),
    prisma.city.findMany({
      where: {
        state: { name: state.name },
        destinations: { some: { products: { some: { status: 'APPROVED', isActive: true } } } },
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.guideProfile.findMany({
      where: {
        isVerified: true,
        isActive: true,
        user: { isActive: true },
        serviceAreas: { some: { state: { name: state.name } } },
      },
      include: {
        user: { select: { name: true, image: true } },
        _count: { select: { products: { where: { status: 'APPROVED', isActive: true } } } },
      },
      orderBy: { averageRating: 'desc' },
      take: 15,
    }),
    prisma.inspirationContent.findMany({
      where: {
        isPublished: true,
        OR: [
          { tags: { hasSome: [state.name, state.slug, state.code] } },
          { destinations: { hasSome: [state.name] } },
        ],
      },
      select: { id: true, title: true, slug: true, thumbnail: true, excerpt: true, type: true, publishedAt: true },
      orderBy: { publishedAt: 'desc' },
      take: 6,
    }),
    getUIConfig('state-pages-default'),
    getActiveStates(),
  ]);

  const products = allProducts as any[];

  // Section 4: Popular / trending
  const trendingCards = applyFeaturedPinning(
    applySorting(products, getSectionSort(uiConfig, 'popular_experiences')),
    getFeaturedIds(uiConfig, 'popular_experiences')
  ).slice(0, getSectionLimit(uiConfig, 'popular_experiences', 12)).map(toCard);

  // Section 5: Trekking
  const trekkingCards = products
    .filter((p: any) => p.packageCategory === 'TREKKING' && !disabledSlugs.has('TREKKING'))
    .slice(0, 12).map(toCard);

  // Section 6: Adventure
  const adventureCards = products
    .filter((p: any) => p.packageCategory === 'ADVENTURE_GUIDES' && !disabledSlugs.has('ADVENTURE_GUIDES'))
    .slice(0, 12).map(toCard);

  // Section 7: Offbeat
  const offbeatCards = products
    .filter((p: any) => p.packageCategory === 'OFFBEAT_TRAVEL' && !disabledSlugs.has('OFFBEAT_TRAVEL'))
    .slice(0, 12).map(toCard);

  const landingH1 = state.landing?.h1 || `Discover ${state.name} with Certified Local Guides`;
  const landingDesc = state.landing?.descriptionLong || state.description;
  const offbeatLine = state.landing?.offbeat || 'Hidden gems and offbeat destinations';
  const seoDesc = state.landing?.seoDescription || state.description;

  return (
    <main className="bg-[#FAF7F2] min-h-screen">

      {/* --------------- 1. HERO SECTION --------------- */}
      <section className="relative h-[60vh] sm:h-[70vh] md:h-[75vh] min-h-[400px] sm:min-h-[520px] flex flex-col justify-end overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${state.heroImage})` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(28,26,23,0.88)] via-[rgba(28,26,23,0.4)] to-transparent" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF7F50] via-[#58bdae] to-[#FF7F50]" />
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-16 pb-8 sm:pb-14">
          <p className="text-[11px] sm:text-[12px] font-bold tracking-[0.2em] uppercase text-[#FF7F50] mb-2 sm:mb-3 font-heading flex items-center gap-2">
            <span className="w-6 sm:w-8 h-px bg-[#FF7F50] inline-block" />
            {state.isNorthIndia ? 'North India' : 'India'} � {state.code}
          </p>
          <h1 className="font-heading text-[clamp(28px,7vw,76px)] font-bold text-white mb-3 sm:mb-4 leading-[1.05] tracking-tight">
            Explore <span className="text-[#58bdae]">{state.name}</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-white/75 font-body mb-4 sm:mb-6 max-w-2xl leading-relaxed">{state.tagline}</p>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <span className="text-xs bg-[#FF7F50]/20 backdrop-blur-sm text-white px-4 py-2 rounded-full flex items-center gap-2 border border-[#FF7F50]/30 font-semibold">
              <Calendar className="w-4 h-4 text-[#FF7F50]" /> {state.bestTimeToVisit}
            </span>
            <span className="text-xs bg-[#58bdae]/20 backdrop-blur-sm text-white px-4 py-2 rounded-full flex items-center gap-2 border border-[#58bdae]/30 font-semibold">
              <MapPin className="w-4 h-4 text-[#58bdae]" /> {cities.length || state.popularCities.length}+ Destinations
            </span>
            <span className="text-xs bg-white/15 backdrop-blur-sm text-white px-4 py-2 rounded-full flex items-center gap-2 border border-white/20 font-semibold">
              <Users className="w-4 h-4 text-[#58bdae]" /> {guides.length} Verified Guides
            </span>
          </div>
        </div>
      </section>

      {/* --------------- BREADCRUMB --------------- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-16 py-3 sm:py-4">
        <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-[#6B6560] font-body">
          <Link href="/" className="hover:text-[#58bdae] transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/explore" className="hover:text-[#58bdae] transition-colors">Explore</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#1A1A18] font-semibold">{state.name}</span>
        </nav>
      </div>

      {/* --------------- 2. DESCRIPTION + 3. QUICK INFO --------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-16 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10">
          <div className="lg:col-span-2">
            <h2 className="font-heading text-[clamp(22px,3.5vw,40px)] font-bold text-[#1A1A18] mb-4 sm:mb-5 leading-tight">
              {landingH1}
            </h2>
            <p className="text-[#6B6560] font-body leading-relaxed text-[15px] mb-6">{landingDesc}</p>
            <div className="flex flex-wrap gap-2">
              {state.highlights.map((h) => (
                <span key={h} className="bg-[#58bdae]/10 text-[#58bdae] text-xs font-semibold px-3.5 py-1.5 rounded-full font-body border border-[#58bdae]/20">{h}</span>
              ))}
            </div>
          </div>

          {/* Quick Info Card � no CTA button */}
          <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-[#EDE8DF] h-fit">
            <h3 className="font-heading text-lg font-bold text-[#1A1A18] mb-5 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FF7F50]" /> Quick Info
            </h3>
            <div className="space-y-4 text-sm font-body">
              <div className="flex items-center gap-3 p-3 bg-[#F5F0E8] rounded-xl">
                <Calendar className="w-5 h-5 text-[#58bdae] flex-shrink-0" />
                <div>
                  <span className="text-[#6B6560] text-xs">Best Time to Visit</span>
                  <p className="text-[#1A1A18] font-semibold">{state.bestTimeToVisit}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-[#F5F0E8] rounded-xl">
                <MapPin className="w-5 h-5 text-[#FF7F50] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-[#6B6560] text-xs">Popular Destinations</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {state.popularCities.map((c) => (
                      <span key={c} className="bg-white text-[#1A1A18] text-xs px-2.5 py-0.5 rounded-full border border-[#EDE8DF] font-medium">{c}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-[#F5F0E8] rounded-xl">
                <TreePine className="w-5 h-5 text-[#58bdae] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-[#6B6560] text-xs">Offbeat {state.name}</span>
                  <p className="text-[#1A1A18] font-semibold text-[13px]">{offbeatLine}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#F5F0E8] rounded-xl">
                <Users className="w-5 h-5 text-[#FF7F50] flex-shrink-0" />
                <div>
                  <span className="text-[#6B6560] text-xs">Available on BTG</span>
                  <p className="text-[#1A1A18] font-semibold">{trendingCards.length} Experiences � {guides.length} Guides</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --------------- 4. POPULAR EXPERIENCES � Horizontal Scroll --------------- */}
        <section className="py-10 sm:py-14 px-4 sm:px-6 md:px-12 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#FF7F50] mb-2 font-body">Most Popular</p>
                <h2 className="font-heading text-[clamp(20px,4vw,38px)] font-bold leading-[1.1] text-[#1A1A18]">
                  Popular Experiences in <span className="text-[#58bdae]">{state.name}</span>
                </h2>
                <p className="text-[15px] text-[#6B6560] font-medium mt-2 font-body">Top-rated trips and experiences by verified guides</p>
              </div>
              <Link href={`/search?state=${state.slug}&sort=rating`} className="hidden sm:inline-block text-sm font-bold text-white bg-[#FF7F50] px-7 py-3 rounded-full hover:bg-[#e5673e] hover:-translate-y-0.5 transition-all shadow-[0_4px_14px_rgba(255,127,80,0.35)] tracking-wide font-heading">
                View All ?
              </Link>
            </div>
            <PackageRow cards={trendingCards} stateName={state.name} category="POPULAR" />
            <div className="sm:hidden text-center mt-6">
              <Link href={`/search?state=${state.slug}&sort=rating`} className="inline-block text-sm font-bold text-white bg-[#FF7F50] px-7 py-3 rounded-full hover:bg-[#e5673e] transition-all font-heading">View All ?</Link>
            </div>
          </div>
        </section>

      {/* --------------- 5. POPULAR TREKS --------------- */}
        <section className="py-10 sm:py-14 px-4 sm:px-6 md:px-12 bg-[#FAF7F2]">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#58bdae] mb-2 font-body">Trekking</p>
                <h2 className="font-heading text-[clamp(20px,4vw,38px)] font-bold leading-[1.1] text-[#1A1A18]">
                  Popular Treks in <span className="text-[#58bdae]">{state.name}</span>
                </h2>
                <p className="text-[15px] text-[#6B6560] font-medium mt-2 font-body">Certified trek leaders for every difficulty level</p>
              </div>
              <Link href={`/search?state=${state.slug}&category=trekking`} className="hidden sm:inline-block text-sm font-bold text-white bg-[#58bdae] px-7 py-3 rounded-full hover:bg-[#4aa99b] hover:-translate-y-0.5 transition-all shadow-[0_4px_14px_rgba(88,189,174,0.35)] tracking-wide font-heading">
                All Treks ?
              </Link>
            </div>
            <PackageRow cards={trekkingCards} stateName={state.name} category="TREKKING" />
            <div className="sm:hidden text-center mt-6">
              <Link href={`/search?state=${state.slug}&category=trekking`} className="inline-block text-sm font-bold text-white bg-[#58bdae] px-7 py-3 rounded-full hover:bg-[#4aa99b] transition-all font-heading">All Treks ?</Link>
            </div>
          </div>
        </section>

      {/* --------------- 6. ROADTRIPS, PARAGLIDING & MORE --------------- */}
        <section className="py-10 sm:py-14 px-4 sm:px-6 md:px-12 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#FF7F50] mb-2 font-body">Adventure</p>
                <h2 className="font-heading text-[clamp(20px,4vw,38px)] font-bold leading-[1.1] text-[#1A1A18]">
                  Roadtrips, Paragliding and More in <span className="text-[#58bdae]">{state.name}</span>
                </h2>
                <p className="text-[15px] text-[#6B6560] font-medium mt-2 font-body">Certified adventure guides for thrilling experiences</p>
              </div>
              <Link href={`/search?state=${state.slug}&category=adventure-guides`} className="hidden sm:inline-block text-sm font-bold text-white bg-[#FF7F50] px-7 py-3 rounded-full hover:bg-[#e5673e] hover:-translate-y-0.5 transition-all shadow-[0_4px_14px_rgba(255,127,80,0.35)] tracking-wide font-heading">
                All Adventures ?
              </Link>
            </div>
            <PackageRow cards={adventureCards} stateName={state.name} category="ADVENTURE" />
            <div className="sm:hidden text-center mt-6">
              <Link href={`/search?state=${state.slug}&category=adventure-guides`} className="inline-block text-sm font-bold text-white bg-[#FF7F50] px-7 py-3 rounded-full hover:bg-[#e5673e] transition-all font-heading">All Adventures ?</Link>
            </div>
          </div>
        </section>

      {/* --------------- 7. OFFBEAT TRAVEL --------------- */}
        <section className="py-10 sm:py-14 px-4 sm:px-6 md:px-12 bg-[#FAF7F2]">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#58bdae] mb-2 font-body">Off The Beaten Path</p>
                <h2 className="font-heading text-[clamp(20px,4vw,38px)] font-bold leading-[1.1] text-[#1A1A18]">
                  Offbeat <span className="text-[#58bdae]">{state.name}</span> with Local Guides
                </h2>
                <p className="text-[15px] text-[#6B6560] font-medium mt-2 font-body">Discover unexplored destinations far from the tourist trail</p>
              </div>
              <Link href={`/search?state=${state.slug}&category=offbeat-travel`} className="hidden sm:inline-block text-sm font-bold text-white bg-[#58bdae] px-7 py-3 rounded-full hover:bg-[#4aa99b] hover:-translate-y-0.5 transition-all shadow-[0_4px_14px_rgba(88,189,174,0.35)] tracking-wide font-heading">
                Explore Offbeat ?
              </Link>
            </div>
            <PackageRow cards={offbeatCards} stateName={state.name} category="OFFBEAT" />
            <div className="sm:hidden text-center mt-6">
              <Link href={`/search?state=${state.slug}&category=offbeat-travel`} className="inline-block text-sm font-bold text-white bg-[#58bdae] px-7 py-3 rounded-full hover:bg-[#4aa99b] transition-all font-heading">Explore Offbeat ?</Link>
            </div>
          </div>
        </section>

      {/* --------------- 8. BEST LOCAL GUIDES � Horizontal Scroll --------------- */}
        <section className="py-10 sm:py-14 px-4 sm:px-6 md:px-12 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#58bdae] mb-2 font-body">Verified Experts</p>
                <h2 className="font-heading text-[clamp(20px,4vw,38px)] font-bold leading-[1.1] text-[#1A1A18]">
                  Best, Certified Local Guides in <span className="text-[#58bdae]">{state.name}</span>
                </h2>
                <p className="text-[15px] text-[#6B6560] font-medium mt-2 font-body">Discover verified local experts ready to guide your adventure</p>
              </div>
              <Link href={`/search?state=${state.slug}&view=guides`} className="hidden sm:inline-block text-sm font-bold text-white bg-[#FF7F50] px-7 py-3 rounded-full hover:bg-[#e5673e] hover:-translate-y-0.5 transition-all shadow-[0_4px_14px_rgba(255,127,80,0.35)] tracking-wide font-heading">
                All Guides ?
              </Link>
            </div>

            <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-1 px-1">
              {guides.length > 0 ? guides.map((guide: any) => (
                <Link
                  key={guide.id}
                  href={`/guides/${guide.slug || guide.id}`}
                  className="flex-shrink-0 w-[220px] sm:w-[270px] rounded-2xl overflow-hidden bg-[#F5F0E8] border border-[#EDE8DF] hover:border-[#58bdae] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(88,189,174,0.15)] transition-all duration-300 snap-start group"
                >
                  <div className="p-6 text-center">
                    <div className="w-20 h-20 rounded-full mx-auto mb-4 overflow-hidden border-[3px] border-[#58bdae]/30">
                      {guide.user.image ? (
                        <img src={guide.user.image} alt={guide.user.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#58bdae] to-[#4aa99b] flex items-center justify-center text-white font-heading font-bold text-2xl">
                          {(guide.user.name || 'G').charAt(0)}
                        </div>
                      )}
                    </div>
                    <h3 className="font-heading text-lg font-bold text-[#1A1A18] mb-1 group-hover:text-[#58bdae] transition-colors">{guide.user.name}</h3>
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <div className="flex items-center gap-1 text-sm text-[#E8943A] font-semibold">
                        <Star className="w-4 h-4 fill-[#E8943A] text-[#E8943A]" />
                        {guide.averageRating.toFixed(1)}
                      </div>
                      <span className="text-[#6B6560] text-xs">�</span>
                      <span className="text-xs text-[#6B6560] font-body">{guide.totalReviews} reviews</span>
                    </div>
                    <div className="flex items-center justify-center gap-4 text-xs text-[#6B6560] font-body mb-4">
                      <span className="flex items-center gap-1"><Mountain className="w-3.5 h-3.5 text-[#58bdae]" /> {guide.totalTrips} trips</span>
                      {guide.experienceYears && (
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-[#FF7F50]" /> {guide.experienceYears}+ yrs</span>
                      )}
                    </div>
                    {guide.specializations?.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {guide.specializations.slice(0, 3).map((spec: string) => (
                          <span key={spec} className="text-[10px] bg-[#58bdae]/10 text-[#58bdae] px-2.5 py-1 rounded-full font-semibold font-body">{spec}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              )) : [0, 1, 2, 3].map((i) => (
                <PlaceholderGuideCard key={i} idx={i} stateName={state.name} />
              ))}
            </div>
            <div className="sm:hidden text-center mt-6">
              <Link href={`/search?state=${state.slug}&view=guides`} className="inline-block text-sm font-bold text-white bg-[#FF7F50] px-7 py-3 rounded-full hover:bg-[#e5673e] transition-all font-heading">All Guides ?</Link>
            </div>
          </div>
        </section>

      {/* --------------- 9. GET INSPIRED � Blogs & Videos --------------- */}
      <section className="py-10 sm:py-14 px-4 sm:px-6 md:px-12 bg-[#F5F0E8]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#FF7F50] mb-2 font-body">Travel Stories</p>
            <h2 className="font-heading text-[clamp(20px,4vw,38px)] font-bold leading-[1.1] text-[#1A1A18]">
              Traveling to {state.name}? <span className="text-[#58bdae]">Get Inspired</span>
            </h2>
            <p className="text-[15px] text-[#6B6560] font-body mt-2">Itineraries, tips, and insider guides from our community</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(blogs.length > 0 ? blogs : [
              { id: 'fb-1', slug: state.slug, title: `Best Places to Visit in ${state.name} � A Complete Travel Guide`, thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80&fm=webp', type: 'BLOG', excerpt: `Discover the most incredible destinations in ${state.name} with our comprehensive guide.` },
              { id: 'fb-2', slug: state.slug, title: `Top ${state.highlights[0] || 'Experiences'} in ${state.name}`, thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80&fm=webp', type: 'BLOG', excerpt: `Our expert guides share their picks for must-do activities in ${state.name}.` },
              { id: 'fb-3', slug: state.slug, title: `${state.name} Travel Guide 2026 � Tips from Local Experts`, thumbnail: 'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=600&q=80&fm=webp', type: 'BLOG', excerpt: `Everything you need to know before visiting ${state.name}.` },
            ]).slice(0, 3).map((blog: any) => (
              <Link
                key={blog.id}
                href={blog.type === 'VIDEO' ? `/inspiration/${blog.slug}` : `/blog/${blog.slug}`}
                className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_16px_rgba(28,26,23,0.06)] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(28,26,23,0.12)] transition-all duration-300 group"
              >
                <div className="relative h-[200px] overflow-hidden">
                  <img src={blog.thumbnail || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80&fm=webp'} alt={blog.title} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500" loading="lazy" />
                  {blog.type === 'VIDEO' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg"><span className="text-[#FF0000] text-lg ml-0.5">?</span></div>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-heading text-lg font-bold text-[#1A1A18] mb-2 line-clamp-2 group-hover:text-[#58bdae] transition-colors">{blog.title}</h3>
                  {blog.excerpt && <p className="text-[13px] text-[#6B6560] font-body line-clamp-2 mb-3">{blog.excerpt}</p>}
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#FF7F50] font-heading">
                    {blog.type === 'VIDEO' ? 'Watch' : 'Read More'} <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* --------------- 10. SOCIAL MEDIA --------------- */}
      <section className="py-10 sm:py-14 px-4 sm:px-6 md:px-12 bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="font-heading text-[clamp(22px,3vw,32px)] font-bold text-[#1A1A18]">
              Join us on <span className="bg-gradient-to-r from-[#E1306C] via-[#F77737] to-[#FCAF45] bg-clip-text text-transparent">Instagram</span> &amp; <span className="text-[#FF0000]">YouTube</span>
            </h3>
            <p className="text-[14px] text-[#6B6560] mt-1">Follow our journey and get inspired for your next adventure in {state.name}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Instagram */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E1306C] via-[#F77737] to-[#FCAF45] flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </div>
                <div>
                  <div className="font-heading text-[15px] font-bold text-[#1A1A18]">@booktheguidecom</div>
                  <div className="text-[12px] text-[#6B6560]">Follow us on Instagram</div>
                </div>
                <a href="https://instagram.com/booktheguidecom" target="_blank" rel="noopener noreferrer" className="ml-auto text-[12px] font-bold text-white bg-gradient-to-r from-[#E1306C] to-[#F77737] px-4 py-2 rounded-full hover:opacity-90 transition-opacity">Follow</a>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {['photo-1506905925346-21bda4d32df4','photo-1585464231875-d9ef1f5ad396','photo-1548013146-72479768bada','photo-1524492412937-b28074a5d7da','photo-1464822759023-fed622ff2c3b','photo-1587474260584-136574528ed5'].map((id, idx) => (
                  <a key={idx} href="https://instagram.com/booktheguidecom" target="_blank" rel="noopener noreferrer" className="aspect-square rounded-lg overflow-hidden group cursor-pointer">
                    <img src={`https://images.unsplash.com/${id}?&fm=webpw=300&q=80`} alt={`${state.name} Instagram ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy" />
                  </a>
                ))}
              </div>
            </div>
            {/* YouTube */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-[#FF0000] flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </div>
                <div>
                  <div className="font-heading text-[15px] font-bold text-[#1A1A18]">Book The Guide</div>
                  <div className="text-[12px] text-[#6B6560]">Subscribe on YouTube</div>
                </div>
                <a href="https://youtube.com/@booktheguidecom" target="_blank" rel="noopener noreferrer" className="ml-auto text-[12px] font-bold text-white bg-[#FF0000] px-4 py-2 rounded-full hover:bg-[#cc0000] transition-colors">Subscribe</a>
              </div>
              <div className="space-y-3">
                {[
                  { title: `Top Hidden Gems in ${state.name}`, views: '12K views', duration: '8:42', thumb: 'photo-1464822759023-fed622ff2c3b' },
                  { title: `Best Time to Visit ${state.name} � Travel Guide`, views: '8.5K views', duration: '12:15', thumb: 'photo-1587474260584-136574528ed5' },
                  { title: `${state.name} Trip with Local Guide`, views: '21K views', duration: '15:30', thumb: 'photo-1506905925346-21bda4d32df4' },
                ].map((video, idx) => (
                  <a key={idx} href="https://youtube.com/@booktheguidecom" target="_blank" rel="noopener noreferrer" className="flex gap-3 group cursor-pointer hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors">
                    <div className="relative w-[140px] h-[80px] rounded-lg overflow-hidden flex-shrink-0">
                      <img src={`https://images.unsplash.com/${video.thumb}?&fm=webpw=400&q=80`} alt={video.title} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center"><span className="text-[#FF0000] text-sm ml-0.5">?</span></div>
                      </div>
                      <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded">{video.duration}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[14px] font-semibold text-[#1A1A18] line-clamp-2 group-hover:text-[#58bdae] transition-colors">{video.title}</h4>
                      <p className="text-[12px] text-[#6B6560] mt-1">{video.views}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --------------- 11. SEO DESCRIPTION --------------- */}
      <WPSeoContentBlock content={wpHub?.stateHubFields?.overviewContent || wpHub?.content} heading={wpHub ? `About ${state.name}` : undefined} />
      {!wpHub?.stateHubFields?.overviewContent && !wpHub?.content && (
        <section className="py-10 sm:py-14 px-4 sm:px-6 md:px-12 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-heading text-[clamp(24px,3vw,32px)] font-bold text-[#1A1A18] mb-6">About {state.name}</h2>
            <div className="text-[#6B6560] font-body leading-relaxed text-[15px] space-y-4"><p>{seoDesc}</p></div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {wpHub?.stateHubFields?.faqItems && wpHub.stateHubFields.faqItems.length > 0 ? (
        <WPFaqSection faqs={wpHub.stateHubFields.faqItems} heading={`Frequently Asked Questions � ${state.name}`} />
      ) : (
        <section className="bg-[#FAF7F2] py-16">
          <div className="max-w-4xl mx-auto px-6 lg:px-16">
            <div className="text-center mb-10">
              <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#58bdae] mb-2 font-body">Got Questions?</p>
              <h2 className="font-heading text-[clamp(20px,4vw,38px)] font-bold text-[#1A1A18] mb-3">Frequently Asked Questions � {state.name}</h2>
            </div>
            <div className="space-y-4">
              {[
                { q: `What is the best time to visit ${state.name}?`, a: `The best time to visit ${state.name} is ${state.bestTimeToVisit}. Weather conditions are ideal for trekking, sightseeing, and outdoor activities during this period.` },
                { q: `How do I book a guide in ${state.name}?`, a: `Simply search for ${state.name} on Book The Guide, browse verified guides and experiences, select your preferred trip or guide, and book instantly online.` },
                { q: `Are the guides in ${state.name} verified?`, a: `Yes! Every guide on Book The Guide goes through a thorough verification process including ID checks, experience verification, and ongoing review monitoring.` },
                { q: `What types of experiences are available in ${state.name}?`, a: `${state.name} offers a variety of experiences. Popular activities include ${state.highlights.slice(0, 3).join(', ')}.` },
                { q: `What are the popular destinations in ${state.name}?`, a: `Popular destinations include ${state.popularCities.join(', ')}.` },
              ].map((faq, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-6 border border-[#EDE8DF] hover:border-[#58bdae]/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#58bdae]/10 flex items-center justify-center flex-shrink-0 mt-0.5"><HelpCircle className="w-4 h-4 text-[#58bdae]" /></div>
                    <div>
                      <h3 className="font-heading text-base font-bold text-[#1A1A18] mb-2">{faq.q}</h3>
                      <p className="text-sm text-[#6B6560] font-body leading-relaxed">{faq.a}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <WPInternalLinksGrid links={wpHub?.stateHubFields?.internalLinks} heading={`Explore More in ${state.name}`} />

      {/* --------------- 12. EXPLORE ALL STATES --------------- */}
      <section className="py-10 sm:py-14 px-4 sm:px-6 md:px-12 bg-[#EDE8DF]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#58bdae] mb-2 font-body">Explore India</p>
            <h2 className="font-heading text-[clamp(20px,4vw,38px)] font-bold leading-[1.1] text-[#1A1A18]">Explore All States</h2>
            <p className="text-[15px] text-[#6B6560] font-body mt-2">Discover experiences across every Indian state</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {allActiveStates.map((s) => (
              <Link key={s.slug} href={`/explore/${s.slug}`} className={`text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-200 font-heading ${s.slug === state.slug ? 'bg-[#58bdae] text-white shadow-[0_4px_14px_rgba(88,189,174,0.35)]' : 'bg-white text-[#1A1A18] border border-[#EDE8DF] hover:border-[#58bdae] hover:bg-[#58bdae] hover:text-white shadow-sm hover:shadow-md'}`}>
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* --------------- 13. CORPORATE BOOKING --------------- */}
      <section className="py-16 px-6 md:px-12 bg-gradient-to-r from-[#58bdae] to-[#4aa99b]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/70 mb-3 font-body">Corporate Experiences</p>
          <h2 className="font-heading text-[clamp(28px,4vw,44px)] font-bold text-white mb-4 leading-tight">Book The Guide for Corporate Booking</h2>
          <p className="text-white/80 font-body text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
            Want to create a team offsite experience beyond leisure resorts? Get in touch for your custom corporate experience in {state.name} with us.
          </p>
          <Link href="/corporate-trip" className="inline-block bg-[#FF7F50] text-white font-bold px-10 py-4 rounded-full hover:bg-[#e5673e] hover:-translate-y-0.5 transition-all shadow-[0_4px_20px_rgba(255,127,80,0.4)] font-heading text-base tracking-wide">
            Contact for Corporate Bookings ?
          </Link>
        </div>
      </section>

      {/* --------------- JSON-LD --------------- */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'TouristDestination',
        name: state.name,
        description: landingDesc,
        touristType: ['Adventure','Cultural','Heritage','Nature'],
        url: `https://www.booktheguide.com/explore/${state.slug}`,
        image: state.heroImage,
        address: { '@type': 'PostalAddress', addressRegion: state.name, addressCountry: 'IN' },
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: `What is the best time to visit ${state.name}?`, acceptedAnswer: { '@type': 'Answer', text: `The best time to visit ${state.name} is ${state.bestTimeToVisit}.` } },
          { '@type': 'Question', name: `How do I book a guide in ${state.name}?`, acceptedAnswer: { '@type': 'Answer', text: `Search for ${state.name} on Book The Guide, browse verified guides, and book instantly online.` } },
          { '@type': 'Question', name: `Are the guides in ${state.name} verified?`, acceptedAnswer: { '@type': 'Answer', text: 'Yes! Every guide on Book The Guide is verified with ID checks, experience verification, and review monitoring.' } },
        ],
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.booktheguide.com' },
          { '@type': 'ListItem', position: 2, name: 'Explore', item: 'https://www.booktheguide.com/explore' },
          { '@type': 'ListItem', position: 3, name: state.name, item: `https://www.booktheguide.com/explore/${state.slug}` },
        ],
      }) }} />
    </main>
  );
}
