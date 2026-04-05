import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Star, ChevronRight, ArrowRight, Calendar, Users, Mountain, Compass, Landmark, HelpCircle, Clock, Sparkles } from 'lucide-react';
import prisma from '@/lib/prisma';
import { getStateBySlug, getAllStateSlugs } from '@/lib/states';
import { CATEGORIES_ORDERED } from '@/lib/categories';
import { getActiveSubCategories, getDisabledCategorySlugs, getActiveStates } from '@/lib/active-packages';
import { type PackageCardData } from '@/components/PackageCard';
import { getStateHub, wpSeoToMetadata, getStateHubContent } from '@/lib/wordpress';
import { WPFaqSection, WPSeoContentBlock, WPInternalLinksGrid } from '@/components/wordpress/WPContentBlocks';
import { getUIConfig, isSectionVisible, getSectionSort, getSectionLimit, getFeaturedIds, applySorting, applyFeaturedPinning } from '@/lib/ui-config';

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

export async function generateStaticParams() {
  return getAllStateSlugs().map((state) => ({ state }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const state = getStateBySlug(params.state);
  if (!state) return { title: 'State Not Found | Book The Guide' };

  const title = `Explore ${state.name} 2026 — Best Guides, Treks, Heritage Walks & Group Trips | Book The Guide`;
  const description = `Discover ${state.name} with verified local guides. ${state.description} Book treks, heritage walks, group trips & adventure guides. ✓ Verified ✓ Reviewed ✓ Instant Booking`;
  const url = `https://www.booktheguide.com/explore/${state.slug}`;

  // Try WordPress SEO first — allows content team to manage titles/descriptions
  const wpHub = await getStateHub(state.slug);
  if (wpHub?.seo) {
    return wpSeoToMetadata(wpHub.seo, { title, description, url, image: state.heroImage });
  }

  return {
    title,
    description,
    keywords: `${state.name} tours, ${state.name} guides, ${state.name} treks, ${state.name} heritage walks, ${state.name} group trips, travel ${state.name}, best time to visit ${state.name}, ${state.name} travel guide 2026, things to do in ${state.name}, book guide ${state.name}`,
    openGraph: {
      title: `Explore ${state.name} — Guides & Trips | Book The Guide`,
      description,
      url,
      images: state.heroImage ? [{ url: state.heroImage, width: 1200, height: 630, alt: `Explore ${state.name}` }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Explore ${state.name} | Book The Guide`,
      description: `Discover ${state.name} with verified local guides. Book treks, walks & trips instantly.`,
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function StateHubPage({ params }: PageProps) {
  const state = getStateBySlug(params.state);
  if (!state) notFound();

  /* Fetch WordPress editorial content (runs in parallel with DB) */
  const [wpHub, wp] = await Promise.all([
    getStateHub(state.slug),
    getStateHubContent(state.slug),
  ]);

  /* Fetch state data from DB + products + cities + guides + blogs + UI config */
  const [dbState, products, cities, guides, blogs, uiConfig] = await Promise.all([
    prisma.indianState.findFirst({
      where: { name: state.name },
      select: { id: true, name: true },
    }),
    prisma.product.findMany({
      where: {
        status: 'APPROVED',
        isActive: true,
        destination: { city: { state: { name: state.name } } },
      },
      include: productInclude,
      orderBy: { createdAt: 'desc' },
      take: 12,
    }),
    // Fetch cities that have packages in this state
    prisma.city.findMany({
      where: {
        state: { name: state.name },
        destinations: {
          some: {
            products: { some: { status: 'APPROVED', isActive: true } },
          },
        },
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.guideProfile.findMany({
      where: {
        isVerified: true,
        user: { isActive: true },
        serviceAreas: { some: { state: { name: state.name } } },
      },
      include: {
        user: { select: { name: true, image: true } },
      },
      orderBy: { averageRating: 'desc' },
      take: 10,
    }),
    prisma.inspirationContent.findMany({
      where: {
        isPublished: true,
        OR: [
          { tags: { hasSome: [state.name, state.slug, state.code] } },
          { destinations: { hasSome: [state.name] } },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        thumbnail: true,
        excerpt: true,
        publishedAt: true,
      },
      orderBy: { publishedAt: 'desc' },
      take: 6,
    }),
    getUIConfig('state-pages-default'),
  ]);

  const sortedProducts = applyFeaturedPinning(
    applySorting(products as any[], getSectionSort(uiConfig, 'popular_experiences')),
    getFeaturedIds(uiConfig, 'popular_experiences')
  ).slice(0, getSectionLimit(uiConfig, 'popular_experiences', 12));
  const cards = sortedProducts.map(toCard);

  /* Category icon map */
  const catIcons: Record<string, React.ReactNode> = {
    TOURIST_GUIDES: <Compass className="w-7 h-7" />,
    GROUP_TRIPS: <Users className="w-7 h-7" />,
    ADVENTURE_GUIDES: <Mountain className="w-7 h-7" />,
    HERITAGE_WALKS: <Landmark className="w-7 h-7" />,
    TRAVEL_WITH_INFLUENCERS: <Star className="w-7 h-7" />,
    OFFBEAT_TRAVEL: <Compass className="w-7 h-7" />,
    TREKKING: <Mountain className="w-7 h-7" />,
  };

  // Auto-detect: only show categories that have packages in this state and are enabled
  const categoriesInState = new Set(
    (products as any[]).map((p: any) => p.packageCategory)
  );
  const disabledSlugs = await getDisabledCategorySlugs();
  const filteredCategories = CATEGORIES_ORDERED.filter(
    (cat) => categoriesInState.has(cat.slug) && !disabledSlugs.has(cat.slug)
  );

  const allActiveStates = await getActiveStates();

  return (
    <main className="bg-btg-cream min-h-screen">
      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative h-[75vh] min-h-[520px] flex flex-col justify-end overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center animate-subtle-zoom"
          style={{ backgroundImage: `url(${state.heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(28,26,23,0.85)] via-[rgba(28,26,23,0.35)] to-transparent" />
        {/* Decorative accent line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF7F50] via-[#58bdae] to-[#FF7F50]" />
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-16 pb-14">
          <p className="text-[12px] font-bold tracking-[0.2em] uppercase text-[#FF7F50] mb-3 font-heading flex items-center gap-2.5">
            <span className="w-8 h-px bg-[#FF7F50] inline-block" />
            {state.isNorthIndia ? 'North India' : 'India'} · {state.code}
          </p>
          <h1 className="font-heading text-[clamp(40px,7vw,76px)] font-bold text-white mb-4 leading-[1.05] tracking-tight">
            Explore <span className="text-[#58bdae]">{state.name}</span>
          </h1>
          <p className="text-lg md:text-xl text-white/75 font-body mb-6 max-w-2xl leading-relaxed">{state.tagline}</p>
          <div className="flex flex-wrap gap-3">
            <span className="text-xs bg-[#FF7F50]/20 backdrop-blur-sm text-white px-4 py-2 rounded-full flex items-center gap-2 border border-[#FF7F50]/30 font-semibold">
              <Calendar className="w-4 h-4 text-[#FF7F50]" /> {state.bestTimeToVisit}
            </span>
            <span className="text-xs bg-[#58bdae]/20 backdrop-blur-sm text-white px-4 py-2 rounded-full flex items-center gap-2 border border-[#58bdae]/30 font-semibold">
              <MapPin className="w-4 h-4 text-[#58bdae]" /> {cities.length || state.popularCities.length}+ Cities
            </span>
            <span className="text-xs bg-white/15 backdrop-blur-sm text-white px-4 py-2 rounded-full flex items-center gap-2 border border-white/20 font-semibold">
              <Users className="w-4 h-4 text-[#58bdae]" /> {guides.length} Verified Guides
            </span>
          </div>
          <Link
            href={`/search?state=${state.slug}`}
            className="inline-block mt-8 bg-[#FF7F50] text-white font-bold px-8 py-3.5 rounded-full hover:bg-[#e5673e] hover:-translate-y-0.5 transition-all shadow-[0_4px_14px_rgba(255,127,80,0.35)] font-heading text-sm tracking-wide"
          >
            Explore All Experiences →
          </Link>
        </div>
      </section>

      {/* ═══════════════ BREADCRUMB ═══════════════ */}
      <div className="max-w-7xl mx-auto px-6 lg:px-16 py-4">
        <nav className="flex items-center gap-2 text-sm text-btg-light-text font-body">
          <Link href="/" className="hover:text-[#58bdae] transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/explore" className="hover:text-[#58bdae] transition-colors">Explore</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-btg-dark font-semibold">{state.name}</span>
        </nav>
      </div>

      {/* ═══════════════ H1 + DESCRIPTION + QUICK INFO ═══════════════ */}
      <section className="max-w-7xl mx-auto px-6 lg:px-16 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-bold text-[#1A1A18] mb-4 leading-tight" dangerouslySetInnerHTML={{ __html: wp.text('discover_title', `Discover ${state.name} with <span class="text-[#58bdae]">Local Experts</span>`) }} />
            <p className="text-[#6B6560] font-body leading-relaxed text-[15px] mb-6">
              {wp.plainText('discover_description', wpHub?.stateHubFields?.heroDescription || state.description)}
            </p>
            <div className="flex flex-wrap gap-2">
              {state.highlights.map((h) => (
                <span key={h} className="bg-[#58bdae]/10 text-[#58bdae] text-xs font-semibold px-3.5 py-1.5 rounded-full font-body border border-[#58bdae]/20">
                  {h}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Info Card */}
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
              <div className="flex items-center gap-3 p-3 bg-[#F5F0E8] rounded-xl">
                <MapPin className="w-5 h-5 text-[#FF7F50] flex-shrink-0" />
                <div>
                  <span className="text-[#6B6560] text-xs">Popular Cities</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {state.popularCities.map((c) => (
                      <span key={c} className="bg-white text-[#1A1A18] text-xs px-2.5 py-0.5 rounded-full border border-[#EDE8DF] font-medium">{c}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#F5F0E8] rounded-xl">
                <Users className="w-5 h-5 text-[#58bdae] flex-shrink-0" />
                <div>
                  <span className="text-[#6B6560] text-xs">Available on BTG</span>
                  <p className="text-[#1A1A18] font-semibold">{cards.length} Experiences · {guides.length} Guides</p>
                </div>
              </div>
            </div>
            <Link
              href={`/search?state=${state.slug}`}
              className="block w-full text-center bg-[#FF7F50] text-white text-sm font-bold py-3.5 rounded-full mt-6 hover:bg-[#e5673e] transition-all shadow-[0_4px_14px_rgba(255,127,80,0.35)] font-heading tracking-wide"
            >
              Search in {state.name}
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ EXPERIENCES TO DO IN [STATE] ═══════════════ */}
      <section className="py-14 px-6 md:px-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#FF7F50] mb-2 font-body">{wp.plainText('experiences_label', 'Explore Categories')}</p>
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-heading text-[clamp(26px,3.5vw,38px)] font-bold leading-[1.1] text-[#1A1A18]" dangerouslySetInnerHTML={{ __html: wp.text('experiences_title', `Experiences to Do in <span class="text-[#58bdae]">${state.name}</span>`) }} />
              <p className="text-[15px] text-[#6B6560] font-medium mt-2 font-body">{wp.plainText('experiences_subtitle', 'Choose your preferred type of experience')}</p>
            </div>
            <Link
              href={`/search?state=${state.slug}`}
              className="hidden sm:inline-block text-sm font-bold text-white bg-[#FF7F50] px-7 py-3 rounded-full hover:bg-[#e5673e] hover:-translate-y-0.5 transition-all shadow-[0_4px_14px_rgba(255,127,80,0.35)] tracking-wide font-heading"
            >
              Explore All →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {filteredCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/search?state=${state.slug}&category=${cat.urlSlug}`}
                className="group bg-[#F5F0E8] rounded-2xl overflow-hidden border border-[#EDE8DF] hover:border-[#58bdae] hover:shadow-[0_8px_30px_rgba(88,189,174,0.15)] hover:-translate-y-1 transition-all duration-300"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={cat.image} alt={cat.label} className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500" />
                </div>
                <div className="p-4 text-center">
                  <div className="text-[#58bdae] mb-2 flex justify-center">
                    {catIcons[cat.slug] || <Compass className="w-7 h-7" />}
                  </div>
                  <h3 className="font-heading text-[16px] font-bold text-[#1A1A18] mb-1 group-hover:text-[#58bdae] transition-colors">
                    {cat.label}
                  </h3>
                  <p className="text-[12px] text-[#6B6560] font-body line-clamp-2">{cat.description}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="sm:hidden text-center mt-6">
            <Link
              href={`/search?state=${state.slug}`}
              className="inline-block text-sm font-bold text-white bg-[#FF7F50] px-7 py-3 rounded-full hover:bg-[#e5673e] transition-all shadow-[0_4px_14px_rgba(255,127,80,0.35)] font-heading"
            >
              Explore All →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ TOP DESTINATIONS IN [STATE] — City Tags ═══════════════ */}
      {cities.length > 0 && (
        <section className="py-14 px-6 md:px-12 bg-[#EDE8DF]">
          <div className="max-w-7xl mx-auto">
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#58bdae] mb-2 font-body">{wp.plainText('destinations_label', 'Top Destinations')}</p>
            <h2 className="font-heading text-[clamp(26px,3.5vw,38px)] font-bold leading-[1.1] text-[#1A1A18] mb-3" dangerouslySetInnerHTML={{ __html: wp.text('destinations_title', `Top Destinations in <span class="text-[#58bdae]">${state.name}</span>`) }} />
            <p className="text-[15px] text-[#6B6560] font-body mb-8">
              {wp.plainText('destinations_subtitle', 'Explore cities where guides are hosting experiences. Click a city to see all trips there.')}
            </p>
            <div className="flex flex-wrap gap-3">
              {cities.map((city: any) => (
                <Link
                  key={city.id}
                  href={`/search?state=${state.slug}&destination=${encodeURIComponent(city.name)}`}
                  className="group bg-white text-[#1A1A18] font-semibold text-sm px-5 py-3 rounded-full border border-[#EDE8DF] hover:border-[#58bdae] hover:bg-[#58bdae] hover:text-white transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2 font-heading"
                >
                  <MapPin className="w-4 h-4 text-[#FF7F50] group-hover:text-white transition-colors" />
                  {city.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════ POPULAR EXPERIENCES — Horizontal Scroll ═══════════════ */}
      {cards.length > 0 && (
        <section className="py-14 px-6 md:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#FF7F50] mb-2 font-body">{wp.plainText('popular_label', 'Most Popular')}</p>
                <h2 className="font-heading text-[clamp(26px,3.5vw,38px)] font-bold leading-[1.1] text-[#1A1A18]" dangerouslySetInnerHTML={{ __html: wp.text('popular_title', `Popular Experiences in <span class="text-[#58bdae]">${state.name}</span>`) }} />
                <p className="text-[15px] text-[#6B6560] font-medium mt-2 font-body">{wp.plainText('popular_subtitle', 'Top-rated trips and experiences by verified guides')}</p>
              </div>
              <Link
                href={`/search?state=${state.slug}&sort=rating`}
                className="hidden sm:inline-block text-sm font-bold text-white bg-[#FF7F50] px-7 py-3 rounded-full hover:bg-[#e5673e] hover:-translate-y-0.5 transition-all shadow-[0_4px_14px_rgba(255,127,80,0.35)] tracking-wide font-heading"
              >
                Explore All →
              </Link>
            </div>

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
                      <div className="w-full h-full bg-gradient-to-br from-[#58bdae]/10 to-[#7A9E7E]/10 flex items-center justify-center"><span className="text-4xl">🏔️</span></div>
                    )}
                    {pkg.seatsLeft !== undefined && pkg.seatsLeft > 0 && (
                      <span className="absolute top-3 left-3 bg-[#FF7F50] text-white text-[11px] font-semibold tracking-[0.1em] px-3 py-1.5 rounded-full uppercase">
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
                      <span className="text-[13px] text-[#6B6560] flex items-center gap-1.5 font-body"><MapPin className="w-3.5 h-3.5" /> {pkg.destinationName}</span>
                      <span className="text-[13px] text-[#6B6560] flex items-center gap-1.5 font-body"><Clock className="w-3.5 h-3.5" /> {pkg.durationDays}D{pkg.durationNights > 0 && `/${pkg.durationNights}N`}</span>
                      <span className="text-[13px] text-[#6B6560] flex items-center gap-1.5 font-body"><Star className="w-3.5 h-3.5 fill-[#E8943A] text-[#E8943A]" /> {pkg.guideRating.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-[20px] font-semibold text-[#1A1A18] font-heading">
                        {pkg.price ? `₹${pkg.price.toLocaleString('en-IN')}` : 'On Request'} <small className="text-[12px] text-[#6B6560] font-light font-body">/person</small>
                      </div>
                      <span className="text-[13px] font-semibold text-white bg-[#FF7F50] px-4 py-2 rounded-full hover:bg-[#e5673e] transition-colors font-heading shadow-sm">
                        Book Now
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="sm:hidden text-center mt-6">
              <Link
                href={`/search?state=${state.slug}&sort=rating`}
                className="inline-block text-sm font-bold text-white bg-[#FF7F50] px-7 py-3 rounded-full hover:bg-[#e5673e] transition-all font-heading"
              >
                Explore All →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════ FIND THE TOP GUIDES — Horizontal Scroll ═══════════════ */}
      {guides.length > 0 && (
        <section className="py-14 px-6 md:px-12 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#58bdae] mb-2 font-body">{wp.plainText('guides_label', 'Verified Experts')}</p>
                <h2 className="font-heading text-[clamp(26px,3.5vw,38px)] font-bold leading-[1.1] text-[#1A1A18]" dangerouslySetInnerHTML={{ __html: wp.text('guides_title', `Find the Top Guides in <span class="text-[#58bdae]">${state.name}</span>`) }} />
                <p className="text-[15px] text-[#6B6560] font-medium mt-2 font-body">{wp.plainText('guides_subtitle', 'Discover verified local experts ready to guide your adventure')}</p>
              </div>
              <Link
                href={`/search?state=${state.slug}&view=guides`}
                className="hidden sm:inline-block text-sm font-bold text-white bg-[#FF7F50] px-7 py-3 rounded-full hover:bg-[#e5673e] hover:-translate-y-0.5 transition-all shadow-[0_4px_14px_rgba(255,127,80,0.35)] tracking-wide font-heading"
              >
                Explore All Guides →
              </Link>
            </div>

            <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
              {guides.map((guide: any) => (
                <Link
                  key={guide.id}
                  href={`/guides/${guide.slug || guide.id}`}
                  className="flex-shrink-0 w-[280px] rounded-2xl overflow-hidden bg-[#F5F0E8] border border-[#EDE8DF] hover:border-[#58bdae] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(88,189,174,0.15)] transition-all duration-300 snap-start group"
                >
                  <div className="p-6 text-center">
                    {/* Guide Photo */}
                    <div className="w-20 h-20 rounded-full mx-auto mb-4 overflow-hidden border-3 border-[#58bdae]/30">
                      {guide.user.image ? (
                        <img src={guide.user.image} alt={guide.user.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#58bdae] to-[#4aa99b] flex items-center justify-center text-white font-heading font-bold text-2xl">
                          {(guide.user.name || 'G').charAt(0)}
                        </div>
                      )}
                    </div>
                    <h3 className="font-heading text-lg font-bold text-[#1A1A18] mb-1 group-hover:text-[#58bdae] transition-colors">
                      {guide.user.name}
                    </h3>
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <div className="flex items-center gap-1 text-sm text-[#E8943A] font-semibold">
                        <Star className="w-4 h-4 fill-[#E8943A] text-[#E8943A]" />
                        {guide.averageRating.toFixed(1)}
                      </div>
                      <span className="text-[#6B6560] text-xs">·</span>
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
                          <span key={spec} className="text-[10px] bg-[#58bdae]/10 text-[#58bdae] px-2.5 py-1 rounded-full font-semibold font-body">
                            {spec}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            <div className="sm:hidden text-center mt-6">
              <Link
                href={`/search?state=${state.slug}&view=guides`}
                className="inline-block text-sm font-bold text-white bg-[#FF7F50] px-7 py-3 rounded-full hover:bg-[#e5673e] transition-all font-heading"
              >
                Explore All Guides →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════ CORNERSTONE BLOG SECTION — 2 Adjacent Cards ═══════════════ */}
      <section className="py-14 px-6 md:px-12 bg-[#F5F0E8]">
        <div className="max-w-7xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#FF7F50] mb-2 font-body">{wp.plainText('blog_label', 'Travel Stories')}</p>
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-heading text-[clamp(26px,3.5vw,38px)] font-bold leading-[1.1] text-[#1A1A18]" dangerouslySetInnerHTML={{ __html: wp.text('blog_title', `${state.name} <span class="text-[#58bdae]">Travel Blog</span>`) }} />
              <p className="text-[15px] text-[#6B6560] font-medium mt-2 font-body">{wp.plainText('blog_subtitle', `Itineraries, tips, and insider guides for ${state.name}`)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Blog Card 1 */}
            {(blogs.length > 0 ? [blogs[0]] : [{ id: 'dummy-1', slug: state.slug, title: `Best Places to Visit in ${state.name} — A Complete Travel Guide`, thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80' }]).map((blog: any) => (
              <Link
                key={blog.id}
                href={`/blog/${blog.slug}`}
                className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_16px_rgba(28,26,23,0.06)] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(28,26,23,0.12)] transition-all duration-300 group"
              >
                <div className="relative h-[220px] overflow-hidden">
                  <img
                    src={blog.thumbnail || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80'}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-heading text-lg font-bold text-[#1A1A18] mb-3 line-clamp-2 group-hover:text-[#58bdae] transition-colors">{blog.title}</h3>
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#FF7F50] font-heading">
                    Read More <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
            {/* Blog Card 2 */}
            {(blogs.length > 1 ? [blogs[1]] : [{ id: 'dummy-2', slug: state.slug, title: `Top ${state.highlights[0] || 'Experiences'} in ${state.name} — What You Must Not Miss`, thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80' }]).map((blog: any) => (
              <Link
                key={blog.id}
                href={`/blog/${blog.slug}`}
                className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_16px_rgba(28,26,23,0.06)] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(28,26,23,0.12)] transition-all duration-300 group"
              >
                <div className="relative h-[220px] overflow-hidden">
                  <img
                    src={blog.thumbnail || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80'}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-heading text-lg font-bold text-[#1A1A18] mb-3 line-clamp-2 group-hover:text-[#58bdae] transition-colors">{blog.title}</h3>
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#FF7F50] font-heading">
                    Read More <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ INSTAGRAM & YOUTUBE SECTION — Gallery Format ═══════════════ */}
      <section className="py-14 px-6 md:px-12 bg-btg-cream">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="font-heading text-[clamp(22px,3vw,32px)] font-bold text-[#1A1A18]" dangerouslySetInnerHTML={{ __html: wp.text('social_title', `Join us on <span class="bg-gradient-to-r from-[#E1306C] via-[#F77737] to-[#FCAF45] bg-clip-text text-transparent">Instagram</span> &amp; <span class="text-[#FF0000]">YouTube</span>`) }} />
            <p className="text-[14px] text-[#6B6560] mt-1">{wp.plainText('social_subtitle', `Follow our journey and get inspired for your next adventure in ${state.name}`)}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Instagram Gallery */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E1306C] via-[#F77737] to-[#FCAF45] flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </div>
                <div>
                  <div className="font-heading text-[15px] font-bold text-[#1A1A18]">@booktheguidecom</div>
                  <div className="text-[12px] text-[#6B6560]">Follow us on Instagram</div>
                </div>
                <a href="https://instagram.com/booktheguidecom" target="_blank" rel="noopener noreferrer" className="ml-auto text-[12px] font-bold text-white bg-gradient-to-r from-[#E1306C] to-[#F77737] px-4 py-2 rounded-full hover:opacity-90 transition-opacity">
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
                  <a key={idx} href="https://instagram.com/booktheguidecom" target="_blank" rel="noopener noreferrer" className="aspect-square rounded-lg overflow-hidden group cursor-pointer">
                    <img src={src} alt={`${state.name} Instagram ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  </a>
                ))}
              </div>
            </div>

            {/* YouTube Gallery */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-[#FF0000] flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </div>
                <div>
                  <div className="font-heading text-[15px] font-bold text-[#1A1A18]">Book The Guide</div>
                  <div className="text-[12px] text-[#6B6560]">Subscribe on YouTube</div>
                </div>
                <a href="https://youtube.com/@booktheguidecom" target="_blank" rel="noopener noreferrer" className="ml-auto text-[12px] font-bold text-white bg-[#FF0000] px-4 py-2 rounded-full hover:bg-[#cc0000] transition-colors">
                  Subscribe
                </a>
              </div>
              <div className="space-y-3">
                {[
                  { title: `Top Hidden Gems in ${state.name}`, views: '12K views', duration: '8:42', thumb: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80' },
                  { title: `Best Time to Visit ${state.name} — Travel Guide`, views: '8.5K views', duration: '12:15', thumb: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&q=80' },
                  { title: `${state.name} Trip with Local Guide`, views: '21K views', duration: '15:30', thumb: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80' },
                ].map((video, idx) => (
                  <a key={idx} href="https://youtube.com/@booktheguidecom" target="_blank" rel="noopener noreferrer" className="flex gap-3 group cursor-pointer hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors">
                    <div className="relative w-[140px] h-[80px] rounded-lg overflow-hidden flex-shrink-0">
                      <img src={video.thumb} alt={video.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                          <span className="text-[#FF0000] text-sm ml-0.5">▶</span>
                        </div>
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

      {/* ═══════════════ WORDPRESS EDITORIAL CONTENT ═══════════════ */}
      {/* SEO content block managed from WordPress CMS */}
      <WPSeoContentBlock
        content={wpHub?.stateHubFields?.overviewContent || wpHub?.content}
        heading={wpHub ? `About ${state.name}` : undefined}
      />

      {/* WordPress-managed FAQ section (with FAQPage schema auto-injected) */}
      {wpHub?.stateHubFields?.faqItems && wpHub.stateHubFields.faqItems.length > 0 ? (
        <WPFaqSection
          faqs={wpHub.stateHubFields.faqItems}
          heading={`Frequently Asked Questions — ${state.name}`}
        />
      ) : (
      /* ═══════════════ FAQ SECTION (Hardcoded Fallback) ═══════════════ */
      <section className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-6 lg:px-16">
          <div className="text-center mb-10">
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#58bdae] mb-2 font-body">{wp.plainText('faq_label', 'Got Questions?')}</p>
            <h2 className="font-heading text-[clamp(26px,3.5vw,38px)] font-bold text-[#1A1A18] mb-3">
              {wp.plainText('faq_title', `Frequently Asked Questions — ${state.name}`)}
            </h2>
            <p className="text-[#6B6560] font-body">
              {wp.plainText('faq_subtitle', `Everything you need to know about travelling in ${state.name} with Book The Guide.`)}
            </p>
          </div>
          <div className="space-y-4">
            {[
              { q: `What is the best time to visit ${state.name}?`, a: `The best time to visit ${state.name} is ${state.bestTimeToVisit}. Weather conditions are ideal for trekking, sightseeing, and outdoor activities during this period.` },
              { q: `How do I book a guide in ${state.name}?`, a: `Simply search for ${state.name} on Book The Guide, browse verified guides and experiences, select your preferred trip or guide, and book instantly online. You can also request a custom itinerary.` },
              { q: `Are the guides in ${state.name} verified?`, a: `Yes! Every guide on Book The Guide goes through a thorough verification process including ID checks, experience verification, and ongoing review monitoring. Look for the ✓ Verified badge.` },
              { q: `What types of experiences are available in ${state.name}?`, a: `${state.name} offers Tourist Guides, Group Trips, Adventure Guides, Heritage Walks, and Travel with Influencers. Popular activities include ${state.highlights.slice(0, 3).join(', ')}.` },
              { q: `What are the popular destinations in ${state.name}?`, a: `Popular cities and destinations in ${state.name} include ${state.popularCities.join(', ')}. Each offers unique experiences from cultural tours to adventure activities.` },
              { q: `Can I cancel my booking in ${state.name}?`, a: `Yes, each guide has their own cancellation policy displayed during booking. Fixed departures cancelled 7+ days before are eligible for full refunds. Check specific terms on each listing.` },
            ].map((faq, idx) => (
              <div key={idx} className="bg-[#F5F0E8] rounded-2xl p-6 border border-[#EDE8DF] hover:border-[#58bdae]/30 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#58bdae]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <HelpCircle className="w-4 h-4 text-[#58bdae]" />
                  </div>
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

      {/* ═══════════════ WP INTERNAL LINKS (SEO interlinking from CMS) ═══════════════ */}
      <WPInternalLinksGrid
        links={wpHub?.stateHubFields?.internalLinks}
        heading={`Explore More in ${state.name}`}
      />

      {/* ═══════════════ ALL STATES — Tags ═══════════════ */}
      <section className="py-14 px-6 md:px-12 bg-[#EDE8DF]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#58bdae] mb-2 font-body">{wp.plainText('all_states_label', 'Explore India')}</p>
            <h2 className="font-heading text-[clamp(26px,3.5vw,38px)] font-bold leading-[1.1] text-[#1A1A18]">
              {wp.plainText('all_states_title', 'All States')}
            </h2>
            <p className="text-[15px] text-[#6B6560] font-body mt-2">{wp.plainText('all_states_subtitle', 'Discover experiences across every Indian state')}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {allActiveStates.map((s) => (
              <Link
                key={s.slug}
                href={`/explore/${s.slug}`}
                className={`text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-200 font-heading ${
                  s.slug === state.slug
                    ? 'bg-[#58bdae] text-white shadow-[0_4px_14px_rgba(88,189,174,0.35)]'
                    : 'bg-white text-[#1A1A18] border border-[#EDE8DF] hover:border-[#58bdae] hover:bg-[#58bdae] hover:text-white shadow-sm hover:shadow-md'
                }`}
              >
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ CORPORATE BOOKING CTA ═══════════════ */}
      <section className="py-16 px-6 md:px-12 bg-gradient-to-r from-[#58bdae] to-[#4aa99b]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/70 mb-3 font-body">{wp.plainText('cta_label', 'Corporate Experiences')}</p>
          <h2 className="font-heading text-[clamp(28px,4vw,44px)] font-bold text-white mb-4 leading-tight" dangerouslySetInnerHTML={{ __html: wp.text('cta_title', 'Book The Guide for Corporate Booking') }} />
          <p className="text-white/80 font-body text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
            {wp.plainText('cta_description', 'Want to create a team offsite experience beyond leisure resorts? Get in touch for your custom corporate experience with us.')}
          </p>
          <Link
            href="/corporate-trip"
            className="inline-block bg-[#FF7F50] text-white font-bold px-10 py-4 rounded-full hover:bg-[#e5673e] hover:-translate-y-0.5 transition-all shadow-[0_4px_20px_rgba(255,127,80,0.4)] font-heading text-base tracking-wide"
          >
            Contact for Corporate Bookings →
          </Link>
        </div>
      </section>

      {/* ═══════════════ JSON-LD: TouristDestination + FAQPage ═══════════════ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'TouristDestination',
            name: state.name,
            description: state.description,
            touristType: ['Adventure', 'Cultural', 'Heritage', 'Nature'],
            url: `https://www.booktheguide.com/explore/${state.slug}`,
            image: state.heroImage,
            address: {
              '@type': 'PostalAddress',
              addressRegion: state.name,
              addressCountry: 'IN',
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
              { '@type': 'Question', name: `What is the best time to visit ${state.name}?`, acceptedAnswer: { '@type': 'Answer', text: `The best time to visit ${state.name} is ${state.bestTimeToVisit}.` } },
              { '@type': 'Question', name: `How do I book a guide in ${state.name}?`, acceptedAnswer: { '@type': 'Answer', text: `Search for ${state.name} on Book The Guide, browse verified guides, and book instantly online.` } },
              { '@type': 'Question', name: `Are the guides in ${state.name} verified?`, acceptedAnswer: { '@type': 'Answer', text: 'Yes! Every guide on Book The Guide is verified with ID checks, experience verification, and review monitoring.' } },
              { '@type': 'Question', name: `What types of experiences are available in ${state.name}?`, acceptedAnswer: { '@type': 'Answer', text: `${state.name} offers Tourist Guides, Group Trips, Adventure Guides, Heritage Walks, and Travel with Influencers.` } },
              { '@type': 'Question', name: `What are the popular destinations in ${state.name}?`, acceptedAnswer: { '@type': 'Answer', text: `Popular destinations include ${state.popularCities.join(', ')}.` } },
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
            ],
          }),
        }}
      />
    </main>
  );
}
