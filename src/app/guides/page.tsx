import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { MapPin, Star, Shield, Users, Search } from 'lucide-react';
import { getPageBySlug, wpSeoToMetadata, getPageContent } from '@/lib/wordpress';

export const revalidate = 120;
import { WPSeoContentBlock, WPFaqSection, WPInternalLinksGrid } from '@/components/wordpress/WPContentBlocks';

export async function generateMetadata(): Promise<Metadata> {
  const wpPage = await getPageBySlug('guides');
  if (wpPage?.seo) {
    return wpSeoToMetadata(wpPage.seo, {
      title: 'All Guides - Verified Local Experts | Book The Guide',
      description: 'Browse verified local guides across India. Find expert tour guides, trek leaders, heritage walk specialists, and adventure guides for your next trip.',
      url: 'https://www.booktheguide.com/guides',
    });
  }
  return {
    title: 'All Guides - Verified Local Experts | Book The Guide',
    description: 'Browse verified local guides across India. Find expert tour guides, trek leaders, heritage walk specialists, and adventure guides for your next trip.',
    keywords: 'local guides India, tour guides, trek guides, verified guides, heritage walk guides, adventure guides',
    openGraph: {
      title: 'Browse All Guides | Book The Guide',
      description: 'Connect with verified local guides across India for authentic travel experiences.',
      images: ['/images/og-guides.jpg'],
    },
  };
}

// Service area type for guides
interface ServiceArea {
  state: { name: string };
  cities: { name: string }[];
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
  user: {
    name: string;
    image: string | null;
  };
  serviceAreas: ServiceArea[];
  _count: {
    products: number;
  };
}

