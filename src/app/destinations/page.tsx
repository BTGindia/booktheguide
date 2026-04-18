import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { MapPin, Calendar, Users, Star, Search, Sparkles, ArrowRight, ChevronRight, Compass, Heart, TrendingUp, Sun, Snowflake, CloudRain, Leaf, Filter } from 'lucide-react';
import { CATEGORIES_ORDERED } from '@/lib/categories';
import { getAllStates } from '@/lib/states';

export const revalidate = 120;
import { getActiveCategories } from '@/lib/active-packages';
import { PackageCard, type PackageCardData } from '@/components/PackageCard';
import { AiTravelAssistant } from '@/components/ai/AiTravelAssistant';
import { getPageBySlug, wpSeoToMetadata, getPageContent } from '@/lib/wordpress';
import { WPSeoContentBlock, WPFaqSection, WPInternalLinksGrid } from '@/components/wordpress/WPContentBlocks';
import { getUIConfig, getSectionSort, getSectionLimit, getFeaturedIds, applySorting, applyFeaturedPinning } from '@/lib/ui-config';

export async function generateMetadata(): Promise<Metadata> {
  const wpPage = await getPageBySlug('destinations');
  if (wpPage?.seo) {
    return wpSeoToMetadata(wpPage.seo, {
      title: 'Destinations - Explore India\'s Best Travel Spots | Book The Guide',
      description: 'Discover incredible Indian states. Find verified local guides, group trips, heritage walks & adventure experiences.',
      url: 'https://www.booktheguide.com/destinations',
    });
  }
  return {
    title: 'Destinations - Explore India\'s Best Travel Spots | Book The Guide',
    description: 'Discover 7 incredible Indian states: Uttarakhand, Himachal Pradesh, Ladakh, Kashmir, Delhi, Rajasthan & Uttar Pradesh. Find verified local guides, group trips, heritage walks & adventure experiences.',
    keywords: 'India travel destinations, Uttarakhand trips, Himachal Pradesh tours, Ladakh travel, Kashmir packages, Delhi tours, Rajasthan heritage, Uttar Pradesh tourism, local guides India',
    openGraph: {
      title: 'Explore India\'s Best Destinations | Book The Guide',
      description: 'Connect with verified local guides across 7 Indian states. Book treks, heritage walks, group trips & adventure experiences.',
      images: ['/images/og-destinations.jpg'],
    },
  };
}

// Build STATES_DATA dynamically from static state metadata (respects admin-enabled states)
const _allStaticStates = getAllStates();
const _defaultColors = [
  'from-emerald-600 to-teal-700', 'from-blue-600 to-indigo-700', 'from-slate-600 to-slate-800',
  'from-pink-500 to-rose-600', 'from-amber-600 to-orange-700', 'from-yellow-600 to-amber-700',
  'from-purple-600 to-violet-700', 'from-teal-600 to-cyan-700', 'from-red-500 to-rose-700',
];
const STATES_DATA = _allStaticStates.map((s, i) => ({
  name: s.name,
  slug: s.slug,
  tagline: s.tagline,
  icon: s.isNorthIndia ? String.fromCodePoint(0x1F3D4, 0xFE0F) : String.fromCodePoint(0x1F30D),
  season: s.bestTimeToVisit || '',
  color: _defaultColors[i % _defaultColors.length],
}));

