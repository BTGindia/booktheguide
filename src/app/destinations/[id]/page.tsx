import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { MapPin, Star, ArrowRight, ChevronRight, Sparkles, Mountain, Camera, Filter, Calendar } from 'lucide-react';
import { CATEGORIES_ORDERED } from '@/lib/categories';
import { getDisabledCategorySlugs } from '@/lib/active-packages';
import { PackageCard, type PackageCardData } from '@/components/PackageCard';
import { AiTravelAssistant } from '@/components/ai/AiTravelAssistant';

interface PageProps {
  params: { id: string };
}

// Known state slugs for routing
const STATE_SLUGS: Record<string, string> = {
  'uttarakhand': 'Uttarakhand',
  'himachal-pradesh': 'Himachal Pradesh', 
  'ladakh': 'Ladakh',
  'kashmir': 'Kashmir',
  'delhi': 'Delhi',
  'rajasthan': 'Rajasthan',
  'uttar-pradesh': 'Uttar Pradesh',
};

// Check if the id is a UUID (destination) or a state slug
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // Check if this is a state slug
  if (STATE_SLUGS[params.id]) {
    const stateName = STATE_SLUGS[params.id];
    return {
      title: `${stateName} - Destinations & Tours | Book The Guide`,
      description: `Explore destinations in ${stateName} with verified local guides. Find treks, tours, and adventures across ${stateName}.`,
      keywords: `${stateName} tours, ${stateName} guides, ${stateName} travel, destinations in ${stateName}`,
      openGraph: {
        title: `Explore ${stateName} | Book The Guide`,
        description: `Discover amazing destinations in ${stateName} with local experts`,
      },
    };
  }

  // Otherwise, treat as destination ID
  const destination = await prisma.destination.findUnique({
    where: { id: params.id },
    include: { city: { include: { state: { select: { name: true } } } } },
  });
  
  if (!destination) return { title: 'Destination Not Found' };
  
  return {
    title: `${destination.name} - Tours, Guides & Experiences | Book The Guide`,
    description: destination.description || `Explore ${destination.name} with verified local guides. Find treks, tours, and adventures.`,
    keywords: `${destination.name} tours, ${destination.name} guides, ${destination.city.state.name} travel`,
    openGraph: {
      title: `Explore ${destination.name} | Book The Guide`,
      description: destination.description || `Discover ${destination.name} with local experts`,
    },
  };
}

