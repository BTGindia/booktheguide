import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { MapPin, Star, Shield, Users, ChevronRight, ArrowRight } from 'lucide-react';
import { CATEGORY_MAP, CATEGORIES_ORDERED, type PackageCategorySlug } from '@/lib/categories';
import { getDisabledCategorySlugs } from '@/lib/active-packages';
import { getCategoryLanding, getCategoryLandingContent, wpSeoToMetadata } from '@/lib/wordpress';
import { WPFaqSection, WPSeoContentBlock, WPInternalLinksGrid } from '@/components/wordpress/WPContentBlocks';

const SLUG_TO_CATEGORY: Record<string, PackageCategorySlug> = {
  'tourist-guides': 'TOURIST_GUIDES',
  'group-trips': 'GROUP_TRIPS',
  'adventure-guides': 'ADVENTURE_GUIDES',
  'heritage-walks': 'HERITAGE_WALKS',
  'travel-with-influencers': 'TRAVEL_WITH_INFLUENCERS',
  'influencer-trips': 'TRAVEL_WITH_INFLUENCERS',
};

const CATEGORY_GUIDE_META: Record<string, { title: string; description: string; guideLabel: string }> = {
  TOURIST_GUIDES: {
    title: 'Tourist Guides in India',
    description: 'Browse verified local tourist guides across India. Expert city tour leaders, food tour hosts, and sightseeing specialists.',
    guideLabel: 'Tourist Guides',
  },
  GROUP_TRIPS: {
    title: 'Group Trip Leaders in India',
    description: 'Find experienced group trip leaders for treks, retreats, and fixed-departure adventures across India.',
    guideLabel: 'Group Trip Leaders',
  },
  ADVENTURE_GUIDES: {
    title: 'Adventure Guides in India',
    description: 'Certified adventure guides for trekking, rafting, paragliding, rock climbing and more. Safety-vetted experts.',
    guideLabel: 'Adventure Guides',
  },
  HERITAGE_WALKS: {
    title: 'Heritage Walk Guides in India',
    description: 'Knowledgeable heritage walk specialists who bring India\'s history alive. Fort trails, temple walks, old city tours.',
    guideLabel: 'Heritage Walk Guides',
  },
  TRAVEL_WITH_INFLUENCERS: {
    title: 'Travel Influencers on Book The Guide',
    description: 'Travel alongside popular creators and influencers on curated trips. Photography workshops, content creation journeys.',
    guideLabel: 'Travel Influencers',
  },
};

export async function generateMetadata({ params }: { params: { specialty: string } }): Promise<Metadata> {
  const slug = SLUG_TO_CATEGORY[params.specialty];
  if (!slug) return { title: 'Not Found' };

  const meta = CATEGORY_GUIDE_META[slug];
  const cat = CATEGORY_MAP[slug];

  const wpCategoryLanding = await getCategoryLanding(params.specialty);
  if (wpCategoryLanding?.seo) {
    return wpSeoToMetadata(wpCategoryLanding.seo, {
      title: `${meta.title} — Verified Local Experts | Book The Guide`,
      description: meta.description,
      url: `https://www.booktheguide.com/guides/specialty/${params.specialty}`,
    });
  }

  return {
    title: `${meta.title} — Verified Local Experts | Book The Guide`,
    description: `${meta.description} ✓ Rated 4.8★ ✓ Verified & Certified`,
    keywords: `${meta.guideLabel}, ${cat.label}, local guides India, verified guides, ${cat.activityTypes.slice(0, 3).join(', ')}`,
    openGraph: {
      title: `${meta.guideLabel} | Book The Guide`,
      description: meta.description,
      url: `https://www.booktheguide.com/guides/specialty/${params.specialty}`,
    },
    alternates: {
      canonical: `https://www.booktheguide.com/guides/specialty/${params.specialty}`,
    },
  };
}

// ISR: render on-demand, cache for 60s, regenerate in background
export const revalidate = 60;

export async function generateStaticParams() {
  // Return empty to skip build-time prerendering (avoids DB connection exhaustion)
  return [];
}