// Seasonal recommendations
const SEASONAL_PICKS: Record<string, { states: string[]; activities: string[] }> = {
  'Jan-Feb': { states: ['Rajasthan', 'Delhi', 'Uttar Pradesh'], activities: ['Heritage Walks', 'City Tours', 'Cultural Tours'] },
  'Mar-Apr': { states: ['Uttarakhand', 'Himachal Pradesh', 'Kashmir'], activities: ['Trekking', 'Camping', 'Wildlife'] },
  'May-Jun': { states: ['Ladakh', 'Himachal Pradesh', 'Uttarakhand'], activities: ['High Altitude Treks', 'Paragliding', 'River Rafting'] },
  'Jul-Aug': { states: ['Ladakh'], activities: ['Bike Tours', 'Photography', 'Cultural Immersion'] },
  'Sep-Oct': { states: ['Uttarakhand', 'Himachal Pradesh', 'Kashmir'], activities: ['Trekking', 'Autumn Colors', 'Photography'] },
  'Nov-Dec': { states: ['Rajasthan', 'Delhi', 'Uttar Pradesh', 'Uttarakhand'], activities: ['Heritage', 'Winter Treks', 'Desert Safaris'] },
};

function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month <= 1) return 'Jan-Feb';
  if (month <= 3) return 'Mar-Apr';
  if (month <= 5) return 'May-Jun';
  if (month <= 7) return 'Jul-Aug';
  if (month <= 9) return 'Sep-Oct';
  return 'Nov-Dec';
}

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
    select: { pricePerPerson: true, meetingPoint: true, totalSeats: true, bookedSeats: true, startDate: true },
  },
} as const;