export default async function DestinationDetailPage({ params }: PageProps) {
  // Check if this is a state slug
  if (STATE_SLUGS[params.id]) {
    return <StateDestinationsPage stateSlug={params.id} stateName={STATE_SLUGS[params.id]} />;
  }

  // Fetch destination with all related data
  const destination = await prisma.destination.findUnique({
    where: { id: params.id, isActive: true },
    include: {
      city: { include: { state: { select: { id: true, name: true } } } },
    },
  });

  if (!destination) notFound();

  // Fetch all related data in parallel
  const [products, topGuides, upcomingDepartures] = await Promise.all([
    // All products for this destination
    prisma.product.findMany({
      where: {
        destinationId: params.id,
        status: 'APPROVED',
        isActive: true,
      },
      include: {
        destination: { include: { city: { include: { state: { select: { name: true } } } } } },
        guide: { include: { user: { select: { name: true, image: true } } } },
        fixedDepartures: {
          where: { isActive: true, approvalStatus: 'APPROVED', startDate: { gte: new Date() } },
          orderBy: { pricePerPerson: 'asc' as const },
          take: 1,
          select: { pricePerPerson: true, meetingPoint: true, totalSeats: true, bookedSeats: true, startDate: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }) as any,
    // Top guides for this destination
    prisma.guideProfile.findMany({
      where: {
        isActive: true,
        isVerified: true,
        products: { some: { destinationId: params.id, status: 'APPROVED', isActive: true } },
      },
      include: {
        user: { select: { name: true, image: true } },
      },
      orderBy: { averageRating: 'desc' },
      take: 6,
    }),
    // Upcoming departures
    prisma.fixedDeparture.findMany({
      where: {
        isActive: true,
        approvalStatus: 'APPROVED',
        startDate: { gte: new Date() },
        product: { destinationId: params.id, status: 'APPROVED', isActive: true },
      },
      include: {
        product: {
          include: {
            destination: { select: { name: true } },
            guide: { include: { user: { select: { name: true } } } },
          },
        },
      },
      orderBy: { startDate: 'asc' },
      take: 6,
    }),
  ]);

  // Group products by category
  const productsByCategory: Record<string, typeof products> = {};
  for (const p of products) {
    const cat = p.packageCategory || 'TOURIST_GUIDES';
    if (!productsByCategory[cat]) productsByCategory[cat] = [];
    productsByCategory[cat].push(p);
  }

  const disabledSlugs = await getDisabledCategorySlugs();
  const activeCategories = CATEGORIES_ORDERED.filter(c => !disabledSlugs.has(c.slug));
  const bestMonthsArray = destination.bestMonths || [];

  return (
    <div className="min-h-screen bg-white">
      {/* ========== HERO SECTION ========== */}
      <section className="relative min-h-[60vh] flex items-end overflow-hidden">
        {/* Background Image */}
        {destination.coverImage ? (
          <img
            src={destination.coverImage}
            alt={destination.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A18] via-[#2A2A28] to-[#1A1A18]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A18] via-[#1A1A18]/50 to-transparent" />
        
        <div className="relative z-10 w-full px-6 lg:px-16 pb-16 pt-32">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-white/60 mb-6">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight className="w-4 h-4" />
              <Link href="/explore" className="hover:text-white transition-colors">Explore</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white">{destination.name}</span>
            </nav>
            
            {/* Main heading */}
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
              {destination.name}
            </h1>
            
            <div className="flex items-center gap-4 text-white/80 mb-6">
              <span className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#58bdae]" />
                {destination.city.name}, {destination.city.state.name}
              </span>
              {destination.altitude && (
                <span className="flex items-center gap-2">
                  <Mountain className="w-5 h-5 text-[#58bdae]" />
                  {destination.altitude}
                </span>
              )}
            </div>
            
            {destination.description && (
              <p className="text-white/70 text-lg max-w-3xl mb-8">
                {destination.description}
              </p>
            )}
            
            {/* Quick stats */}
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/10 backdrop-blur-sm px-5 py-3 rounded-xl">
                <p className="text-2xl font-bold text-white">{products.length}</p>
                <p className="text-white/60 text-sm">Experiences</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-5 py-3 rounded-xl">
                <p className="text-2xl font-bold text-white">{topGuides.length}</p>
                <p className="text-white/60 text-sm">Local Guides</p>
              </div>
              {bestMonthsArray.length > 0 && (
                <div className="bg-white/10 backdrop-blur-sm px-5 py-3 rounded-xl">
                  <p className="text-sm font-medium text-white">Best Months</p>
                  <p className="text-[#58bdae] text-sm">{bestMonthsArray.slice(0, 3).join(', ')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========== EXPERIENCE BY CATEGORY ========== */}
      <section className="py-20 bg-btg-cream">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <div className="text-center mb-12">
            <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#58bdae] mb-3">
              Explore by Category
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#1A1A18]">
              What Would You Like to Do?
            </h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {activeCategories.map((cat) => {
              const count = productsByCategory[cat.slug]?.length || 0;
              return (
                <Link
                  key={cat.slug}
                  href={`/search?destination=${encodeURIComponent(destination.name)}&category=${cat.slug}`}
                  className={`group bg-white rounded-2xl p-5 text-center hover:shadow-xl transition-all border border-btg-dark/[0.06] ${count > 0 ? 'hover:-translate-y-1 hover:border-[#58bdae]' : 'opacity-50'}`}
                >
                  <div className="w-full aspect-square rounded-xl overflow-hidden mb-4">
                    <img src={cat.image} alt={cat.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <h3 className="font-heading text-sm font-bold text-[#1A1A18] mb-1">{cat.label}</h3>
                  <p className="text-[#58bdae] text-xs font-medium">{count} package{count !== 1 ? 's' : ''}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========== ALL PACKAGES ========== */}
      {products.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-16">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#58bdae] mb-3">
                  Tours & Adventures
                </p>
                <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#1A1A18]">
                  Packages in {destination.name}
                </h2>
              </div>
              <Link href={`/search?destination=${encodeURIComponent(destination.name)}`} className="hidden md:flex items-center gap-2 text-[#58bdae] font-medium hover:text-btg-cta transition-colors">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.slice(0, 8).map((p: any) => (
                <PackageCard key={p.id} pkg={toCard(p)} />
              ))}
            </div>
            
            {products.length > 8 && (
              <div className="text-center mt-10">
                <Link href={`/search?destination=${encodeURIComponent(destination.name)}`} className="inline-block text-sm font-bold text-white bg-btg-cta px-8 py-3.5 rounded-full hover:bg-btg-cta-hover hover:-translate-y-0.5 transition-all tracking-wide">
                  View All {products.length} Packages →
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ========== UPCOMING DEPARTURES ========== */}
      {upcomingDepartures.length > 0 && (
        <section className="py-20 bg-btg-dark">
          <div className="max-w-7xl mx-auto px-6 lg:px-16">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#58bdae] mb-3">
                  Book Now
                </p>
                <h2 className="font-heading text-3xl md:text-4xl font-bold text-white">
                  Upcoming Departures
                </h2>
              </div>
              <Link href="/upcoming-trips" className="hidden md:flex items-center gap-2 text-[#58bdae] font-medium hover:gap-3 transition-all">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingDepartures.map((dep) => (
                <Link
                  key={dep.id}
                  href={`/trips/${dep.product.slug}`}
                  className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-[#58bdae]/50 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="bg-[#58bdae]/20 text-[#58bdae] text-xs font-medium px-3 py-1 rounded-full">
                      {new Date(dep.startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    {dep.totalSeats - (dep.bookedSeats || 0) <= 5 && (
                      <span className="bg-btg-cta/20 text-btg-cta text-xs font-medium px-3 py-1 rounded-full">
                        {dep.totalSeats - (dep.bookedSeats || 0)} seats left
                      </span>
                    )}
                  </div>
                  
                  <h3 className="font-heading text-lg font-bold text-white mb-2 group-hover:text-[#58bdae] transition-colors line-clamp-2">
                    {dep.product.title}
                  </h3>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-white/50 text-sm">
                      by {dep.product.guide.user.name}
                    </div>
                    <div className="text-[#58bdae] font-bold">
                      ₹{dep.pricePerPerson.toLocaleString('en-IN')}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========== LOCAL GUIDES ========== */}
      {topGuides.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-16">
            <div className="text-center mb-12">
              <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#58bdae] mb-3">
                Expert Guides
              </p>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#1A1A18]">
                Meet Our Guides in {destination.name}
              </h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {topGuides.map((guide) => (
                <Link
                  key={guide.id}
                  href={`/guides/${guide.slug}`}
                  className="group text-center"
                >
                  <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-4 border-[#58bdae]/20 group-hover:border-[#58bdae] transition-colors mb-3">
                    {guide.user.image ? (
                      <img src={guide.user.image} alt={guide.user.name || ''} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-btg-cream flex items-center justify-center text-xl text-[#58bdae] font-bold">
                        {guide.user.name?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  
                  <h3 className="font-medium text-[#1A1A18] text-sm group-hover:text-[#58bdae] transition-colors">
                    {guide.user.name}
                  </h3>
                  
                  {guide.averageRating > 0 && (
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                      <span className="text-[#1A1A18] text-xs">{guide.averageRating.toFixed(1)}</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========== AI TRAVEL PLANNER ========== */}
      <section className="py-20 bg-gradient-to-b from-btg-cream to-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="inline-flex items-center gap-2 bg-[#58bdae]/10 text-[#58bdae] text-xs font-semibold px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-4 h-4" /> AI Travel Assistant
          </span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#1A1A18] mb-4">
            Plan Your {destination.name} Trip
          </h2>
          <p className="text-btg-mid text-lg mb-8">
            Tell us what you&apos;re looking for and our AI will find the perfect experiences for you.
          </p>
          <AiTravelAssistant />
        </div>
      </section>

      {/* ========== PHOTO GALLERY ========== */}
      {destination.images && destination.images.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-16">
            <div className="flex items-center gap-3 mb-12">
              <Camera className="w-6 h-6 text-[#58bdae]" />
              <h2 className="font-heading text-2xl font-bold text-[#1A1A18]">
                Photo Gallery
              </h2>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {destination.images.slice(0, 8).map((img, idx) => (
                <div key={idx} className="rounded-xl overflow-hidden aspect-square group cursor-pointer">
                  <img src={img} alt={`${destination.name} gallery ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// ========== STATE DESTINATIONS PAGE COMPONENT ==========
async function StateDestinationsPage({ stateSlug, stateName }: { stateSlug: string; stateName: string }) {
  // Find the state by name
  const state = await prisma.indianState.findFirst({
    where: { 
      OR: [
        { name: { equals: stateName, mode: 'insensitive' } },
        { name: { contains: stateName.split(' ')[0], mode: 'insensitive' } },
      ],
      isActive: true,
    },
  });

  if (!state) notFound();

  // Fetch destinations in this state
  const [destinations, products, upcomingDepartures] = await Promise.all([
    prisma.destination.findMany({
      where: {
        isActive: true,
        city: { stateId: state.id },
        products: { some: { status: 'APPROVED', isActive: true } },
      },
      include: {
        city: { select: { name: true } },
        _count: { select: { products: true } },
      },
      orderBy: { products: { _count: 'desc' } },
    }),
    // All products in this state
    prisma.product.findMany({
      where: {
        status: 'APPROVED',
        isActive: true,
        destination: { city: { stateId: state.id } },
      },
      include: {
        destination: { include: { city: { include: { state: { select: { name: true } } } } } },
        guide: { include: { user: { select: { name: true, image: true } } } },
        fixedDepartures: {
          where: { isActive: true, approvalStatus: 'APPROVED', startDate: { gte: new Date() } },
          orderBy: { pricePerPerson: 'asc' as const },
          take: 1,
          select: { pricePerPerson: true, meetingPoint: true, totalSeats: true, bookedSeats: true, startDate: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }) as any,
    // Upcoming departures in this state
    prisma.fixedDeparture.findMany({
      where: {
        isActive: true,
        approvalStatus: 'APPROVED',
        startDate: { gte: new Date() },
        product: {
          status: 'APPROVED',
          isActive: true,
          destination: { city: { stateId: state.id } },
        },
      },
      include: {
        product: {
          include: {
            destination: { select: { name: true } },
            guide: { include: { user: { select: { name: true } } } },
          },
        },
      },
      orderBy: { startDate: 'asc' },
      take: 8,
    }),
  ]);

  const stateInfo: Record<string, { tagline: string; icon: string; season: string }> = {
    'Uttarakhand': { tagline: 'Land of the Gods', icon: '🏔️', season: 'Mar-Jun, Sep-Nov' },
    'Himachal Pradesh': { tagline: 'Adventure Paradise', icon: '⛰️', season: 'Mar-Jun, Sep-Nov' },
    'Ladakh': { tagline: 'Land of High Passes', icon: '🗻', season: 'Jun-Sep' },
    'Kashmir': { tagline: 'Paradise on Earth', icon: '🌸', season: 'Apr-Oct' },
    'Delhi': { tagline: 'Heritage Capital', icon: '🏛️', season: 'Oct-Mar' },
    'Rajasthan': { tagline: 'Land of Kings', icon: '🏰', season: 'Oct-Mar' },
    'Uttar Pradesh': { tagline: 'Spiritual Heartland', icon: '🕌', season: 'Oct-Mar' },
  };

  const info = stateInfo[stateName] || { tagline: 'Explore India', icon: '🇮🇳', season: 'Year-round' };
  const disabledSlugs = await getDisabledCategorySlugs();
  const activeCategories = CATEGORIES_ORDERED.filter(c => !disabledSlugs.has(c.slug));

  return (
    <div className="min-h-screen bg-white">
      {/* ========== HERO SECTION ========== */}
      <section className="relative min-h-[50vh] flex items-end overflow-hidden bg-gradient-to-br from-[#1A1A18] via-[#2A2A28] to-[#1A4D4A]">
        <div className="absolute inset-0 bg-[url('/images/btg/optimized/hero-section.webp')] bg-cover bg-center opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A18] via-[#1A1A18]/50 to-transparent" />
        
        <div className="relative z-10 w-full px-6 lg:px-16 pb-16 pt-32">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-white/60 mb-6">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight className="w-4 h-4" />
              <Link href="/explore" className="hover:text-white transition-colors">Explore</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white">{stateName}</span>
            </nav>
            
            {/* Icon and heading */}
            <div className="flex items-center gap-4 mb-4">
              <span className="text-5xl">{info.icon}</span>
              <div>
                <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                  {stateName}
                </h1>
                <p className="text-[#58bdae] text-xl font-medium mt-1">{info.tagline}</p>
              </div>
            </div>
            
            {/* Quick stats */}
            <div className="flex flex-wrap gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur-sm px-5 py-3 rounded-xl">
                <p className="text-2xl font-bold text-white">{destinations.length}</p>
                <p className="text-white/60 text-sm">Destinations</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-5 py-3 rounded-xl">
                <p className="text-2xl font-bold text-white">{products.length}</p>
                <p className="text-white/60 text-sm">Experiences</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-5 py-3 rounded-xl flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#58bdae]" />
                <div>
                  <p className="text-sm font-medium text-white">Best Time</p>
                  <p className="text-[#58bdae] text-sm">{info.season}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FILTERS BAR ========== */}
      <div className="border-b border-[#1A1A18]/[0.08] bg-white sticky top-[64px] z-30">
        <div className="max-w-7xl mx-auto px-6 lg:px-16 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-[#6B6560]">
              <Filter className="w-4 h-4" />
              <span>Filter:</span>
            </div>
            
            {/* Experience Type Pills */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              <Link
                href={`/explore/${stateSlug}`}
                className="px-4 py-2 rounded-full text-sm font-medium bg-[#58bdae] text-white whitespace-nowrap"
              >
                All Experiences
              </Link>
              {activeCategories.slice(0, 4).map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/explore/${stateSlug}/${cat.urlSlug}`}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-[#F5F0E8] text-[#6B6560] hover:bg-[#58bdae]/10 hover:text-[#58bdae] transition-colors whitespace-nowrap"
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========== DESTINATIONS IN STATE ========== */}
      <section className="py-16 bg-btg-cream">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <div className="mb-10">
            <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#58bdae] mb-3">
              Places to Visit
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#1A1A18]">
              Destinations in {stateName}
            </h2>
          </div>
          
          {destinations.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {destinations.map((dest) => (
                <Link
                  key={dest.id}
                  href={`/destinations/${dest.id}`}
                  className="group relative rounded-2xl overflow-hidden aspect-[3/4] cursor-pointer hover:-translate-y-1.5 transition-transform duration-300"
                >
                  {dest.coverImage ? (
                    <img
                      src={dest.coverImage}
                      alt={dest.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#58bdae]/30 to-[#58bdae]/10 flex items-center justify-center">
                      <MapPin className="w-10 h-10 text-[#58bdae]" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A18]/80 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-heading text-lg font-bold text-white">{dest.name}</h3>
                    <p className="text-white/70 text-sm">{dest.city.name}</p>
                    <p className="text-[#58bdae] text-xs mt-1">{dest._count.products} packages</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-[#6B6560] py-10">No destinations available yet.</p>
          )}
        </div>
      </section>

      {/* ========== PACKAGES ========== */}
      {products.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-16">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#58bdae] mb-3">
                  Tours & Adventures
                </p>
                <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#1A1A18]">
                  Experiences in {stateName}
                </h2>
              </div>
              <Link href={`/explore/${stateSlug}`} className="hidden md:flex items-center gap-2 text-[#58bdae] font-medium hover:text-btg-cta transition-colors">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.slice(0, 8).map((p: any) => (
                <PackageCard key={p.id} pkg={toCard(p)} />
              ))}
            </div>
            
            {products.length > 8 && (
              <div className="text-center mt-10">
                <Link href={`/explore/${stateSlug}`} className="inline-block text-sm font-bold text-white bg-btg-cta px-8 py-3.5 rounded-full hover:bg-btg-cta-hover hover:-translate-y-0.5 transition-all tracking-wide">
                  View All {products.length} Packages →
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ========== UPCOMING DEPARTURES ========== */}
      {upcomingDepartures.length > 0 && (
        <section className="py-16 bg-btg-dark">
          <div className="max-w-7xl mx-auto px-6 lg:px-16">
            <div className="mb-10">
              <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#58bdae] mb-3">
                Book Now
              </p>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-white">
                Upcoming Departures in {stateName}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {upcomingDepartures.map((dep) => (
                <Link
                  key={dep.id}
                  href={`/trips/${dep.product.slug}`}
                  className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover:border-[#58bdae]/50 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="bg-[#58bdae]/20 text-[#58bdae] text-xs font-medium px-3 py-1 rounded-full">
                      {new Date(dep.startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </span>
                    {dep.totalSeats - (dep.bookedSeats || 0) <= 5 && (
                      <span className="text-btg-cta text-xs font-medium">
                        {dep.totalSeats - (dep.bookedSeats || 0)} left
                      </span>
                    )}
                  </div>
                  
                  <h3 className="font-heading text-base font-bold text-white mb-2 group-hover:text-[#58bdae] transition-colors line-clamp-2">
                    {dep.product.title}
                  </h3>
                  
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-white/50 text-xs">{dep.product.destination.name}</span>
                    <span className="text-[#58bdae] font-bold text-sm">₹{dep.pricePerPerson.toLocaleString('en-IN')}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========== AI ASSISTANT CTA ========== */}
      <section className="py-16 bg-gradient-to-r from-[#58bdae] to-[#4aa99b]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-semibold px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-4 h-4" /> AI Travel Assistant
          </div>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
            Not Sure Where to Go in {stateName}?
          </h2>
          <p className="text-white/70 text-lg mb-6">
            Ask our AI assistant for personalized recommendations based on your interests, budget, and travel style.
          </p>
          <button className="inline-block text-sm font-bold text-[#1A4D4A] bg-white px-8 py-3.5 rounded-full hover:bg-btg-cream hover:-translate-y-0.5 transition-all tracking-wide">
            Chat Now →
          </button>
        </div>
      </section>
    </div>
  );
}
