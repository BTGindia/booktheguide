// ─────────────────────────────────────────────────────────────
//  SEO Landing Page Template
// ─────────────────────────────────────────────────────────────
//
//  Shared template for all SEO landing pages (trek packages).
//  Sections:
//    1. Hero — Featured image + H1 + badges
//    2. Social Proofs — Rating, completed treks, safety
//    3. Top Packages — Horizontal scroll of recommended packages
//    4. SEO Content — WordPress-managed
//    5. Reviews — Guide reviews
//    6. Social Media — Instagram / social feed
//    7. Corporate Booking CTA
//
// ─────────────────────────────────────────────────────────────

import Link from 'next/link';
import Image from 'next/image';
import { Star, Shield, Mountain, Calendar, ChevronRight, Award, Users, CheckCircle, ArrowRight, Instagram, Phone, Mail } from 'lucide-react';
import { PackageCard, type PackageCardData } from '@/components/PackageCard';
import { WPSeoContentBlock, WPFaqSection, WPInternalLinksGrid } from '@/components/wordpress/WPContentBlocks';
import type { LandingPageData } from '@/lib/landing-pages';
import type { PageContent } from '@/lib/wordpress';
import type { WPFaqItem, WPInternalLink } from '@/lib/wordpress/types';

interface LandingPageTemplateProps {
  landing: LandingPageData;
  wp: PageContent;
  packages: PackageCardData[];
  reviews: {
    id: string;
    rating: number;
    comment: string;
    userName: string;
    userImage: string | null;
    createdAt: Date;
    tripTitle?: string;
  }[];
  stats: {
    avgRating: number;
    totalReviews: number;
    completedTrips: number;
    totalGuides: number;
  };
}

/* ── Difficulty color helper ── */
function difficultyColor(level: string) {
  switch (level) {
    case 'Easy': return 'bg-green-100 text-green-800';
    case 'Moderate': return 'bg-yellow-100 text-yellow-800';
    case 'Difficult': return 'bg-orange-100 text-orange-800';
    case 'Extreme': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-700';
  }
}

