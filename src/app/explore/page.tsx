import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, ChevronRight, Mountain, Compass, Globe, ArrowRight } from 'lucide-react';
import { getActiveStates } from '@/lib/active-packages';
import { getPageBySlug, wpSeoToMetadata, getPageContent } from '@/lib/wordpress';
import { WPSeoContentBlock, WPFaqSection, WPInternalLinksGrid } from '@/components/wordpress/WPContentBlocks';

export async function generateMetadata(): Promise<Metadata> {
  const wpPage = await getPageBySlug('explore');
  if (wpPage?.seo) {
    return wpSeoToMetadata(wpPage.seo, {
      title: 'Explore India — States, Destinations & Guided Experiences | Book The Guide',
      description: 'Discover India state by state. From Himalayan treks in Himachal Pradesh to heritage walks in Rajasthan — find local guides, group trips, and authentic travel experiences across every Indian state.',
      url: 'https://www.booktheguide.com/explore',
    });
  }
  return {
    title: 'Explore India — States, Destinations & Guided Experiences | Book The Guide',
    description: 'Discover India state by state. From Himalayan treks in Himachal Pradesh to heritage walks in Rajasthan — find local guides, group trips, and authentic travel experiences across every Indian state.',
    keywords: 'explore India, Indian states travel, Himachal Pradesh tours, Rajasthan tours, Uttarakhand treks, Kerala backwaters, guided travel India',
    openGraph: {
      title: 'Explore India | Book The Guide',
      description: 'Discover India state by state with verified local guides.',
    },
  };
}

export default async function ExplorePage() {
  const wp = await getPageContent('explore');

  // Get only DB-active states
  const activeStates = await getActiveStates();

  return (
    <main className="bg-btg-cream min-h-screen">
      {/* ───── Hero ───── */}
      <section className="relative h-[60vh] min-h-[420px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-btg-dark via-btg-dark/90 to-btg-primary/40" />
        <div className="absolute inset-0 opacity-20 bg-[url('/images/btg/optimized/frame-5.webp')] bg-cover bg-center" />
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-5 py-2 rounded-full mb-6">
            <Globe className="w-4 h-4 text-btg-primary" />
            <span className="text-xs font-semibold tracking-[0.18em] uppercase text-white/80 font-heading">
              {wp.plainText('hero_badge', 'Explore India')}
            </span>
          </div>
          <h1 className="font-heading text-4xl md:text-6xl font-bold text-white mb-5 leading-tight"
              dangerouslySetInnerHTML={{ __html: wp.text('hero_title', 'Every State. Every Story.<br /><span class="text-btg-primary">Your Next Adventure.</span>') }} />
          <p className="text-lg md:text-xl text-white/70 font-body max-w-2xl mx-auto leading-relaxed">
            {wp.plainText('hero_description', 'From the snow-capped Himalayas to the sun-kissed coasts of Kerala \u2014 discover India through the eyes of passionate local guides.')}
          </p>
        </div>
      </section>

      {/* ───── Breadcrumb ───── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-16 py-4">
        <nav className="flex items-center gap-2 text-sm text-btg-light-text font-body">
          <Link href="/" className="hover:text-btg-primary transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-btg-dark font-medium">Explore</span>
        </nav>
      </div>

      {/* ───── Featured States ───── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-16 py-12">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-btg-primary mb-3 font-heading">
            {wp.plainText('featured_label', 'Top Destinations')}
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-btg-dark mb-4">
            {wp.plainText('featured_title', 'Start Your Journey')}
          </h2>
          <p className="text-btg-light-text font-body max-w-xl mx-auto">
            {wp.plainText('featured_subtitle', 'Our most popular states with verified local guides ready to show you the best experiences.')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeStates.map((state) => (
            <Link
              key={state.slug}
              href={`/explore/${state.slug}`}
              className="group relative rounded-2xl overflow-hidden h-[320px] shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url(${state.heroImage})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="relative h-full flex flex-col justify-end p-6">
                <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-btg-primary mb-2 font-heading">
                  {state.isNorthIndia ? 'North India' : 'South & Central India'}
                </span>
                <h3 className="font-heading text-2xl font-bold text-white mb-1.5">{state.name}</h3>
                <p className="text-sm text-white/70 font-body mb-3 italic">{state.tagline}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {state.popularCities.slice(0, 3).map((city) => (
                    <span key={city} className="text-[10px] bg-white/15 backdrop-blur-sm text-white px-2.5 py-1 rounded-full">
                      {city}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 text-btg-primary text-sm font-semibold font-heading">
                  Explore {state.name} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ───── All States Grid ───── */}
      {activeStates.length > 6 && (
        <section className="max-w-7xl mx-auto px-6 lg:px-16 py-12">
          <div className="text-center mb-10">
            <h2 className="font-heading text-3xl font-bold text-btg-dark mb-3">
              {wp.plainText('all_states_title', 'All Active States')}
            </h2>
            <p className="text-btg-light-text font-body max-w-xl mx-auto">
              {wp.plainText('all_states_subtitle', "Explore every corner of India. We're expanding across the country — guides are joining from new states every month.")}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {activeStates.slice(6).map((state) => (
              <Link
                key={state.slug}
                href={`/explore/${state.slug}`}
                className="group bg-white rounded-xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border border-btg-sand"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-heading text-base font-semibold text-btg-dark group-hover:text-btg-primary transition-colors">
                    {state.name}
                  </h3>
                  <span className="text-xs text-btg-light-text bg-btg-sand px-2 py-0.5 rounded-full font-mono">
                    {state.code}
                  </span>
                </div>
                <p className="text-xs text-btg-light-text font-body line-clamp-2 mb-2">{state.tagline}</p>
                <span className="text-xs text-btg-primary font-semibold flex items-center gap-1 font-heading">
                  View <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ───── CTA ───── */}
      <section className="bg-gradient-to-r from-btg-primary to-btg-sage py-16">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
            {wp.plainText('cta_title', "Can't Decide Where to Go?")}
          </h2>
          <p className="text-white/80 font-body text-lg mb-8 max-w-xl mx-auto">
            {wp.plainText('cta_description', 'Use our AI travel assistant to find the perfect destination based on your preferences, budget, and travel dates.')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/search"
              className="bg-white text-btg-dark font-semibold px-8 py-3.5 rounded-full hover:bg-btg-cream transition-colors font-heading text-sm"
            >
              Search Experiences
            </Link>
            <Link
              href="/inspiration"
              className="border-2 border-white text-white font-semibold px-8 py-3.5 rounded-full hover:bg-white/10 transition-colors font-heading text-sm"
            >
              Get Inspired
            </Link>
          </div>
        </div>
      </section>

      {/* WordPress-managed content */}
      <WPSeoContentBlock content={wp.seoContentBlock} />
      <WPFaqSection faqs={wp.faqItems} />
      <WPInternalLinksGrid links={wp.internalLinks} heading="Explore More" />
    </main>
  );
}
