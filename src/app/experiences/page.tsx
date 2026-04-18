import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import Link from 'next/link';

export const revalidate = 300;
import { MapPin, Calendar, Users, Star, ArrowRight, ChevronRight, Clock, Sparkles, TrendingUp, Heart, Filter, Search, Mountain, Camera, Compass, Map, Users2, Flame } from 'lucide-react';
import { CATEGORIES_ORDERED, CATEGORY_MAP } from '@/lib/categories';
import { getActiveCategories } from '@/lib/active-packages';
import { PackageCard, type PackageCardData } from '@/components/PackageCard';
import { AiTravelAssistant } from '@/components/ai/AiTravelAssistant';
import { getPageBySlug, wpSeoToMetadata, getPageContent } from '@/lib/wordpress';
import { WPSeoContentBlock, WPFaqSection, WPInternalLinksGrid } from '@/components/wordpress/WPContentBlocks';

export async function generateMetadata(): Promise<Metadata> {
  const wpPage = await getPageBySlug('experiences');
  if (wpPage?.seo) {
    return wpSeoToMetadata(wpPage.seo, {
      title: 'Travel Experiences - Tours, Adventures & Heritage | Book The Guide',
      description: 'Discover incredible travel experiences across India. Book tours with certified local guides, join group trips, explore heritage walks, and find adventure activities.',
      url: 'https://www.booktheguide.com/experiences',
    });
  }
  return {
    title: 'Travel Experiences - Tours, Adventures & Heritage | Book The Guide',
    description: 'Discover incredible travel experiences across India. Book tours with certified local guides, join group trips, explore heritage walks, and find adventure activities.',
    keywords: 'travel experiences India, local guides, group trips, adventure tours, heritage walks, influencer trips',
    openGraph: {
      title: 'Travel Experiences | Book The Guide',
      description: 'Discover incredible travel experiences across India with verified local guides.',
    },
  };
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

// Category icons for visual display
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'TOURIST_GUIDES': <Map className="w-6 h-6" />,
  'HERITAGE_WALKS': <Mountain className="w-6 h-6" />,
  'GROUP_TRIPS': <Users2 className="w-6 h-6" />,
  'ADVENTURE_GUIDES': <Compass className="w-6 h-6" />,
  'TRAVEL_WITH_INFLUENCERS': <Camera className="w-6 h-6" />,
  'OFFBEAT_TRAVEL': <Flame className="w-6 h-6" />,
  'TREKKING': <Mountain className="w-6 h-6" />,
};

