import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, Clock, Star, ArrowRight, ChevronRight, Filter, Users, HelpCircle, Compass, Mountain, ChevronDown } from 'lucide-react';
import prisma from '@/lib/prisma';
import { CATEGORY_MAP, CATEGORIES_ORDERED, type PackageCategorySlug } from '@/lib/categories';
import { getDisabledCategorySlugs, getActiveStates } from '@/lib/active-packages';
import { type PackageCardData } from '@/components/PackageCard';
import { getCategoryLanding, getCategoryLandingContent } from '@/lib/wordpress';
import { wpSeoToMetadata } from '@/lib/wordpress';
import { WPFaqSection, WPSeoContentBlock, WPInternalLinksGrid } from '@/components/wordpress/WPContentBlocks';
import { getUIConfig, isSectionVisible, getSectionSort, getSectionLimit, getFeaturedIds, applySorting, applyFeaturedPinning } from '@/lib/ui-config';

const SLUG_TO_CATEGORY: Record<string, PackageCategorySlug> = {
  'tourist-guides': 'TOURIST_GUIDES',
  'group-trips': 'GROUP_TRIPS',
  'adventure-guides': 'ADVENTURE_GUIDES',
  'heritage-walks': 'HERITAGE_WALKS',
  'travel-with-influencers': 'TRAVEL_WITH_INFLUENCERS',
  'influencer-trips': 'TRAVEL_WITH_INFLUENCERS',
  'offbeat-travel': 'OFFBEAT_TRAVEL',
  'trekking': 'TREKKING',
};

const CATEGORY_HERO_BADGES: Record<string, string[]> = {
  'TREKKING': ['Certified Mountaineers', 'Verified Reviews', 'Secure Payments', 'Flexible Cancellations'],
  'ADVENTURE_GUIDES': ['Government Licensed Operators', 'International Safety Standards', 'Equipment Safety Checked', 'Flexible Cancellations'],
  'OFFBEAT_TRAVEL': ['Community-Rooted Experiences', 'Permit Area Access', 'Certified Local Guides', 'Flexible Cancellations'],
};

/**
 * Better section titles that accurately describe what's shown (packages/experiences, not guide profiles).
 * "All Tourist Guides" is misleading because the section shows package cards, not guide profiles.
 */