export default async function AllGuidesPage() {
  const wp = await getPageContent('guides');

  // Fetch all active and verified guides
  const guides = await prisma.guideProfile.findMany({
    where: {
      isActive: true,
      isVerified: true,
    },
    include: {
      user: { select: { name: true, image: true } },
      serviceAreas: {
        include: {
          state: { select: { name: true } },
        },
      },
      _count: { select: { products: true } },
    },
    orderBy: [
      { averageRating: 'desc' },
      { totalTrips: 'desc' },
    ],
  }) as unknown as GuideData[];

  // Group guides by primary state for filtering
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
    <div className="bg-btg-cream min-h-screen">
      {/* Hero Section */}
      <section className="bg-[#1A1A18] pt-32 pb-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#58bdae] mb-3">
            {wp.plainText('hero_label', 'Verified Experts')}
          </p>
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4"
              dangerouslySetInnerHTML={{ __html: wp.text('hero_title', 'All <em class="italic text-[#58bdae]">Guides</em>') }} />
          <p className="text-white/60 text-lg font-body max-w-xl">
            {wp.plainText('hero_description', 'Browse our network of verified local experts. Each guide is background-checked and certified to give you the best travel experience.')}
          </p>
          <div className="flex items-center gap-8 mt-8">
            <div className="text-center">
              <div className="font-heading text-3xl font-bold text-white">{guides.length}+</div>
              <div className="text-white/50 text-sm font-body">Verified Guides</div>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <div className="font-heading text-3xl font-bold text-white">{states.length}</div>
              <div className="text-white/50 text-sm font-body">States Covered</div>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <div className="font-heading text-3xl font-bold text-white">4.8</div>
              <div className="text-white/50 text-sm font-body">Avg Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Bar */}
      <div className="border-b border-[#1A1A18]/[0.08] bg-white sticky top-[64px] z-30">
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6560]" />
              <input
                type="text"
                placeholder="Search guides by name or specialization..."
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#F5F0E8] border border-[#EDE8DF] text-sm focus:outline-none focus:ring-2 focus:ring-[#58bdae]/40 focus:border-[#58bdae] font-body"
              />
            </div>

            {/* State Filter Pills */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button className="px-4 py-2 rounded-full text-sm font-medium bg-[#58bdae] text-white whitespace-nowrap">
                All States
              </button>
              {states.slice(0, 5).map((state) => (
                <Link
                  key={state}
                  href={`/guides?state=${encodeURIComponent(state)}`}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-[#F5F0E8] text-[#6B6560] hover:bg-[#58bdae]/10 hover:text-[#58bdae] transition-colors whitespace-nowrap"
                >
                  {state}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Guides Grid */}
      <section className="py-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          {guides.length > 0 ? (
            <>
              <p className="text-sm text-[#6B6560] mb-6 font-body">
                Showing {guides.length} verified guides
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {guides.map((guide) => (
                  <Link
                    key={guide.id}
                    href={`/guides/${guide.slug}`}
                    className="group bg-white rounded-2xl overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
                  >
                    {/* Cover Image */}
                    <div className="relative h-40 bg-gradient-to-br from-[#58bdae]/20 to-[#58bdae]/5 overflow-hidden">
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
                      {/* Verified Badge */}
                      {guide.isVerified && (
                        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1 shadow-sm">
                          <Shield className="w-3.5 h-3.5 text-[#58bdae]" />
                          <span className="text-[10px] font-semibold text-[#58bdae]">Verified</span>
                        </div>
                      )}
                    </div>

                    {/* Avatar - overlapping */}
                    <div className="relative px-5">
                      <div className="absolute -top-8 left-5 w-16 h-16 rounded-full border-4 border-white bg-[#58bdae] flex items-center justify-center overflow-hidden shadow-md">
                        {guide.user.image ? (
                          <img
                            src={guide.user.image}
                            alt={guide.user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl font-bold text-white">
                            {guide.user.name.charAt(0)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="pt-10 pb-5 px-5">
                      <h3 className="font-heading text-lg font-bold text-[#1A1A18] group-hover:text-[#58bdae] transition-colors">
                        {guide.user.name}
                      </h3>
                      {guide.tagline && (
                        <p className="text-sm text-[#6B6560] font-body mt-1 line-clamp-1">
                          {guide.tagline}
                        </p>
                      )}

                      {/* Location */}
                      {guide.serviceAreas.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2 text-sm text-[#6B6560]">
                          <MapPin className="w-3.5 h-3.5 text-[#58bdae]" />
                          <span className="font-body">
                            {guide.serviceAreas[0].state.name}
                          </span>
                        </div>
                      )}

                      {/* Stats Row */}
                      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#EDE8DF]">
                        {/* Rating */}
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-[#E8943A] text-[#E8943A]" />
                          <span className="text-sm font-semibold text-[#1A1A18]">
                            {guide.averageRating.toFixed(1)}
                          </span>
                          <span className="text-xs text-[#6B6560]">
                            ({guide.totalReviews})
                          </span>
                        </div>

                        <div className="w-px h-4 bg-[#EDE8DF]" />

                        {/* Experience */}
                        {guide.experienceYears && (
                          <>
                            <span className="text-sm text-[#6B6560]">
                              {guide.experienceYears} yrs exp
                            </span>
                            <div className="w-px h-4 bg-[#EDE8DF]" />
                          </>
                        )}

                        {/* Trips */}
                        <span className="text-sm text-[#6B6560]">
                          {guide.totalTrips} trips
                        </span>
                      </div>

                      {/* Specializations */}
                      {guide.specializations.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {guide.specializations.slice(0, 3).map((spec) => (
                            <span
                              key={spec}
                              className="text-[10px] font-medium tracking-wide uppercase px-2 py-1 rounded-full bg-[#58bdae]/10 text-[#58bdae]"
                            >
                              {spec}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-[#58bdae]/10 flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-[#58bdae]" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-[#1A1A18] mb-3">
                No Guides Available Yet
              </h2>
              <p className="text-[#6B6560] font-body mb-8 max-w-md mx-auto">
                We&apos;re onboarding verified guides from across India. Check back soon or explore our packages.
              </p>
              <Link
                href="/search"
                className="inline-block text-sm font-bold text-white bg-[#58bdae] px-8 py-3.5 rounded-full hover:bg-[#4aa99b] transition-all tracking-wide font-heading"
              >
                Explore Packages
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 md:px-12 bg-[#EDE8DF]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#58bdae] mb-3">
            {wp.plainText('cta_label', 'Join Our Network')}
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#1A1A18] mb-4">
            {wp.plainText('cta_title', 'Are You a Local Guide?')}
          </h2>
          <p className="text-[#6B6560] font-body max-w-xl mx-auto mb-8">
            {wp.plainText('cta_description', "Join India's premier guide booking platform. Create your profile, set your prices, and start receiving bookings from travellers worldwide.")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register?role=guide"
              className="text-sm font-bold text-white bg-[#6B6560] px-8 py-3.5 rounded-full hover:bg-[#58bdae] transition-all tracking-wide font-heading"
            >
              Register as Guide
            </Link>
            <Link
              href="/about#for-guides"
              className="text-sm font-bold text-[#1A1A18] bg-white px-8 py-3.5 rounded-full hover:bg-[#58bdae] hover:text-white transition-all tracking-wide font-heading border border-[#1A1A18]/10"
            >
              Learn More
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