interface GuideData {
  id: string;
  slug: string;
  tagline: string | null;
  bio: string | null;
  experienceYears: number | null;
  averageRating: number;
  totalReviews: number;
  totalTrips: number;
  languages: string[];
  specializations: string[];
  certifications: string[];
  isVerified: boolean;
  coverImage: string | null;
  portfolioImages: string[];
  user: { name: string; image: string | null };
  serviceAreas: { state: { name: string } }[];
  _count: { products: number };
}

export default async function GuideSpecialtyPage({ params }: { params: { specialty: string } }) {
  const slug = SLUG_TO_CATEGORY[params.specialty];
  if (!slug) notFound();

  // Check if this category is disabled
  const disabledSlugs = await getDisabledCategorySlugs();
  if (disabledSlugs.has(slug)) notFound();

  const cat = CATEGORY_MAP[slug];
  const meta = CATEGORY_GUIDE_META[slug];

  const [guides, wpCategoryLanding, wp] = await Promise.all([
    prisma.guideProfile.findMany({
      where: {
        isActive: true,
        isVerified: true,
        products: { some: { packageCategory: slug, status: 'APPROVED', isActive: true } },
      },
      include: {
        user: { select: { name: true, image: true } },
        serviceAreas: {
          include: {
            state: { select: { name: true } },
          },
        },
        _count: { select: { products: { where: { packageCategory: slug, status: 'APPROVED' } } } },
      },
      orderBy: [{ averageRating: 'desc' }, { totalTrips: 'desc' }],
    }) as unknown as Promise<GuideData[]>,
    getCategoryLanding(params.specialty),
    getCategoryLandingContent(params.specialty),
  ]);

  const otherCategories = CATEGORIES_ORDERED.filter((c) => c.slug !== slug && !disabledSlugs.has(c.slug));

  const guidesByState: Record<string, GuideData[]> = {};
  guides.forEach((guide) => {
    if (guide.serviceAreas.length > 0) {
      const stateName = guide.serviceAreas[0].state.name;
      if (!guidesByState[stateName]) guidesByState[stateName] = [];
      guidesByState[stateName].push(guide);
    }
  });
  const states = Object.keys(guidesByState).sort();

  return (
    <div className="min-h-screen bg-white">

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative min-h-[50vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={cat.image} alt={meta.guideLabel} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A18]/90 via-[#1A1A18]/75 to-transparent" />
        </div>
        <div className="relative z-10 w-full px-6 md:px-12 py-28">
          <div className="max-w-7xl mx-auto">
            <nav className="flex items-center gap-2 text-sm text-white/50 mb-6 font-body">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link href="/guides" className="hover:text-white transition-colors">Guides</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#FF7F50]">{meta.guideLabel}</span>
            </nav>
            <h1 className="font-heading text-[clamp(36px,5vw,64px)] font-bold text-white leading-[1.05] mb-4">
              {meta.guideLabel}
            </h1>
            <p className="text-white/70 text-lg md:text-xl max-w-2xl mb-8 font-body leading-relaxed">
              {wp.plainText('hero_description', meta.description)}
            </p>
            <div className="flex flex-wrap gap-5 text-white/80 text-sm font-body">
              <span className="bg-white/10 backdrop-blur-sm px-5 py-2.5 rounded-full">{guides.length}+ Verified Guides</span>
              <span className="bg-white/10 backdrop-blur-sm px-5 py-2.5 rounded-full">{states.length} States</span>
              <span className="bg-white/10 backdrop-blur-sm px-5 py-2.5 rounded-full">4.8★ Avg Rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ STATE FILTER PILLS ═══════════════ */}
      {states.length > 0 && (
        <section className="py-8 px-6 md:px-12 bg-[#F5F0E8] border-b border-[#EDE8DF]">
          <div className="max-w-7xl mx-auto">
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#58bdae] mb-3 font-body">Filter by State</p>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {states.map((state) => (
                <a
                  key={state}
                  href={`#state-${state.toLowerCase().replace(/\s+/g, '-')}`}
                  className="flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-medium bg-white text-[#1A1A18] hover:bg-[#58bdae] hover:text-white transition-colors border border-[#EDE8DF] font-body"
                >
                  {state} ({guidesByState[state].length})
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════ ALL GUIDES GRID — BY STATE ═══════════════ */}
      <section className="py-14 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-heading text-[clamp(26px,3.5vw,38px)] font-bold leading-[1.1] text-[#1A1A18] mb-2" dangerouslySetInnerHTML={{ __html: wp.text('all_title', `All <span class="text-[#58bdae]">${meta.guideLabel}</span>`) }} />
          <p className="text-[15px] text-[#6B6560] font-body mb-10">
            {wp.plainText('all_subtitle', `${guides.length} verified guides specializing in ${cat.label.toLowerCase()}`)}
          </p>

          {states.length > 0 ? (
            <div className="space-y-14">
              {states.map((state) => (
                <div key={state} id={`state-${state.toLowerCase().replace(/\s+/g, '-')}`}>
                  <h3 className="font-heading text-xl font-bold text-[#1A1A18] mb-5 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#58bdae]" /> {state}
                    <span className="text-sm font-normal text-[#6B6560]">({guidesByState[state].length} guides)</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {guidesByState[state].map((guide) => (
                      <Link
                        key={guide.id}
                        href={`/guides/${guide.slug}`}
                        className="group bg-white rounded-2xl overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:shadow-lg transition-all duration-300 border border-[#EDE8DF] hover:border-[#58bdae]"
                      >
                        <div className="relative h-36 bg-gradient-to-br from-[#58bdae]/20 to-[#58bdae]/5 overflow-hidden">
                          {guide.coverImage || guide.portfolioImages?.[0] ? (
                            <img
                              src={guide.coverImage || guide.portfolioImages[0]}
                              alt={guide.user.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-4xl">🏔️</span>
                            </div>
                          )}
                          {guide.isVerified && (
                            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1 shadow-sm">
                              <Shield className="w-3.5 h-3.5 text-[#58bdae]" />
                              <span className="text-[10px] font-semibold text-[#58bdae]">Verified</span>
                            </div>
                          )}
                        </div>

                        <div className="relative px-5">
                          <div className="absolute -top-8 left-5 w-16 h-16 rounded-full border-4 border-white bg-[#58bdae] flex items-center justify-center overflow-hidden shadow-md">
                            {guide.user.image ? (
                              <img src={guide.user.image} alt={guide.user.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl font-bold text-white">{guide.user.name.charAt(0)}</span>
                            )}
                          </div>
                        </div>

                        <div className="pt-10 pb-5 px-5">
                          <h4 className="font-heading text-lg font-bold text-[#1A1A18] group-hover:text-[#58bdae] transition-colors">
                            {guide.user.name}
                          </h4>
                          {guide.tagline && (
                            <p className="text-sm text-[#6B6560] font-body mt-1 line-clamp-1">{guide.tagline}</p>
                          )}

                          {guide.serviceAreas.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-2 text-sm text-[#6B6560]">
                              <MapPin className="w-3.5 h-3.5 text-[#58bdae]" />
                              <span className="font-body">
                                {guide.serviceAreas[0].state.name}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#EDE8DF]">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-[#E8943A] text-[#E8943A]" />
                              <span className="text-sm font-semibold text-[#1A1A18]">{guide.averageRating.toFixed(1)}</span>
                              <span className="text-xs text-[#6B6560]">({guide.totalReviews})</span>
                            </div>
                            <div className="w-px h-4 bg-[#EDE8DF]" />
                            <span className="text-sm text-[#6B6560]">{guide._count.products} trips</span>
                            {guide.experienceYears ? (
                              <>
                                <div className="w-px h-4 bg-[#EDE8DF]" />
                                <span className="text-sm text-[#6B6560]">{guide.experienceYears} yrs</span>
                              </>
                            ) : null}
                          </div>

                          {guide.specializations.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {guide.specializations.slice(0, 3).map((spec) => (
                                <span key={spec} className="text-[10px] font-medium tracking-wide uppercase px-2 py-1 rounded-full bg-[#58bdae]/10 text-[#58bdae]">
                                  {spec}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#F5F0E8] rounded-2xl p-10 text-center border border-[#EDE8DF]">
              <div className="w-20 h-20 rounded-full bg-[#58bdae]/10 flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-[#58bdae]" />
              </div>
              <h3 className="font-heading text-2xl font-bold text-[#1A1A18] mb-3">
                No {meta.guideLabel} Available Yet
              </h3>
              <p className="text-[#6B6560] font-body mb-8 max-w-md mx-auto">
                We&apos;re onboarding verified guides from across India. Check back soon or explore our packages.
              </p>
              <Link
                href={`/experiences/${params.specialty}`}
                className="inline-flex items-center gap-2 text-sm font-bold text-white bg-[#FF7F50] px-8 py-3.5 rounded-full hover:bg-[#e5673e] transition-all font-heading"
              >
                Browse {cat.label} Experiences <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════ OTHER GUIDE CATEGORIES ═══════════════ */}
      <section className="py-14 px-6 md:px-12 bg-[#1A1A18]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#FF7F50] mb-2 font-body">Explore More</p>
            <h2 className="font-heading text-[clamp(26px,3.5vw,38px)] font-bold leading-[1.1] text-white">
              Other <span className="text-[#58bdae]">Guide Categories</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {otherCategories.map((c) => (
              <Link key={c.slug} href={`/guides/specialty/${c.urlSlug}`} className="group relative aspect-[4/3] rounded-2xl overflow-hidden">
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

      {/* ═══════════════ CTA ═══════════════ */}
      <section className="py-16 px-6 md:px-12 bg-gradient-to-br from-[#58bdae] via-[#4aa99a] to-[#3d9485]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-[clamp(28px,4vw,44px)] font-bold text-white leading-[1.1] mb-4" dangerouslySetInnerHTML={{ __html: wp.text('cta_title', 'Book The Guide for <span class="text-white/80">Corporate Booking</span>') }} />
          <p className="text-white/80 text-[16px] font-body mb-8 max-w-2xl mx-auto leading-relaxed">
            {wp.plainText('cta_description', 'Want to create a team offsite experience beyond leisure resorts? Get in touch for your custom corporate experience with us.')}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/corporate-trip" className="inline-flex items-center gap-2 bg-[#FF7F50] text-white font-bold text-[16px] px-10 py-4 rounded-full hover:bg-[#e5673e] transition-all shadow-[0_6px_20px_rgba(255,127,80,0.4)] font-heading">
              Contact for Corporate Bookings <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href={`/experiences/${params.specialty}`} className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white font-bold text-[16px] px-10 py-4 rounded-full hover:bg-white/30 transition-all font-heading">
              View {cat.label} Experiences
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ WORDPRESS SEO ═══════════════ */}
      {wpCategoryLanding?.categoryLandingFields && (
        <>
          <WPSeoContentBlock content={wpCategoryLanding.categoryLandingFields.seoContentBlock} />
          <WPFaqSection faqs={wpCategoryLanding.categoryLandingFields.faqItems} />
          <WPInternalLinksGrid links={wpCategoryLanding.categoryLandingFields.internalLinks} />
        </>
      )}

      {/* ═══════════════ JSON-LD ═══════════════ */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'CollectionPage',
        name: meta.guideLabel, description: meta.description,
        url: `https://www.booktheguide.com/guides/specialty/${params.specialty}`,
        numberOfItems: guides.length,
        provider: { '@type': 'Organization', name: 'Book The Guide', url: 'https://www.booktheguide.com' },
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.booktheguide.com' },
          { '@type': 'ListItem', position: 2, name: 'Guides', item: 'https://www.booktheguide.com/guides' },
          { '@type': 'ListItem', position: 3, name: meta.guideLabel, item: `https://www.booktheguide.com/guides/specialty/${params.specialty}` },
        ],
      }) }} />
    </div>
  );
}