const CATEGORY_SECTION_LABELS: Record<string, { allTitle: string; allLabel: string; recommendedTitle: string; bystateTitle: string; bystateSubtitle: string }> = {
  TOURIST_GUIDES: {
    allTitle: 'All Tourist Guide <span class="text-[#58bdae]">Experiences</span>',
    allLabel: 'Tourist Guide Experiences',
    recommendedTitle: 'Recommended Tourist Guide <span class="text-[#58bdae]">Experiences</span>',
    bystateTitle: 'Find Tourist Guide Experiences in <span class="text-[#58bdae]">Indian States</span>',
    bystateSubtitle: 'Pick a state to see all tourist guide packages available there',
  },
  GROUP_TRIPS: {
    allTitle: 'All Group <span class="text-[#58bdae]">Trips</span>',
    allLabel: 'Group Trips',
    recommendedTitle: 'Recommended Group <span class="text-[#58bdae]">Trips</span>',
    bystateTitle: 'Find Group Trips in <span class="text-[#58bdae]">Indian States</span>',
    bystateSubtitle: 'Pick a state to see all group trip packages available there',
  },
  ADVENTURE_GUIDES: {
    allTitle: 'All Adventure <span class="text-[#58bdae]">Experiences</span>',
    allLabel: 'Adventure Experiences',
    recommendedTitle: 'Recommended Adventure <span class="text-[#58bdae]">Experiences</span>',
    bystateTitle: 'Find Adventure Experiences in <span class="text-[#58bdae]">Indian States</span>',
    bystateSubtitle: 'Pick a state to see all adventure packages available there',
  },
  HERITAGE_WALKS: {
    allTitle: 'All Heritage <span class="text-[#58bdae]">Walks</span>',
    allLabel: 'Heritage Walks',
    recommendedTitle: 'Recommended Heritage <span class="text-[#58bdae]">Walks</span>',
    bystateTitle: 'Find Heritage Walks in <span class="text-[#58bdae]">Indian States</span>',
    bystateSubtitle: 'Pick a state to see all heritage walk packages available there',
  },
  TRAVEL_WITH_INFLUENCERS: {
    allTitle: 'All Influencer <span class="text-[#58bdae]">Trips</span>',
    allLabel: 'Influencer Trips',
    recommendedTitle: 'Recommended Influencer <span class="text-[#58bdae]">Trips</span>',
    bystateTitle: 'Find Influencer Trips in <span class="text-[#58bdae]">Indian States</span>',
    bystateSubtitle: 'Pick a state to see all influencer trip packages available there',
  },
  OFFBEAT_TRAVEL: {
    allTitle: 'All Offbeat <span class="text-[#58bdae]">Experiences</span>',
    allLabel: 'Offbeat Experiences',
    recommendedTitle: 'Recommended Offbeat <span class="text-[#58bdae]">Destinations</span>',
    bystateTitle: 'Find Offbeat Experiences in <span class="text-[#58bdae]">Indian States</span>',
    bystateSubtitle: 'Pick a state to discover hidden gems and offbeat destinations',
  },
  TREKKING: {
    allTitle: 'All <span class="text-[#58bdae]">Treks</span>',
    allLabel: 'Treks',
    recommendedTitle: 'Recommended <span class="text-[#58bdae]">Treks</span>',
    bystateTitle: 'Find Treks in <span class="text-[#58bdae]">Indian States</span>',
    bystateSubtitle: 'Pick a state to discover trekking experiences available there',
  },
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  TOURIST_GUIDES: `Whether you're wandering through the bustling lanes of Old Delhi, soaking in the royal grandeur of Rajasthan's forts, or discovering the hidden gems of South India — a local tourist guide transforms every trip into a story worth telling. Our verified guides don't just show you places; they immerse you in the culture, history, and soul of each destination. From street food walks to sunrise temple visits, these are the experiences you'll remember forever.`,
  GROUP_TRIPS: `Travelling alone is great, but some destinations are best experienced with a crew. Our curated group trips bring together like-minded adventurers for fixed-departure journeys across India. Think sunrise treks in the Himalayas, cultural immersions in Rajasthan, and jeep safaris in the Western Ghats — all with expert guides, pre-planned itineraries, and the perfect mix of adventure and comfort.`,
  ADVENTURE_GUIDES: `From the snow-covered peaks of Ladakh to the raging rapids of Rishikesh, India is an adventure playground waiting to be explored. Our certified adventure guides specialise in trekking, rafting, rock climbing, paragliding, and more. Every guide is vetted for safety certifications, local expertise, and experience — so you can push your limits with total confidence.`,
  HERITAGE_WALKS: `India's heritage is not just in museums — it's alive in the narrow alleys of old cities, the crumbling walls of medieval forts, and the sacred courtyards of ancient temples. Our heritage walk guides are passionate storytellers who bring India's incredible past to life. Walk through 500-year-old bazaars, decode Mughal architecture, and discover the layers of history that make every Indian city unique.`,
  TRAVEL_WITH_INFLUENCERS: `Travel meets content creation! Join popular travel influencers on curated trips where you'll not only explore incredible destinations but also learn the art of travel photography, content creation, and storytelling. These exclusive small-group experiences combine exploration with creative workshops — perfect for aspiring creators and travel enthusiasts who want Instagram-worthy memories.`,
  OFFBEAT_TRAVEL: `Tired of crowded tourist spots? Venture into India's hidden corners — remote hamlets in Meghalaya, untouched valleys in Spiti, secret beaches in Gokarna, and forgotten heritage towns. Our offbeat travel guides take you where few have been, offering authentic cultural immersion and pristine natural beauty far from the tourist trail.`,
  TREKKING: `From the iconic Roopkund and Hampta Pass to lesser-known trails in Sikkim and Arunachal Pradesh, India offers some of the world's most breathtaking treks. Our certified trek leaders ensure safety, proper acclimatization schedules, and an unforgettable experience in the mountains. Whether you're a first-timer or an experienced trekker, find your perfect trail.`,
};

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