export default async function DestinationsPage() {
  const wp = await getPageContent('destinations');
  const currentSeason = getCurrentSeason();
  const seasonalPick = SEASONAL_PICKS[currentSeason];

  // Fetch all data in parallel
  const [
    states,
    destinations,
    trendingProducts,
    topGuides,
    mostLovedProducts,
    uiConfig,
    activeDbCategories,
  ] = await Promise.all([
    // States with package counts (only enabled states)
    prisma.indianState.findMany({
      where: { isActive: true },
      include: {
        cities: {
          include: {
            destinations: {
              where: { isActive: true },
              include: { _count: { select: { products: { where: { status: 'APPROVED', isActive: true } } } } },
            },
          },
        },
        _count: {
          select: {
            serviceAreas: { where: { guide: { isActive: true, isVerified: true } } },
          },
        },
      },
    }),
    // All destinations with packages
    prisma.destination.findMany({
      where: { isActive: true, products: { some: { status: 'APPROVED', isActive: true } } },
      include: {
        city: { include: { state: { select: { id: true, name: true } } } },
        _count: { select: { products: { where: { status: 'APPROVED', isActive: true } } } },
      },
      orderBy: { products: { _count: 'desc' } },
    }),
    // Trending packages
    prisma.product.findMany({
      where: { isTrending: true, status: 'APPROVED', isActive: true },
      include: productInclude,
      orderBy: { createdAt: 'desc' },
      take: 8,
    }) as any,
    // Top guides per category
    prisma.guideProfile.findMany({
      where: { isActive: true, isVerified: true, averageRating: { gte: 4 } },
      include: {
        user: { select: { name: true, image: true } },
        serviceAreas: { include: { state: { select: { name: true } } } },
        products: {
          where: { status: 'APPROVED', isActive: true },
          take: 1,
          include: {
            fixedDepartures: {
              where: { isActive: true, approvalStatus: 'APPROVED', startDate: { gte: new Date() } },
              orderBy: { startDate: 'asc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { averageRating: 'desc' },
      take: 12,
    }),
    // Most loved (best rated)
    prisma.product.findMany({
      where: { status: 'APPROVED', isActive: true, guide: { averageRating: { gte: 4.5 } } },
      include: productInclude,
      orderBy: { guide: { averageRating: 'desc' } },
      take: 6,
    }) as any,
    getUIConfig('destinations'),
    getActiveCategories().catch(() => []),
  ]);

  // Process state data — only show states that have packages AND are enabled
  const statesWithData = STATES_DATA
    .map((stateInfo) => {
      const dbState = states.find((s) => s.name.toLowerCase() === stateInfo.name.toLowerCase());
      const packageCount = dbState?.cities.reduce((sum, city) => 
        sum + city.destinations.reduce((dSum, dest) => dSum + dest._count.products, 0), 0) || 0;
      const guideCount = dbState?._count.serviceAreas || 0;
      const destCount = dbState?.cities.reduce((sum, city) => sum + city.destinations.length, 0) || 0;
      return { ...stateInfo, packageCount, guideCount, destCount, dbId: dbState?.id, dbIsActive: dbState?.isActive ?? false };
    })
    .filter((s) => s.packageCount > 0 && s.dbIsActive);

  // Group destinations by state
  const destByState = new Map<string, typeof destinations>();
  for (const dest of destinations) {
    const stateName = dest.city.state.name;
    if (!destByState.has(stateName)) destByState.set(stateName, []);
    destByState.get(stateName)!.push(dest);
  }

  // Only show categories that have at least one package
  let displayCategories = CATEGORIES_ORDERED;
  if (activeDbCategories.length > 0) {
    const activeSlugs = new Set(activeDbCategories.map((c: any) => c.slug));
    const filtered = CATEGORIES_ORDERED.filter(cat => activeSlugs.has(cat.slug));
    if (filtered.length > 0) displayCategories = filtered;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ========== HERO SECTION ========== */}
      <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-[#1A1A18] via-[#2A2A28] to-[#1A1A18] overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-[#7A9E7E]/30 blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-[#C8714A]/20 blur-3xl" />
        </div>
        
        <div className="relative z-10 w-full px-6 lg:px-16 py-32">
          <div className="max-w-7xl mx-auto">
            {/* Pre-heading */}
            <p className="text-[#7A9E7E] text-sm font-semibold tracking-[0.2em] uppercase mb-4">
              {wp.plainText('hero_label', 'Explore India with Local Experts')}
            </p>
            
            {/* Main heading */}
            <h1 className="font-heading text-4xl md:text-5xl lg:text-7xl font-bold text-white leading-tight mb-6"
                dangerouslySetInnerHTML={{ __html: wp.text('hero_title', 'Where Will Your <br /><span class="text-[#C8714A]">Journey</span> Begin?') }} />
            
            <p className="text-white/60 text-lg md:text-xl max-w-2xl mb-12">
              {wp.plainText('hero_description', "Discover 7 incredible Indian states through the eyes of verified local guides. From Himalayan peaks to royal palaces, find your perfect adventure.")}
            </p>
            
            {/* Two Options Cards */}
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
              {/* Option 1: Know where to go */}
              <Link 
                href="#explore-states"
                className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-[#7A9E7E]/50 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-[#7A9E7E]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MapPin className="w-7 h-7 text-[#7A9E7E]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">I Know Where I&apos;m Going</h3>
                <p className="text-white/50 text-sm mb-4">
                  Browse by state, explore destinations, and find the perfect guide for your trip.
                </p>
                <span className="inline-flex items-center text-[#7A9E7E] text-sm font-medium group-hover:gap-2 transition-all">
                  Explore States <ArrowRight className="w-4 h-4 ml-1" />
                </span>
              </Link>
              
              {/* Option 2: Open to explore */}
              <Link 
                href="#ai-planner"
                className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-[#C8714A]/50 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-[#C8714A]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-7 h-7 text-[#C8714A]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Inspire Me</h3>
                <p className="text-white/50 text-sm mb-4">
                  Tell us your travel style, and our AI planner will suggest perfect destinations and experiences.
                </p>
                <span className="inline-flex items-center text-[#C8714A] text-sm font-medium group-hover:gap-2 transition-all">
                  Get Suggestions <ArrowRight className="w-4 h-4 ml-1" />
                </span>
              </Link>
            </div>
            
            {/* Quick stats */}
            <div className="flex flex-wrap gap-8 mt-12 pt-8 border-t border-white/10">
              <div>
                <p className="text-3xl font-bold text-white">{statesWithData.reduce((s, st) => s + st.destCount, 0)}+</p>
                <p className="text-white/50 text-sm">Destinations</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{statesWithData.reduce((s, st) => s + st.guideCount, 0)}+</p>
                <p className="text-white/50 text-sm">Verified Guides</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{statesWithData.reduce((s, st) => s + st.packageCount, 0)}+</p>
                <p className="text-white/50 text-sm">Experiences</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">7</p>
                <p className="text-white/50 text-sm">States Covered</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== AI TRAVEL PLANNER ========== */}
      <section id="ai-planner" className="py-16 bg-gradient-to-b from-[#F8F6F3] to-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="inline-flex items-center gap-2 bg-[#C8714A]/10 text-[#C8714A] text-xs font-semibold px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-4 h-4" /> {wp.plainText('ai_badge', 'AI-Powered Planning')}
          </span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#1A1A18] mb-4">
            {wp.plainText('ai_title', 'Not Sure Where to Go?')}
          </h2>
          <p className="text-[#6B6560] text-lg mb-8 max-w-2xl mx-auto">
            {wp.plainText('ai_description', 'Describe your ideal vacation — mountains, beaches, adventure, culture — and our AI Travel Planner will suggest the perfect destinations and experiences for you.')}
          </p>
          <AiTravelAssistant />
        </div>
      </section>

      {/* ========== EXPLORE BY STATE ========== */}
      <section id="explore-states" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-[#7A9E7E] text-sm font-semibold tracking-[0.15em] uppercase mb-2">
                {wp.plainText('states_label', 'Destinations')}
              </p>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#1A1A18]">
                {wp.plainText('states_title', 'Explore by State')}
              </h2>
            </div>
            <Link href="/search" className="hidden md:flex items-center gap-2 text-[#C8714A] font-medium hover:gap-3 transition-all">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {/* State Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {statesWithData.map((state) => (
              <Link
                key={state.slug}
                href={`/explore/${state.slug}`}
                className="group relative rounded-2xl overflow-hidden aspect-[4/5] shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${state.color}`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Content */}
                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                  <span className="text-4xl mb-2 drop-shadow-lg">{state.icon}</span>
                  <h3 className="font-heading text-2xl font-bold text-white mb-1 drop-shadow">
                    {state.name}
                  </h3>
                  <p className="text-white/80 text-sm mb-3">{state.tagline}</p>
                  
                  <div className="flex items-center gap-4 text-white/90 text-xs mb-4">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {state.destCount} places
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {state.guideCount} guides
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/70">
                      Best: {state.season}
                    </span>
                    <span className="bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full group-hover:bg-white group-hover:text-[#1A1A18] transition-colors">
                      {state.packageCount} trips →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FILTER BAR + SEARCH ========== */}
      <section className="py-12 bg-[#1A1A18]">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-heading text-2xl font-bold text-white mb-2">
                {wp.plainText('filter_title', 'Find Your Perfect Trip')}
              </h3>
              <p className="text-white/60">{wp.plainText('filter_subtitle', 'Filter by your preferences and travel style')}</p>
            </div>
            <Link
              href="/search"
              className="inline-flex items-center gap-3 bg-[#C8714A] text-white px-8 py-4 rounded-xl font-medium hover:bg-[#B8614A] transition-colors"
            >
              <Filter className="w-5 h-5" />
              Open Advanced Search
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========== EXPERIENCE TYPES ========== */}
      <section className="py-20 bg-[#F8F6F3]">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <div className="text-center mb-12">
            <p className="text-[#C8714A] text-sm font-semibold tracking-[0.15em] uppercase mb-2">
              {wp.plainText('experience_label', 'Choose Your Style')}
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#1A1A18] mb-4">
              {wp.plainText('experience_title', 'What Kind of Experience?')}
            </h2>
            <p className="text-[#6B6560] max-w-2xl mx-auto">
              {wp.plainText('experience_subtitle', 'Whether you seek adventure, culture, or relaxation — we have the perfect experience waiting for you.')}
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {displayCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/experiences/${cat.urlSlug}`}
                className="group bg-white rounded-2xl p-6 text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-full aspect-square rounded-xl overflow-hidden mb-4">
                  <img src={cat.image} alt={cat.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <h3 className="font-heading text-lg font-bold text-[#1A1A18] mb-1">{cat.label}</h3>
                <p className="text-[#6B6560] text-xs line-clamp-2">{cat.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========== SEASONAL RECOMMENDATIONS ========== */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <div className="flex items-center gap-4 mb-8">
            {currentSeason.includes('Jan') || currentSeason.includes('Feb') || currentSeason.includes('Dec') ? (
              <Snowflake className="w-8 h-8 text-blue-500" />
            ) : currentSeason.includes('Jul') || currentSeason.includes('Aug') ? (
              <CloudRain className="w-8 h-8 text-gray-500" />
            ) : currentSeason.includes('Sep') || currentSeason.includes('Oct') ? (
              <Leaf className="w-8 h-8 text-orange-500" />
            ) : (
              <Sun className="w-8 h-8 text-yellow-500" />
            )}
            <div>
              <p className="text-[#7A9E7E] text-sm font-semibold tracking-[0.15em] uppercase">
                {wp.plainText('seasonal_label', `Perfect for ${currentSeason}`)}
              </p>
              <h2 className="font-heading text-3xl font-bold text-[#1A1A18]">
                {wp.plainText('seasonal_title', 'Where to Go This Season')}
              </h2>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Recommended States */}
            <div className="bg-[#F8F6F3] rounded-2xl p-8">
              <h3 className="font-heading text-xl font-bold text-[#1A1A18] mb-4">Best Destinations Now</h3>
              <div className="space-y-3">
                {seasonalPick.states.map((stateName) => {
                  const state = statesWithData.find((s) => s.name === stateName);
                  return (
                    <Link
                      key={stateName}
                      href={`/explore/${state?.slug || stateName.toLowerCase().replace(/ /g, '-')}`}
                      className="flex items-center justify-between bg-white rounded-xl p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{state?.icon}</span>
                        <div>
                          <p className="font-semibold text-[#1A1A18]">{stateName}</p>
                          <p className="text-xs text-[#6B6560]">{state?.packageCount || 0} experiences</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#C8714A]" />
                    </Link>
                  );
                })}
              </div>
            </div>
            
            {/* Recommended Activities */}
            <div className="bg-[#1A1A18] rounded-2xl p-8">
              <h3 className="font-heading text-xl font-bold text-white mb-4">Top Activities This Season</h3>
              <div className="space-y-3">
                {seasonalPick.activities.map((activity) => (
                  <div
                    key={activity}
                    className="flex items-center gap-3 bg-white/5 rounded-xl p-4"
                  >
                    <Compass className="w-5 h-5 text-[#7A9E7E]" />
                    <span className="text-white">{activity}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/search"
                className="mt-6 inline-flex items-center gap-2 bg-[#C8714A] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#B8614A] transition-colors"
              >
                Find Seasonal Trips <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========== TRENDING EXPERIENCES ========== */}
      {trendingProducts.length > 0 && (
        <section className="py-20 bg-[#F8F6F3]">
          <div className="max-w-7xl mx-auto px-6 lg:px-16">
            <div className="flex items-end justify-between mb-12">
              <div className="flex items-center gap-4">
                <TrendingUp className="w-8 h-8 text-[#C8714A]" />
                <div>
                  <p className="text-[#C8714A] text-sm font-semibold tracking-[0.15em] uppercase">
                    {wp.plainText('trending_label', 'Hot Right Now')}
                  </p>
                  <h2 className="font-heading text-3xl font-bold text-[#1A1A18]">
                    {wp.plainText('trending_title', 'Trending Experiences')}
                  </h2>
                </div>
              </div>
              <Link href="/trending" className="hidden md:flex items-center gap-2 text-[#C8714A] font-medium hover:gap-3 transition-all">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trendingProducts.slice(0, 4).map((p: any) => (
                <PackageCard key={p.id} pkg={toCard(p)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========== MOST LOVED EXPERIENCES ========== */}
      {mostLovedProducts.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-16">
            <div className="flex items-center gap-4 mb-12">
              <Heart className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-red-500 text-sm font-semibold tracking-[0.15em] uppercase">
                  {wp.plainText('loved_label', 'Customer Favorites')}
                </p>
                <h2 className="font-heading text-3xl font-bold text-[#1A1A18]">
                  {wp.plainText('loved_title', 'Most Loved Experiences')}
                </h2>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {mostLovedProducts.map((p: any) => (
                <PackageCard key={p.id} pkg={toCard(p)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========== TOP GUIDES ========== */}
      {topGuides.length > 0 && (
        <section className="py-20 bg-[#1A1A18]">
          <div className="max-w-7xl mx-auto px-6 lg:px-16">
            <div className="text-center mb-12">
              <p className="text-[#7A9E7E] text-sm font-semibold tracking-[0.15em] uppercase mb-2">
                {wp.plainText('guides_label', 'Expert Local Guides')}
              </p>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
                {wp.plainText('guides_title', 'Meet Your Future Guide')}
              </h2>
              <p className="text-white/60 max-w-2xl mx-auto">
                {wp.plainText('guides_subtitle', 'Our verified guides are passionate locals who know their regions inside out.')}
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {topGuides.slice(0, 8).map((guide) => (
                <Link
                  key={guide.id}
                  href={`/guides/${guide.slug}`}
                  className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all text-center"
                >
                  <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 border-2 border-[#7A9E7E]">
                    {guide.user.image ? (
                      <img src={guide.user.image} alt={guide.user.name || ''} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#7A9E7E]/20 flex items-center justify-center text-2xl text-white">
                        {guide.user.name?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-white mb-1">{guide.user.name}</h3>
                  <p className="text-white/50 text-xs mb-2">
                    {guide.serviceAreas?.[0]?.state?.name || 'India'}
                  </p>
                  
                  {guide.averageRating > 0 && (
                    <div className="flex items-center justify-center gap-1 mb-3">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-white text-sm">{guide.averageRating.toFixed(1)}</span>
                      <span className="text-white/40 text-xs">({guide.totalReviews})</span>
                    </div>
                  )}
                  
                  {guide.products?.[0]?.fixedDepartures?.[0] && (
                    <div className="bg-[#C8714A]/20 text-[#C8714A] text-xs px-3 py-1.5 rounded-full inline-block">
                      Next: {new Date(guide.products[0].fixedDepartures[0].startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </div>
                  )}
                </Link>
              ))}
            </div>
            
            <div className="text-center mt-10">
              <Link
                href="/guides"
                className="inline-flex items-center gap-2 bg-[#7A9E7E] text-white px-8 py-4 rounded-xl font-medium hover:bg-[#6A8E6E] transition-colors"
              >
                Browse All Guides <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ========== CTA SECTION ========== */}
      <section className="py-20 bg-gradient-to-br from-[#C8714A] to-[#A85A3A]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
            {wp.plainText('cta_title', 'Ready to Start Your Adventure?')}
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
            {wp.plainText('cta_description', "Whether you're a solo traveler, family, or group — we have the perfect experience waiting for you. Book with verified local guides and create memories that last a lifetime.")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/search"
              className="inline-flex items-center justify-center gap-2 bg-white text-[#C8714A] px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              <Search className="w-5 h-5" /> Browse All Trips
            </Link>
            <Link
              href="/register?role=GUIDE"
              className="inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-colors"
            >
              Become a Guide <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* WordPress-managed content */}
      <WPSeoContentBlock content={wp.seoContentBlock} />
      <WPFaqSection faqs={wp.faqItems} />
      <WPInternalLinksGrid links={wp.internalLinks} heading="Explore More" />
    </div>
  );
}