export default function LandingPageTemplate({
  landing,
  wp,
  packages,
  reviews,
  stats,
}: LandingPageTemplateProps) {
  const heroImage = wp.image('hero_image', '/images/btg/optimized/frame-7.webp');
  const heroTitle = wp.text('hero_title', landing.defaultH1);

  return (
    <main className="bg-btg-cream min-h-screen">
      {/* ═══════════════ 1. HERO SECTION ═══════════════ */}
      <section className="relative h-[70vh] min-h-[480px] flex flex-col justify-end overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

        <div className="relative z-10 w-full px-6 md:px-12 lg:px-16 pb-12 md:pb-16">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-white/60 mb-4">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href={`/explore/${landing.region === 'uk' ? 'uttarakhand' : landing.region}`} className="hover:text-white transition-colors">
              {landing.stateName}
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/90">{landing.destination}</span>
          </nav>

          {/* H1 title */}
          <h1
            className="font-heading text-[clamp(32px,5vw,56px)] font-bold leading-[1.1] text-white mb-5"
            dangerouslySetInnerHTML={{ __html: heroTitle }}
          />

          {/* Description */}
          <p className="text-[15px] text-white/70 font-light max-w-2xl mb-6">
            {wp.plainText('hero_description', landing.defaultDescription)}
          </p>

          {/* Badges */}
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/15 backdrop-blur-sm rounded-full text-xs font-medium text-white border border-white/20">
              <Calendar className="w-3.5 h-3.5" />
              {landing.bestSeason}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold ${difficultyColor(landing.difficulty)}`}>
              <Mountain className="w-3.5 h-3.5" />
              {landing.difficulty}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/15 backdrop-blur-sm rounded-full text-xs font-medium text-white border border-white/20">
              <CheckCircle className="w-3.5 h-3.5" />
              Flexible Cancellation
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/15 backdrop-blur-sm rounded-full text-xs font-medium text-white border border-white/20">
              <Award className="w-3.5 h-3.5" />
              Certified Local Guides
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════════ 2. SOCIAL PROOFS ═══════════════ */}
      <section className="bg-white border-b border-btg-sand">
        <div className="w-full px-6 md:px-12 lg:px-16 py-6">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-8 md:gap-16">
            {/* Average Rating */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Star className="w-6 h-6 text-btg-gold fill-btg-gold" />
                <span className="text-2xl font-bold text-btg-dark">{stats.avgRating.toFixed(1)}</span>
              </div>
              <div className="text-xs text-btg-light-text leading-tight">
                <p className="font-medium text-btg-dark">Avg Rating</p>
                <p>{stats.totalReviews} reviews</p>
              </div>
            </div>

            {/* Completed Treks */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-btg-terracotta/10 flex items-center justify-center">
                <Mountain className="w-5 h-5 text-btg-terracotta" />
              </div>
              <div className="text-xs text-btg-light-text leading-tight">
                <p className="font-medium text-btg-dark text-lg">{stats.completedTrips}+</p>
                <p>Treks Completed</p>
              </div>
            </div>

            {/* Safety Record */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-xs text-btg-light-text leading-tight">
                <p className="font-medium text-btg-dark text-lg">100%</p>
                <p>Safe Record</p>
              </div>
            </div>

            {/* Certified Guides */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-btg-terracotta/10 flex items-center justify-center">
                <Award className="w-5 h-5 text-btg-terracotta" />
              </div>
              <div className="text-xs text-btg-light-text leading-tight">
                <p className="font-medium text-btg-dark text-lg">{stats.totalGuides}</p>
                <p>Certified Guides</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ 3. TOP PACKAGES ═══════════════ */}
      <section className="py-12 lg:py-20">
        <div className="w-full px-6 md:px-12 lg:px-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-btg-terracotta mb-2">
                {wp.plainText('packages_label', 'Recommended')}
              </p>
              <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-bold text-btg-dark">
                {wp.plainText('packages_heading', `Top ${landing.destination} Packages by Certified Local Guides`)}
              </h2>
            </div>
            <Link
              href={`/search?destination=${encodeURIComponent(landing.destination)}&category=${encodeURIComponent(landing.category)}`}
              className="hidden md:inline-flex items-center gap-2 text-sm font-medium text-btg-terracotta hover:text-btg-rust transition-colors"
            >
              Explore All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {packages.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-[20px] border border-btg-sand">
              <Mountain className="w-12 h-12 text-btg-light-text mx-auto mb-4" />
              <h3 className="font-heading text-xl font-medium text-btg-dark mb-2">
                Coming Soon
              </h3>
              <p className="text-btg-light-text text-sm mb-6 max-w-md mx-auto">
                We&apos;re onboarding certified local guides for {landing.destination}. Check back soon for curated packages.
              </p>
              <Link
                href="/search"
                className="inline-block text-sm font-medium text-white bg-btg-terracotta px-8 py-3.5 rounded-full hover:bg-btg-rust transition-colors"
              >
                Browse All Packages
              </Link>
            </div>
          ) : (
            <>
              {/* Horizontal scroll on mobile, grid on desktop */}
              <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-x-auto pb-4 md:pb-0 snap-x snap-mandatory scrollbar-hide">
                {packages.map((pkg) => (
                  <div key={pkg.id} className="min-w-[300px] md:min-w-0 snap-start">
                    <PackageCard pkg={pkg} />
                  </div>
                ))}
              </div>

              {/* Mobile CTA */}
              <div className="mt-6 text-center md:hidden">
                <Link
                  href={`/search?destination=${encodeURIComponent(landing.destination)}&category=${encodeURIComponent(landing.category)}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-white bg-btg-terracotta px-8 py-3.5 rounded-full hover:bg-btg-rust transition-colors"
                >
                  Explore All <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ═══════════════ 4. SEO CONTENT (WordPress) ═══════════════ */}
      {wp.seoContentBlock && (
        <section className="py-12 lg:py-20 bg-white">
          <WPSeoContentBlock
            content={wp.seoContentBlock}
            heading={wp.plainText('seo_heading', `About ${landing.destination}`)}
          />
        </section>
      )}

      {/* ═══════════════ 5. REVIEWS SECTION ═══════════════ */}
      {reviews.length > 0 && (
        <section className="py-12 lg:py-20">
          <div className="w-full px-6 md:px-12 lg:px-16">
            <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-btg-terracotta mb-2">
              Traveller Stories
            </p>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-btg-dark mb-8">
              {wp.plainText('reviews_heading', `What Trekkers Say About ${landing.destination}`)}
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white rounded-[20px] border border-btg-sand p-6 hover:shadow-[0_2px_16px_rgba(28,26,23,0.06)] transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-4">
                    {review.userImage ? (
                      <Image
                        src={review.userImage}
                        alt={review.userName}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-btg-terracotta/10 flex items-center justify-center text-btg-terracotta font-semibold text-sm">
                        {review.userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-btg-dark text-sm">{review.userName}</p>
                      {review.tripTitle && (
                        <p className="text-xs text-btg-light-text">{review.tripTitle}</p>
                      )}
                    </div>
                    <div className="ml-auto flex items-center gap-1">
                      <Star className="w-4 h-4 text-btg-gold fill-btg-gold" />
                      <span className="text-sm font-semibold text-btg-dark">{review.rating}</span>
                    </div>
                  </div>
                  <p className="text-sm text-btg-light-text leading-relaxed line-clamp-4">
                    {review.comment}
                  </p>
                  <p className="text-xs text-btg-light-text/60 mt-3">
                    {new Date(review.createdAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════ 6. SOCIAL MEDIA SECTION ═══════════════ */}
      <section className="py-12 lg:py-20 bg-white">
        <div className="w-full px-6 md:px-12 lg:px-16">
          <div className="text-center mb-10">
            <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-btg-terracotta mb-2">
              Follow Us
            </p>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-btg-dark mb-3">
              {wp.plainText('social_heading', `${landing.destination} on Social Media`)}
            </h2>
            <p className="text-sm text-btg-light-text max-w-lg mx-auto">
              Follow @booktheguide on Instagram for real trail updates, guide stories, and stunning views from {landing.destination}.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://www.instagram.com/booktheguide"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Instagram className="w-5 h-5" />
              Follow on Instagram
            </a>
            <a
              href="https://www.youtube.com/@booktheguide"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-6 py-3 bg-red-600 text-white rounded-full text-sm font-medium hover:bg-red-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 00.5 6.19 31.56 31.56 0 000 12a31.56 31.56 0 00.5 5.81 3.02 3.02 0 002.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 002.12-2.14A31.56 31.56 0 0024 12a31.56 31.56 0 00-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg>
              Subscribe on YouTube
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════ 7. CORPORATE BOOKING CTA ═══════════════ */}
      <section className="py-12 lg:py-20">
        <div className="w-full px-6 md:px-12 lg:px-16">
          <div className="relative bg-btg-dark rounded-[20px] overflow-hidden p-8 md:p-12 lg:p-16">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-btg-terracotta/10 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-btg-terracotta/5 rounded-full translate-y-1/3 -translate-x-1/4" />

            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center gap-8 lg:gap-16">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-btg-terracotta/20 rounded-full text-btg-terracotta text-xs font-medium mb-4">
                  <Users className="w-3.5 h-3.5" />
                  Corporate &amp; Group Bookings
                </div>
                <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
                  {wp.plainText('corporate_heading', `Book The Guide for ${landing.destination} Corporate Trips`)}
                </h2>
                <p className="text-sm text-white/60 max-w-xl mb-6">
                  {wp.plainText(
                    'corporate_description',
                    `Planning a corporate outing or team-building trek to ${landing.destination}? Get custom itineraries, private guides, and exclusive group pricing.`
                  )}
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-white/80">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-btg-terracotta flex-shrink-0" />
                    Custom Itineraries
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-btg-terracotta flex-shrink-0" />
                    Private Certified Guides
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-btg-terracotta flex-shrink-0" />
                    Group Discounts
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-btg-terracotta flex-shrink-0" />
                    Safety &amp; Insurance
                  </li>
                </ul>
              </div>

              <div className="flex flex-col gap-3 w-full lg:w-auto">
                <Link
                  href="/corporate-trip"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-btg-terracotta text-white rounded-full text-sm font-medium hover:bg-btg-rust transition-colors"
                >
                  Get Corporate Quote <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="mailto:corporate@booktheguide.com"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-white/20 text-white rounded-full text-sm font-medium hover:bg-white/10 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  corporate@booktheguide.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ FAQ SECTION (WordPress) ═══════════════ */}
      {wp.faqItems && wp.faqItems.length > 0 && (
        <section className="py-12 lg:py-20 bg-white">
          <WPFaqSection faqs={wp.faqItems} heading={`Frequently Asked Questions — ${landing.destination}`} />
        </section>
      )}

      {/* ═══════════════ INTERNAL LINKS (WordPress) ═══════════════ */}
      {wp.internalLinks && wp.internalLinks.length > 0 && (
        <section className="py-12 lg:py-20">
          <WPInternalLinksGrid links={wp.internalLinks} heading="Explore More Treks" />
        </section>
      )}

      {/* ═══════════════ DEFAULT FAQ (from keywords, if no WP FAQs) ═══════════════ */}
      {(!wp.faqItems || wp.faqItems.length === 0) && landing.questionKeywords.length > 0 && (
        <section className="py-12 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-16">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-btg-dark mb-8">
              Frequently Asked Questions — {landing.destination}
            </h2>
            <div className="space-y-4 max-w-3xl">
              {landing.questionKeywords.slice(0, 8).map((q, i) => (
                <details
                  key={i}
                  className="group bg-white rounded-xl border border-btg-sand overflow-hidden"
                >
                  <summary className="flex items-center justify-between cursor-pointer px-6 py-4 font-heading font-semibold text-btg-dark hover:text-btg-terracotta transition-colors">
                    <span>{q}</span>
                    <svg
                      className="w-5 h-5 text-btg-light-text group-open:rotate-180 transition-transform flex-shrink-0 ml-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-6 pb-5 text-sm text-btg-light-text font-body leading-relaxed">
                    <p>
                      Our certified local guides can answer all your questions about {landing.destination}.{' '}
                      <Link href="/contact" className="text-btg-terracotta hover:underline">Contact us</Link> or explore our packages above for details.
                    </p>
                  </div>
                </details>
              ))}
            </div>

            {/* FAQ Schema for default questions */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  '@context': 'https://schema.org',
                  '@type': 'FAQPage',
                  mainEntity: landing.questionKeywords.slice(0, 8).map((q) => ({
                    '@type': 'Question',
                    name: q,
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: `Our certified local guides can answer all your questions about ${landing.destination}. Visit booktheguide.com or explore our packages for details.`,
                    },
                  })),
                }),
              }}
            />
          </div>
        </section>
      )}
    </main>
  );
}