export async function generateMetadata({ params }: { params: { category: string } }) {
  const slug = SLUG_TO_CATEGORY[params.category];
  if (!slug) return { title: 'Not Found' };
  const cat = CATEGORY_MAP[slug];

  // Try WordPress category landing first
  const wpCategoryLanding = await getCategoryLanding(params.category);
  if (wpCategoryLanding?.seo) {
    return wpSeoToMetadata(wpCategoryLanding.seo, {
      title: `Best ${cat.label} in India 2026 — Book Verified Local Guides | Book The Guide`,
      description: `${cat.description}. Browse ${cat.label.toLowerCase()} across India with verified local experts.`,
      url: `https://www.booktheguide.com/experiences/${params.category}`,
    });
  }

  const title = `Best ${cat.label} in India 2026 — Book Verified Local Guides | Book The Guide`;
  const description = `${cat.description}. Browse ${cat.label.toLowerCase()} across India with verified local experts. ✓ Rated 4.8★ ✓ Instant Booking ✓ Free Cancellation on select trips`;

  return {
    title,
    description,
    keywords: `${cat.label}, India tours, local guides, ${cat.label.toLowerCase()} experiences, best ${cat.label.toLowerCase()} India, book ${cat.label.toLowerCase()}, verified guides India, ${cat.activityTypes.slice(0, 3).join(', ')}`,
    openGraph: {
      title: `${cat.label} — Tours & Experiences | Book The Guide`,
      description,
      url: `https://www.booktheguide.com/experiences/${params.category}`,
      images: cat.image ? [{ url: cat.image, width: 1200, height: 630, alt: cat.label }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${cat.label} | Book The Guide`,
      description: `${cat.description}. Book verified guides instantly.`,
    },
    alternates: {
      canonical: `https://www.booktheguide.com/experiences/${params.category}`,
    },
  };
}

// ISR: render on-demand, cache for 60s, regenerate in background
export const revalidate = 60;

export async function generateStaticParams() {
  // Return empty to skip build-time prerendering (avoids DB connection exhaustion)
  return [];
}

export default async function ExperienceCategoryPage({ params }: { params: { category: string } }) {
  const slug = SLUG_TO_CATEGORY[params.category];
  if (!slug) notFound();

  const cat = CATEGORY_MAP[slug];
  const activeStates = await getActiveStates();

  // Fetch all data in parallel (including WordPress category landing)
  // Check if this category is disabled
  const disabledSlugs = await getDisabledCategorySlugs();
  if (disabledSlugs.has(slug)) notFound();

  const [productsRaw, topGuides, wpCategoryLanding, wp, statesWithProducts, uiConfig, dbSubCategories] = await Promise.all([
    prisma.product.findMany({
      where: {
        packageCategory: slug,
        status: 'APPROVED',
        isActive: true,
        // Only show packages with at least 1 upcoming approved departure
        fixedDepartures: {
          some: { isActive: true, approvalStatus: 'APPROVED', startDate: { gte: new Date() } },
        },
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
    }),
    prisma.guideProfile.findMany({
      where: {
        isActive: true,
        isVerified: true,
        products: { some: { packageCategory: slug, status: 'APPROVED', isActive: true } },
      },
      include: {
        user: { select: { name: true, image: true } },
        _count: { select: { products: { where: { packageCategory: slug, status: 'APPROVED' } } } },
      },
      orderBy: { averageRating: 'desc' },
      take: 12,
    }),
    getCategoryLanding(params.category),
    getCategoryLandingContent(params.category),
    prisma.indianState.findMany({
      where: {
        isActive: true,
        cities: {
          some: {
            destinations: {
              some: {
                products: { some: { packageCategory: slug, status: 'APPROVED', isActive: true } },
              },
            },
          },
        },
      },
      select: { name: true },
    }),
    getUIConfig('experiences-default'),
    prisma.subCategory.findMany({
      where: { isEnabled: true, category: { urlSlug: params.category } },
      orderBy: { sortOrder: 'asc' },
      select: { name: true },
    }),
  ]);

  const activityTypes = dbSubCategories.map((s: { name: string }) => s.name);
  const products = productsRaw as any[];
  const sortedProducts = applyFeaturedPinning(
    applySorting(products, getSectionSort(uiConfig, 'all_experiences')),
    getFeaturedIds(uiConfig, 'all_experiences')
  );
  const recommended = applyFeaturedPinning(
    applySorting(
      products.filter(p => p.guide.averageRating >= 4),
      getSectionSort(uiConfig, 'recommended')
    ),
    getFeaturedIds(uiConfig, 'recommended')
  ).slice(0, getSectionLimit(uiConfig, 'recommended', 8));
  const cards = sortedProducts.slice(0, getSectionLimit(uiConfig, 'all_experiences', 12)).map(toCard);
  const otherCategories = CATEGORIES_ORDERED.filter(c => c.slug !== slug && !disabledSlugs.has(c.slug));
  const sectionLabels = CATEGORY_SECTION_LABELS[slug];

  const stateImages: Record<string, string> = {
    'himachal-pradesh': 'https://images.unsplash.com/photo-1626621330414-3de75a9f3909?w=400&q=80&fm=webp',
    'uttarakhand': 'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=400&q=80&fm=webp',
    'rajasthan': 'https://images.unsplash.com/photo-1548013146-72479768bada?w=400&q=80&fm=webp',
    'ladakh': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80&fm=webp',
    'kashmir': 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&q=80&fm=webp',
    'delhi': 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&q=80&fm=webp',
    'karnataka': 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=400&q=80&fm=webp',
    'goa': 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&q=80&fm=webp',
    'kerala': 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400&q=80&fm=webp',
  };

  return (
    <div className="min-h-screen bg-white">

      {/* ═══════════════ 1. HERO SECTION ═══════════════ */}
      <section className="relative min-h-[55vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={cat.image} alt={cat.label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A18]/90 via-[#1A1A18]/75 to-transparent" />
        </div>
        <div className="relative z-10 w-full px-6 md:px-12 py-28">
          <div className="max-w-7xl mx-auto">
            <nav className="flex items-center gap-2 text-sm text-white/50 mb-6 font-body">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link href="/experiences" className="hover:text-white transition-colors">Experiences</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#FF7F50]">{cat.label}</span>
            </nav>
            <h1 className="font-heading text-[clamp(36px,5vw,64px)] font-bold text-white leading-[1.05] mb-4">
              {cat.label}
            </h1>
            <p className="text-white/70 text-lg md:text-xl max-w-2xl mb-8 font-body leading-relaxed">
              {cat.description}
            </p>
            <div className="flex flex-wrap gap-3 text-sm font-body">
              {CATEGORY_HERO_BADGES[slug] ? (
                CATEGORY_HERO_BADGES[slug].map((badge) => (
                  <span key={badge} className="inline-flex items-center gap-2 bg-white text-[#1A1A18] font-semibold text-[13px] px-5 py-2.5 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
                    <svg className="w-4 h-4 text-[#58bdae] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    {badge}
                  </span>
                ))
              ) : (
                <>
                  <span className="bg-white/10 backdrop-blur-sm px-5 py-2.5 rounded-full text-white/80">{products.length} Experiences</span>
                  <span className="bg-white/10 backdrop-blur-sm px-5 py-2.5 rounded-full text-white/80">{topGuides.length}+ Expert Guides</span>
                  <span className="bg-white/10 backdrop-blur-sm px-5 py-2.5 rounded-full text-white/80">{statesWithProducts.length} States</span>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ 2. QUICK FILTERS — Horizontal Scroll Sub-categories ═══════════════ */}
      {activityTypes.length > 0 && (
        <section className="py-10 px-6 md:px-12 bg-[#F5F0E8]">
          <div className="max-w-7xl mx-auto">
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#FF7F50] mb-3 font-body">{wp.plainText('browse_label', 'Browse by Type')}</p>
            <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide">
              {activityTypes.map((type) => (
                <Link
                  key={type}
                  href={`/search?category=${params.category}&activity=${encodeURIComponent(type)}`}
                  className="flex-shrink-0 snap-start group"
                >
                  <div className="bg-white rounded-2xl px-6 py-5 min-w-[180px] text-center border border-[#EDE8DF] hover:border-[#58bdae] hover:shadow-[0_8px_30px_rgba(88,189,174,0.15)] hover:-translate-y-1 transition-all duration-300">
                    <div className="w-10 h-10 rounded-full bg-[#58bdae]/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-[#58bdae]/20 transition-colors">
                      <Compass className="w-5 h-5 text-[#58bdae]" />
                    </div>
                    <h3 className="font-heading text-[14px] font-bold text-[#1A1A18] group-hover:text-[#58bdae] transition-colors">{type}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════ 3 + 4 + 5. H1, DESCRIPTION & QUICK INFO ═══════════════ */}
      <section className="py-14 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-heading text-[clamp(26px,3.5vw,38px)] font-bold leading-[1.1] text-[#1A1A18] mb-4" dangerouslySetInnerHTML={{ __html: wp.text('main_title', `Best ${cat.label} in <span class="text-[#58bdae]">India</span>`) }} />
          <p className="text-[15px] text-[#6B6560] font-body leading-relaxed max-w-4xl mb-8">
            {wp.plainText('main_description', CATEGORY_DESCRIPTIONS[slug] || cat.description)}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: wp.plainText('stat1_label', 'Verified Guides'), value: `${topGuides.length}+`, icon: <Users className="w-5 h-5 text-[#58bdae]" /> },
              { label: wp.plainText('stat2_label', 'Experiences'), value: `${products.length}`, icon: <Compass className="w-5 h-5 text-[#FF7F50]" /> },
              { label: wp.plainText('stat3_label', 'States Covered'), value: `${statesWithProducts.length}`, icon: <MapPin className="w-5 h-5 text-[#E8943A]" /> },
              { label: wp.plainText('stat4_label', 'Avg Rating'), value: wp.plainText('stat4_value', '4.8★'), icon: <Star className="w-5 h-5 text-[#E8943A] fill-[#E8943A]" /> },
            ].map((item) => (
              <div key={item.label} className="bg-[#F5F0E8] rounded-2xl p-5 flex items-center gap-4 border border-[#EDE8DF]">
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">{item.icon}</div>
                <div>
                  <p className="font-heading text-[22px] font-bold text-[#1A1A18]">{item.value}</p>
                  <p className="text-[12px] text-[#6B6560] font-body">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 6. FIND [CATEGORY] TO EXPLORE INDIAN STATES ═══════════════ */}
      <section className="py-14 px-6 md:px-12 bg-[#EDE8DF]">
        <div className="max-w-7xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#58bdae] mb-2 font-body">{wp.plainText('bystate_label', 'By State')}</p>
          <h2 className="font-heading text-[clamp(26px,3.5vw,38px)] font-bold leading-[1.1] text-[#1A1A18] mb-3" dangerouslySetInnerHTML={{ __html: wp.text('bystate_title', sectionLabels.bystateTitle) }} />
          <p className="text-[15px] text-[#6B6560] font-body mb-8">
            {wp.plainText('bystate_subtitle', sectionLabels.bystateSubtitle)}
          </p>

          <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
            {activeStates.map((s) => (
              <Link
                key={s.slug}
                href={`/search?state=${s.slug}&category=${params.category}`}
                className="flex-shrink-0 w-[260px] snap-start group"
              >
                <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_16px_rgba(28,26,23,0.06)] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(28,26,23,0.12)] transition-all duration-300 border border-[#EDE8DF] hover:border-[#58bdae]">
                  <div className="relative h-[160px] overflow-hidden">
                    <img
                      src={stateImages[s.slug] || cat.image}
                      alt={s.name}
                      className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4">
                      <h3 className="font-heading text-[18px] font-bold text-white">{s.name}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-[12px] text-[#6B6560] font-body line-clamp-1 mb-2">{s.tagline}</p>
                    <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#FF7F50] font-heading group-hover:gap-2.5 transition-all">
                      View {cat.label} <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 7. ALL [CATEGORY] — Horizontal Scroll with Filter CTA ═══════════════ */}
      <section className="py-14 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#FF7F50] mb-2 font-body">{wp.plainText('all_label', sectionLabels.allLabel)}</p>
              <h2 className="font-heading text-[clamp(26px,3.5vw,38px)] font-bold leading-[1.1] text-[#1A1A18]" dangerouslySetInnerHTML={{ __html: wp.text('all_title', sectionLabels.allTitle) }} />
              <p className="text-[15px] text-[#6B6560] font-medium mt-2 font-body">{wp.plainText('all_subtitle', `${products.length} experiences across India`)}</p>
            </div>
            <div className="hidden sm:block relative group">
              <button className="inline-flex items-center gap-2 text-sm font-bold text-white bg-[#FF7F50] px-7 py-3 rounded-full hover:bg-[#e5673e] transition-all shadow-[0_4px_14px_rgba(255,127,80,0.35)] font-heading">
                <Filter className="w-4 h-4" /> Filter by State <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-[#EDE8DF] py-2 w-[220px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                {activeStates.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/search?state=${s.slug}&category=${params.category}`}
                    className="block px-4 py-2.5 text-[14px] text-[#1A1A18] hover:bg-[#F5F0E8] hover:text-[#58bdae] transition-colors font-body"
                  >
                    {s.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {cards.length > 0 ? (
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
                      <div className="w-full h-full bg-gradient-to-br from-[#58bdae]/10 to-[#7A9E7E]/10 flex items-center justify-center"><Mountain className="w-12 h-12 text-[#58bdae]/40" /></div>
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
                    <h3 className="font-heading text-[20px] font-bold text-[#1A1A18] mb-1.5 leading-snug line-clamp-2 group-hover:text-[#58bdae] transition-colors">{pkg.title}</h3>
                    <p className="text-[13px] text-[#6B6560] font-body mb-3">by {pkg.guideName}</p>
                    <div className="flex gap-3.5 mb-4">
                      <span className="text-[13px] text-[#6B6560] flex items-center gap-1.5 font-body"><MapPin className="w-3.5 h-3.5" /> {pkg.destinationName}</span>
                      <span className="text-[13px] text-[#6B6560] flex items-center gap-1.5 font-body"><Clock className="w-3.5 h-3.5" /> {pkg.durationDays}D{pkg.durationNights > 0 && `/${pkg.durationNights}N`}</span>
                      <span className="text-[13px] text-[#6B6560] flex items-center gap-1.5 font-body"><Star className="w-3.5 h-3.5 fill-[#E8943A] text-[#E8943A]" /> {pkg.guideRating.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-[20px] font-semibold text-[#1A1A18] font-heading">
                        {pkg.price ? `₹${pkg.price.toLocaleString('en-IN')}` : 'On Request'} <small className="text-[12px] text-[#6B6560] font-light font-body">/person</small>
                      </div>
                      <span className="text-[13px] font-semibold text-white bg-[#FF7F50] px-4 py-2 rounded-full font-heading shadow-sm">
                        Book Now
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-[#F5F0E8] rounded-2xl p-10 text-center border border-[#EDE8DF]">
              <p className="text-[#6B6560] font-body text-lg mb-4">No {cat.label.toLowerCase()} experiences available yet.</p>
              <Link href="/search" className="inline-flex items-center gap-2 text-white bg-[#FF7F50] px-6 py-3 rounded-full font-bold text-sm hover:bg-[#e5673e] transition-colors font-heading">
                Browse All Experiences <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          <div className="sm:hidden text-center mt-6">
            <Link
              href={`/search?category=${params.category}`}
              className="inline-flex items-center gap-2 text-sm font-bold text-white bg-[#FF7F50] px-7 py-3 rounded-full hover:bg-[#e5673e] transition-all font-heading"
            >
              <Filter className="w-4 h-4" /> Filter by State
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ 8. RECOMMENDED — Horizontal Scroll ═══════════════ */}
      {recommended.length > 0 && (
        <section className="py-14 px-6 md:px-12 bg-[#F5F0E8]">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#58bdae] mb-2 font-body">{wp.plainText('recommended_label', 'Hand-picked for You')}</p>
                <h2 className="font-heading text-[clamp(26px,3.5vw,38px)] font-bold leading-[1.1] text-[#1A1A18]" dangerouslySetInnerHTML={{ __html: wp.text('recommended_title', sectionLabels.recommendedTitle) }} />
                <p className="text-[15px] text-[#6B6560] font-medium mt-2 font-body">{wp.plainText('recommended_subtitle', 'Top-rated, highly reviewed experiences loved by travellers')}</p>
              </div>
              <Link
                href={`/search?category=${params.category}&sort=rating`}
                className="hidden sm:inline-block text-sm font-bold text-white bg-[#FF7F50] px-7 py-3 rounded-full hover:bg-[#e5673e] hover:-translate-y-0.5 transition-all shadow-[0_4px_14px_rgba(255,127,80,0.35)] tracking-wide font-heading"
              >
                View All →
              </Link>
            </div>

            <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
              {recommended.map((p: any) => {
                const pkg = toCard(p);
                return (
                  <Link
                    key={pkg.id}
                    href={`/trips/${pkg.slug}`}
                    className="flex-shrink-0 w-[320px] rounded-[20px] overflow-hidden bg-white shadow-[0_2px_16px_rgba(28,26,23,0.06)] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(28,26,23,0.12)] transition-all duration-300 snap-start group"
                  >
                    <div className="relative w-full h-[210px] overflow-hidden">
                      {pkg.coverImage ? (
                        <img src={pkg.coverImage} alt={pkg.title} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#58bdae]/10 to-[#7A9E7E]/10 flex items-center justify-center"><Mountain className="w-12 h-12 text-[#58bdae]/40" /></div>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#58bdae] mb-1.5 font-body">
                        {pkg.activityType.replace(/_/g, ' ')}
                      </div>
                      <h3 className="font-heading text-[20px] font-bold text-[#1A1A18] mb-1.5 leading-snug line-clamp-2 group-hover:text-[#58bdae] transition-colors">{pkg.title}</h3>
                      <p className="text-[13px] text-[#6B6560] font-body mb-3">by {pkg.guideName}</p>
                      <div className="flex gap-3.5 mb-4">
                        <span className="text-[13px] text-[#6B6560] flex items-center gap-1.5 font-body"><MapPin className="w-3.5 h-3.5" /> {pkg.destinationName}</span>
                        <span className="text-[13px] text-[#6B6560] flex items-center gap-1.5 font-body"><Star className="w-3.5 h-3.5 fill-[#E8943A] text-[#E8943A]" /> {pkg.guideRating.toFixed(1)} ({pkg.guideReviewCount})</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-[20px] font-semibold text-[#1A1A18] font-heading">
                          {pkg.price ? `₹${pkg.price.toLocaleString('en-IN')}` : 'On Request'} <small className="text-[12px] text-[#6B6560] font-light font-body">/person</small>
                        </div>
                        <span className="text-[13px] font-semibold text-white bg-[#FF7F50] px-4 py-2 rounded-full font-heading shadow-sm">
                          Book Now
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="sm:hidden text-center mt-6">
              <Link
                href={`/search?category=${params.category}&sort=rating`}
                className="inline-block text-sm font-bold text-white bg-[#FF7F50] px-7 py-3 rounded-full hover:bg-[#e5673e] transition-all font-heading"
              >
                View All →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════ 9. OTHER EXPERIENCES ═══════════════ */}
      <section className="py-14 px-6 md:px-12 bg-[#1A1A18]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#FF7F50] mb-2 font-body">{wp.plainText('other_label', 'Explore More')}</p>
            <h2 className="font-heading text-[clamp(26px,3.5vw,38px)] font-bold leading-[1.1] text-white" dangerouslySetInnerHTML={{ __html: wp.text('other_title', 'Other <span class="text-[#58bdae]">Experiences</span>') }} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {otherCategories.map((c) => (
              <Link
                key={c.slug}
                href={`/experiences/${c.urlSlug}`}
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden"
              >
                <img src={c.image} alt={c.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute inset-0 p-5 flex flex-col justify-end">
                  <h3 className="font-heading text-lg font-bold text-white group-hover:text-[#FF7F50] transition-colors">{c.label}</h3>
                  <p className="text-[12px] text-white/60 font-body mt-1 line-clamp-1">{c.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 10. CORNERSTONE BLOG SECTION — 2 Adjacent Cards ═══════════════ */}
      <section className="py-14 px-6 md:px-12 bg-[#F5F0E8]">
        <div className="max-w-7xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#FF7F50] mb-2 font-body">{wp.plainText('blog_label', 'Travel Stories')}</p>
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-heading text-[clamp(26px,3.5vw,38px)] font-bold leading-[1.1] text-[#1A1A18]" dangerouslySetInnerHTML={{ __html: wp.text('blog_title', `${cat.label} <span class="text-[#58bdae]">Blog</span>`) }} />
              <p className="text-[15px] text-[#6B6560] font-medium mt-2 font-body">{wp.plainText('blog_subtitle', `Tips, itineraries, and guides for ${cat.label.toLowerCase()}`)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: `The Ultimate Guide to ${cat.label} in India — Everything You Need to Know`,
                image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80&fm=webp',
                slug: params.category,
              },
              {
                title: `Top 10 ${cat.label} Experiences That Will Change How You Travel`,
                image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80&fm=webp',
                slug: params.category,
              },
            ].map((blog, idx) => (
              <Link
                key={idx}
                href={`/blog/${blog.slug}`}
                className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_16px_rgba(28,26,23,0.06)] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(28,26,23,0.12)] transition-all duration-300 group"
              >
                <div className="relative h-[220px] overflow-hidden">
                  <img src={blog.image} alt={blog.title} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500" />
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

      {/* ═══════════════ 11. FAQ ═══════════════ */}
      <section className="py-14 px-6 md:px-12 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#58bdae] mb-2 font-body">{wp.plainText('faq_label', 'Got Questions?')}</p>
            <h2 className="font-heading text-[clamp(26px,3.5vw,38px)] font-bold leading-[1.1] text-[#1A1A18]" dangerouslySetInnerHTML={{ __html: wp.text('faq_title', 'Frequently Asked <span class="text-[#58bdae]">Questions</span>') }} />
          </div>
          {wpCategoryLanding?.categoryLandingFields?.faqItems?.length ? (
            <WPFaqSection faqs={wpCategoryLanding.categoryLandingFields.faqItems} />
          ) : (
            <div className="space-y-4">
              {[
                { q: `What are ${cat.label} experiences?`, a: `${cat.description}. On Book The Guide, you can browse, compare, and book ${cat.label.toLowerCase()} experiences with verified local experts across India.` },
                { q: `How do I book a ${cat.label.replace(/s$/, '').toLowerCase()} experience?`, a: `Search for ${cat.label.toLowerCase()} experiences on Book The Guide, compare guides by rating and price, and book instantly online. You can choose a fixed departure or request a custom trip.` },
                { q: `Are the guides verified?`, a: 'Yes! Every guide on Book The Guide is thoroughly verified with ID checks, experience verification, and ongoing review monitoring.' },
                { q: `What is the cancellation policy?`, a: 'Each guide sets their own cancellation policy, clearly displayed during booking. Fixed departures cancelled 7+ days before are typically eligible for full refunds.' },
                { q: `Which states offer ${cat.label.toLowerCase()} experiences?`, a: `${cat.label} experiences are available across ${statesWithProducts.map(s => s.name).join(', ') || 'multiple states in India'}. We are continuously expanding to new destinations.` },
              ].map((faq, idx) => (
                <div key={idx} className="bg-[#F5F0E8] rounded-2xl p-6 border border-[#EDE8DF]">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="w-5 h-5 text-[#FF7F50] flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-heading text-base font-semibold text-[#1A1A18] mb-2">{faq.q}</h3>
                      <p className="text-sm text-[#6B6560] leading-relaxed font-body">{faq.a}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════ 12. CORPORATE BOOKING CTA ═══════════════ */}
      <section className="py-16 px-6 md:px-12 bg-gradient-to-br from-[#58bdae] via-[#4aa99a] to-[#3d9485]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/70 mb-3 font-body">{wp.plainText('cta_label', 'Corporate Experiences')}</p>
          <h2 className="font-heading text-[clamp(28px,4vw,44px)] font-bold text-white leading-[1.1] mb-4" dangerouslySetInnerHTML={{ __html: wp.text('cta_title', 'Book The Guide for Corporate Booking') }} />
          <p className="text-white/80 text-[16px] font-body mb-8 max-w-2xl mx-auto leading-relaxed">
            {wp.plainText('cta_description', 'Want to create a team offsite experience beyond leisure resorts? Get in touch for your custom corporate experience with us.')}
          </p>
          <Link
            href="/corporate-trip"
            className="inline-flex items-center gap-2 bg-[#FF7F50] text-white font-bold text-[16px] px-10 py-4 rounded-full hover:bg-[#e5673e] hover:-translate-y-0.5 transition-all shadow-[0_6px_20px_rgba(255,127,80,0.4)] font-heading"
          >
            Contact for Corporate Bookings <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ═══════════════ WORDPRESS SEO CONTENT ═══════════════ */}
      {wpCategoryLanding?.categoryLandingFields && (
        <>
          <WPSeoContentBlock content={wpCategoryLanding.categoryLandingFields.seoContentBlock} />
          <WPInternalLinksGrid links={wpCategoryLanding.categoryLandingFields.internalLinks} />
        </>
      )}

      {/* ═══════════════ JSON-LD SCHEMAS ═══════════════ */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'CollectionPage',
        name: cat.label, description: cat.description,
        url: `https://www.booktheguide.com/experiences/${params.category}`,
        numberOfItems: products.length,
        provider: { '@type': 'Organization', name: 'Book The Guide', url: 'https://www.booktheguide.com' },
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: `What are ${cat.label}?`, acceptedAnswer: { '@type': 'Answer', text: cat.description } },
          { '@type': 'Question', name: `How do I book ${cat.label.toLowerCase()}?`, acceptedAnswer: { '@type': 'Answer', text: `Search for ${cat.label.toLowerCase()} on Book The Guide and book instantly online.` } },
          { '@type': 'Question', name: `Are ${cat.label.toLowerCase()} guides verified?`, acceptedAnswer: { '@type': 'Answer', text: 'Yes! Every guide on Book The Guide is thoroughly verified.' } },
        ],
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.booktheguide.com' },
          { '@type': 'ListItem', position: 2, name: 'Experiences', item: 'https://www.booktheguide.com/experiences' },
          { '@type': 'ListItem', position: 3, name: cat.label, item: `https://www.booktheguide.com/experiences/${params.category}` },
        ],
      }) }} />
    </div>
  );
}