export default async function ExperiencesLandingPage() {
  const wp = await getPageContent('experiences');

  // Fetch all data in parallel
  const [
    allProducts,
    popularDestinations,
    topGuides,
    upcomingDepartures,
  ] = await Promise.all([
    // All approved products
    prisma.product.findMany({
      where: {
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
    // Popular destinations
    prisma.destination.findMany({
      where: {
        isActive: true,
        products: { some: { status: 'APPROVED', isActive: true } },
      },
      include: {
        city: { include: { state: true } },
        _count: { select: { products: { where: { status: 'APPROVED', isActive: true } } } },
      },
      orderBy: { products: { _count: 'desc' } },
      take: 8,
    }),
    // Top guides
    prisma.guideProfile.findMany({
      where: { isActive: true, isVerified: true },
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
        product: { status: 'APPROVED', isActive: true },
      },
      include: {
        product: {
          include: {
            destination: { include: { city: { select: { name: true } } } },
            guide: { include: { user: { select: { name: true } } } },
          },
        },
      },
      orderBy: { startDate: 'asc' },
      take: 6,
    }),
  ]);

  // Count products by category
  const countsByCategory: Record<string, number> = {};
  for (const cat of CATEGORIES_ORDERED) {
    countsByCategory[cat.slug] = allProducts.filter((p: any) => p.packageCategory === cat.slug).length;
  }

  // Filter categories to only those with active packages (auto-detection)
  let activeCategories = CATEGORIES_ORDERED;
  try {
    const dbActive = await getActiveCategories();
    if (dbActive.length > 0) {
      const activeSlugs = new Set(dbActive.map((c: any) => c.slug));
      activeCategories = CATEGORIES_ORDERED.filter(cat => activeSlugs.has(cat.slug));
    }
  } catch {}
  // Fallback: at minimum show categories that have products
  if (activeCategories.length === 0) {
    activeCategories = CATEGORIES_ORDERED.filter(cat => countsByCategory[cat.slug] > 0);
  }
  // If still empty, show all
  if (activeCategories.length === 0) activeCategories = CATEGORIES_ORDERED;

  // Get most loved (highest rated guides' products)
  const mostLoved = allProducts
    .filter((p: any) => p.guide.averageRating >= 4.5)
    .slice(0, 4);

  // Get trending (most bookings - simulated by recent)
  const trending = allProducts.slice(0, 4);

  // Get products with upcoming departures
  const withUpcoming = allProducts.filter((p: any) => p.fixedDepartures?.length > 0).slice(0, 4);

  return (
    <div className="min-h-screen bg-white">
      {/* ========== HERO SECTION ========== */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A18] via-[#2A2A28] to-[#1A1A18]" />
        
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-96 h-96 rounded-full bg-[#C8714A]/30 blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-[#7A9E7E]/30 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#C8714A]/10 blur-3xl" />
        </div>
        
        <div className="relative z-10 w-full px-6 lg:px-16 py-32">
          <div className="max-w-7xl mx-auto text-center">
            {/* Badge */}
            <span className="inline-flex items-center gap-2 bg-[#C8714A]/10 text-[#C8714A] text-xs font-semibold px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4" /> {allProducts.length}+ Unique Experiences
            </span>
            
            {/* Main heading */}
            <h1 className="font-heading text-4xl md:text-5xl lg:text-7xl font-bold text-white leading-tight mb-6"
                dangerouslySetInnerHTML={{ __html: wp.text('hero_title', 'Find Your Perfect<br /><span class="text-[#C8714A]">Travel Experience</span>') }} />
            
            <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto mb-10">
              {wp.plainText('hero_description', 'From city tours with local experts to mountain adventures and heritage walks \u2014 discover experiences that match your travel style.')}
            </p>
            
            {/* Quick filter buttons */}
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              {activeCategories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/experiences/${cat.urlSlug}`}
                  className="group bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-5 py-3 rounded-xl transition-all flex items-center gap-2"
                >
                  <span className="text-[#C8714A]">{CATEGORY_ICONS[cat.slug]}</span>
                  <span className="font-medium">{cat.label}</span>
                </Link>
              ))}
            </div>
            
            {/* CTAs */}
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/search"
                className="inline-flex items-center gap-2 bg-[#C8714A] text-white px-8 py-4 rounded-xl font-medium hover:bg-[#B8614A] transition-colors"
              >
                <Search className="w-5 h-5" /> Search All Experiences
              </Link>
              <Link
                href="#ai-planner"
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-medium hover:bg-white/20 transition-colors"
              >
                <Sparkles className="w-5 h-5" /> Get AI Recommendations
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========== EXPERIENCE CATEGORIES ========== */}
      <section className="py-20 bg-[#F8F6F3]">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <div className="text-center mb-12">
            <p className="text-[#C8714A] text-sm font-semibold tracking-[0.15em] uppercase mb-2">
              {wp.plainText('categories_label', 'Choose Your Style')}
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#1A1A18]">
              {wp.plainText('categories_title', 'Browse by Experience Type')}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {activeCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/experiences/${cat.urlSlug}`}
                className="group relative overflow-hidden rounded-2xl aspect-square"
              >
                <img 
                  src={cat.image} 
                  alt={cat.label} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                  <div className="transform group-hover:-translate-y-2 transition-transform duration-300">
                    <div className="bg-[#C8714A] w-12 h-12 rounded-xl flex items-center justify-center text-white mb-3">
                      {CATEGORY_ICONS[cat.slug]}
                    </div>
                    <h3 className="font-heading text-xl font-bold text-white mb-1">{cat.label}</h3>
                    <p className="text-white/70 text-sm">{countsByCategory[cat.slug]} experiences</p>
                  </div>
                  
                  <div className="flex items-center gap-2 text-[#C8714A] font-medium text-sm mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    Explore <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========== TRENDING EXPERIENCES ========== */}
      {trending.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-16">
            <div className="flex items-end justify-between mb-12">
              <div className="flex items-center gap-4">
                <div className="bg-[#C8714A]/10 p-3 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-[#C8714A]" />
                </div>
                <div>
                  <h2 className="font-heading text-3xl font-bold text-[#1A1A18]">{wp.plainText('trending_title', 'Trending Now')}</h2>
                  <p className="text-[#6B6560]">{wp.plainText('trending_subtitle', 'Popular experiences this season')}</p>
                </div>
              </div>
              <Link href="/trending" className="hidden md:flex items-center gap-2 text-[#C8714A] font-medium hover:gap-3 transition-all">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trending.map((p: any) => (
                <PackageCard key={p.id} pkg={toCard(p)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========== UPCOMING FIXED DEPARTURES ========== */}
      {upcomingDepartures.length > 0 && (
        <section className="py-20 bg-[#1A1A18]">
          <div className="max-w-7xl mx-auto px-6 lg:px-16">
            <div className="flex items-end justify-between mb-12">
              <div>
                <span className="inline-flex items-center gap-2 bg-[#7A9E7E]/20 text-[#7A9E7E] text-xs font-semibold px-4 py-2 rounded-full mb-4">
                  <Calendar className="w-4 h-4" /> Fixed Dates
                </span>
                <h2 className="font-heading text-3xl md:text-4xl font-bold text-white">
                  {wp.plainText('upcoming_title', 'Upcoming Departures')}
                </h2>
                <p className="text-white/60 mt-2">{wp.plainText('upcoming_subtitle', 'Book a seat on these scheduled trips')}</p>
              </div>
              <Link href="/upcoming-trips" className="hidden md:flex items-center gap-2 text-[#C8714A] font-medium hover:gap-3 transition-all">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingDepartures.map((dep) => (
                <Link
                  key={dep.id}
                  href={`/trips/${dep.product.slug}`}
                  className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="bg-[#7A9E7E]/20 text-[#7A9E7E] text-xs font-medium px-3 py-1 rounded-full">
                        {new Date(dep.startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {dep.totalSeats - (dep.bookedSeats || 0) <= 5 && (
                        <span className="bg-red-500/20 text-red-400 text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
                          <Flame className="w-3 h-3" /> {dep.totalSeats - (dep.bookedSeats || 0)} left
                        </span>
                      )}
                    </div>
                    
                    <h3 className="font-heading text-lg font-bold text-white mb-2 group-hover:text-[#C8714A] transition-colors line-clamp-2">
                      {dep.product.title}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-white/60 text-sm mb-4">
                      <MapPin className="w-4 h-4" />
                      {dep.product.destination.name}, {dep.product.destination.city.name}
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <span className="text-white/50 text-sm">by {dep.product.guide.user.name}</span>
                      <span className="text-[#C8714A] font-bold">₹{dep.pricePerPerson.toLocaleString()}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========== MOST LOVED ========== */}
      {mostLoved.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-16">
            <div className="flex items-end justify-between mb-12">
              <div className="flex items-center gap-4">
                <div className="bg-red-50 p-3 rounded-xl">
                  <Heart className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h2 className="font-heading text-3xl font-bold text-[#1A1A18]">{wp.plainText('loved_title', 'Most Loved Experiences')}</h2>
                  <p className="text-[#6B6560]">{wp.plainText('loved_subtitle', 'Highest rated by travelers')}</p>
                </div>
              </div>
              <Link href="/search?sort=rating" className="hidden md:flex items-center gap-2 text-[#C8714A] font-medium hover:gap-3 transition-all">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {mostLoved.map((p: any) => (
                <PackageCard key={p.id} pkg={toCard(p)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========== POPULAR DESTINATIONS ========== */}
      <section className="py-20 bg-[#F8F6F3]">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-[#7A9E7E] text-sm font-semibold tracking-[0.15em] uppercase mb-2">
                {wp.plainText('destinations_label', 'Where to Go')}
              </p>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#1A1A18]">
                {wp.plainText('destinations_title', 'Popular Destinations')}
              </h2>
            </div>
            <Link href="/explore" className="hidden md:flex items-center gap-2 text-[#C8714A] font-medium hover:gap-3 transition-all">
              All Destinations <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {popularDestinations.map((dest) => (
              <Link
                key={dest.id}
                href={`/search?destination=${encodeURIComponent(dest.name)}`}
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden"
              >
                {dest.coverImage ? (
                  <img src={dest.coverImage} alt={dest.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#7A9E7E]/40 to-[#C8714A]/30" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute inset-0 p-4 flex flex-col justify-end">
                  <h3 className="font-heading text-lg font-bold text-white">{dest.name}</h3>
                  <p className="text-white/70 text-sm">{dest.city.state.name} • {dest._count.products} trips</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========== AI TRAVEL PLANNER ========== */}
      <section id="ai-planner" className="py-20 bg-gradient-to-b from-white to-[#F8F6F3]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="inline-flex items-center gap-2 bg-[#C8714A]/10 text-[#C8714A] text-xs font-semibold px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-4 h-4" /> Powered by AI
          </span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#1A1A18] mb-4">
            {wp.plainText('ai_title', 'Not Sure What to Choose?')}
          </h2>
          <p className="text-[#6B6560] text-lg mb-8">
            {wp.plainText('ai_description', 'Tell us about your ideal trip \u2014 dates, interests, budget \u2014 and let our AI find the perfect experiences for you.')}
          </p>
          <AiTravelAssistant />
        </div>
      </section>

      {/* ========== TOP GUIDES ========== */}
      {topGuides.length > 0 && (
        <section className="py-20 bg-[#F8F6F3]">
          <div className="max-w-7xl mx-auto px-6 lg:px-16">
            <div className="text-center mb-12">
              <p className="text-[#7A9E7E] text-sm font-semibold tracking-[0.15em] uppercase mb-2">
                {wp.plainText('guides_label', 'Expert Guides')}
              </p>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#1A1A18]">
                {wp.plainText('guides_title', 'Travel with the Best')}
              </h2>
              <p className="text-[#6B6560] mt-2">{wp.plainText('guides_subtitle', 'Verified local experts who know every hidden gem')}</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {topGuides.map((guide) => (
                <Link
                  key={guide.id}
                  href={`/guides/${guide.slug}`}
                  className="group text-center"
                >
                  <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-4 border-[#7A9E7E]/20 group-hover:border-[#7A9E7E] transition-colors mb-3">
                    {guide.user.image ? (
                      <img src={guide.user.image} alt={guide.user.name || ''} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#F8F6F3] flex items-center justify-center text-xl text-[#C8714A] font-bold">
                        {guide.user.name?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-[#1A1A18] text-sm mb-1 group-hover:text-[#C8714A] transition-colors">
                    {guide.user.name}
                  </h3>
                  
                  {guide.averageRating > 0 && (
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-[#1A1A18] text-xs">{guide.averageRating.toFixed(1)}</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========== CTA SECTION ========== */}
      <section className="py-20 bg-gradient-to-br from-[#C8714A] to-[#A85A3A]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
            {wp.plainText('cta_title', 'Ready to Start Your Journey?')}
          </h2>
          <p className="text-white/80 text-lg mb-8">
            {wp.plainText('cta_description', 'Join thousands of travelers who found their perfect experience with Book The Guide.')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/search"
              className="inline-flex items-center justify-center gap-2 bg-white text-[#C8714A] px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              <Search className="w-5 h-5" /> Find Experiences
            </Link>
            <Link
              href="/register?role=guide"
              className="inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-colors"
            >
              Become a Guide
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
