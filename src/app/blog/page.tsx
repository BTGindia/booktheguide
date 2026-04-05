import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, BookOpen, Calendar, ArrowRight, Tag, Clock } from 'lucide-react';
import prisma from '@/lib/prisma';
import { getActiveStates } from '@/lib/active-packages';

export const revalidate = 300;
import { formatDate } from '@/lib/utils';
import { getPageBySlug, wpSeoToMetadata, getPageContent } from '@/lib/wordpress';
import { WPSeoContentBlock, WPFaqSection, WPInternalLinksGrid } from '@/components/wordpress/WPContentBlocks';

export async function generateMetadata(): Promise<Metadata> {
  const wpPage = await getPageBySlug('blog');
  if (wpPage?.seo) {
    return wpSeoToMetadata(wpPage.seo, {
      title: 'Travel Blog — Itineraries, Guides & Tips for India 2026 | Book The Guide',
      description: 'Read travel guides, itineraries, packing tips, and insider stories from India\'s best local guides. Plan your next trek, heritage walk, or group trip with expert advice.',
      url: 'https://www.booktheguide.com/blog',
    });
  }
  return {
    title: 'Travel Blog — Itineraries, Guides & Tips for India 2026 | Book The Guide',
    description: 'Read travel guides, itineraries, packing tips, and insider stories from India\'s best local guides. Plan your next trek, heritage walk, or group trip with expert advice. Updated 2026.',
    keywords: 'India travel blog, travel itinerary, trekking guide, heritage walk blog, Himachal Pradesh travel, Rajasthan travel guide, travel tips India, best treks India 2026, packing list trek',
    openGraph: {
      title: 'Travel Blog | Book The Guide',
      description: 'Expert travel guides, itineraries, and tips from India\'s verified local guides.',
      url: 'https://www.booktheguide.com/blog',
    },
    alternates: { canonical: 'https://www.booktheguide.com/blog' },
  };
}

export default async function BlogIndexPage() {
  const wp = await getPageContent('blog');
  const activeStates = await getActiveStates();

  /* Fetch published blog articles from InspirationContent */
  const articles = await prisma.inspirationContent.findMany({
    where: { isPublished: true, type: 'BLOG' },
    include: { author: { select: { name: true, image: true } } },
    orderBy: { publishedAt: 'desc' },
    take: 12,
  });

  /* Also fetch video/podcast content */
  const mediaContent = await prisma.inspirationContent.findMany({
    where: { isPublished: true, type: { in: ['VIDEO', 'PODCAST'] } },
    include: { author: { select: { name: true, image: true } } },
    orderBy: { publishedAt: 'desc' },
    take: 4,
  });

  return (
    <main className="bg-btg-cream min-h-screen">
      {/* ───── Hero ───── */}
      <section className="relative h-[50vh] min-h-[380px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-btg-dark via-btg-dark/90 to-btg-sage/50" />
        <div className="absolute inset-0 opacity-15 bg-[url('/images/btg/optimized/frame-5.webp')] bg-cover bg-center" />
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-5 py-2 rounded-full mb-6">
            <BookOpen className="w-4 h-4 text-btg-primary" />
            <span className="text-xs font-semibold tracking-[0.18em] uppercase text-white/80 font-heading">
              {wp.plainText('hero_badge', 'Blog')}
            </span>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-white mb-4 leading-tight"
              dangerouslySetInnerHTML={{ __html: wp.text('hero_title', 'Stories, Guides &amp; <span class="text-btg-primary">Travel Tips</span>') }} />
          <p className="text-lg text-white/70 font-body max-w-xl mx-auto">
            {wp.plainText('hero_description', "Itineraries, packing lists, best-time-to-visit guides, and insider stories from India's best local guides.")}
          </p>
        </div>
      </section>

      {/* ───── Breadcrumb ───── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-16 py-4">
        <nav className="flex items-center gap-2 text-sm text-btg-light-text font-body">
          <Link href="/" className="hover:text-btg-primary transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-btg-dark font-medium">Blog</span>
        </nav>
      </div>

      {/* ───── Browse by State ───── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-16 py-10">
        <h2 className="font-heading text-2xl font-bold text-btg-dark mb-6">
          {wp.plainText('browse_state_title', 'Browse by State')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {activeStates.map((state) => (
            <Link
              key={state.slug}
              href={`/blog/${state.slug}`}
              className="group bg-white rounded-xl p-4 text-center border border-btg-sand hover:border-btg-primary hover:shadow-md transition-all"
            >
              <h3 className="font-heading text-sm font-semibold text-btg-dark group-hover:text-btg-primary transition-colors mb-0.5">
                {state.name}
              </h3>
              <p className="text-[11px] text-btg-light-text font-body">{state.tagline}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ───── Latest Articles ───── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-16 py-10">
        <h2 className="font-heading text-3xl font-bold text-btg-dark mb-3">{wp.plainText('articles_title', 'Latest Articles')}</h2>
        <p className="text-btg-light-text font-body mb-8">{wp.plainText('articles_subtitle', 'Fresh from our guides and travel writers.')}</p>

        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/blog/${article.slug}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-btg-sand"
              >
                {/* Thumbnail */}
                <div className="h-[200px] overflow-hidden bg-gradient-to-br from-btg-primary/10 to-btg-sage/10">
                  {article.thumbnail ? (
                    <img
                      src={article.thumbnail}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <BookOpen className="w-12 h-12 text-btg-primary/30" />
                    </div>
                  )}
                </div>
                {/* Content */}
                <div className="p-5">
                  {article.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {article.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="text-[10px] font-semibold tracking-wider uppercase text-btg-primary bg-btg-primary/10 px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <h3 className="font-heading text-lg font-semibold text-btg-dark group-hover:text-btg-primary transition-colors line-clamp-2 mb-2">
                    {article.title}
                  </h3>
                  {article.excerpt && (
                    <p className="text-sm text-btg-light-text font-body line-clamp-2 mb-3">{article.excerpt}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-btg-light-text font-body">
                    <span>by {article.author.name}</span>
                    {article.publishedAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatDate(article.publishedAt)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* Placeholder content when no articles exist yet */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Complete Triund Trek Guide 2026 — Everything You Need to Know',
                excerpt: 'From McLeod Ganj to the summit — trail map, difficulty, permits, best season, and what to pack for Triund.',
                tag: 'Himachal Pradesh',
                readTime: '8 min read',
              },
              {
                title: 'Best Heritage Walks in Jaipur — A Local Guide\'s Perspective',
                excerpt: 'Explore the Pink City through its hidden havelis, step-wells, and artisan workshops with a certified heritage guide.',
                tag: 'Rajasthan',
                readTime: '6 min read',
              },
              {
                title: 'Valley of Flowers Trek — When to Go, How to Prepare',
                excerpt: 'A seasonal guide to India\'s most beautiful UNESCO World Heritage trek in Uttarakhand\'s Chamoli district.',
                tag: 'Uttarakhand',
                readTime: '7 min read',
              },
              {
                title: 'Varanasi Ghat Walk — A Sunrise to Sunset Itinerary',
                excerpt: 'Experience the spiritual heart of India — morning aarti, boat rides, and hidden temple lanes with a local guide.',
                tag: 'Uttar Pradesh',
                readTime: '5 min read',
              },
              {
                title: 'Chadar Trek — Walking on the Frozen Zanskar River',
                excerpt: 'Everything about India\'s most extreme winter trek in Ladakh. Preparation, gear, and what to expect.',
                tag: 'Ladakh',
                readTime: '9 min read',
              },
              {
                title: '10 Must-Try Street Foods on a Delhi Food Walk',
                excerpt: 'Paranthe Wali Gali to Jama Masjid — a curated food trail through Old Delhi with a culinary guide.',
                tag: 'Delhi',
                readTime: '4 min read',
              },
            ].map((placeholder, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-btg-sand"
              >
                <div className="h-[200px] bg-gradient-to-br from-btg-primary/10 to-btg-sage/10 flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-btg-primary/30" />
                </div>
                <div className="p-5">
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-btg-primary bg-btg-primary/10 px-2 py-0.5 rounded-full mb-2 inline-block">
                    {placeholder.tag}
                  </span>
                  <h3 className="font-heading text-lg font-semibold text-btg-dark line-clamp-2 mb-2">
                    {placeholder.title}
                  </h3>
                  <p className="text-sm text-btg-light-text font-body line-clamp-2 mb-3">{placeholder.excerpt}</p>
                  <div className="flex items-center gap-1 text-xs text-btg-light-text font-body">
                    <Clock className="w-3 h-3" /> {placeholder.readTime}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ───── Video & Media ───── */}
      {mediaContent.length > 0 && (
        <section className="bg-white py-14">
          <div className="max-w-7xl mx-auto px-6 lg:px-16">
            <h2 className="font-heading text-3xl font-bold text-btg-dark mb-6">Videos &amp; Podcasts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {mediaContent.map((item) => (
                <Link
                  key={item.id}
                  href={`/blog/${item.slug}`}
                  className="group bg-btg-cream rounded-xl overflow-hidden border border-btg-sand hover:shadow-lg transition-all"
                >
                  <div className="h-[140px] bg-btg-dark/10 flex items-center justify-center">
                    <span className="text-3xl">{item.type === 'VIDEO' ? '▶️' : '🎙️'}</span>
                  </div>
                  <div className="p-4">
                    <span className="text-[10px] font-semibold tracking-wider uppercase text-btg-gold font-heading">
                      {item.type}
                    </span>
                    <h3 className="font-heading text-sm font-semibold text-btg-dark group-hover:text-btg-primary transition-colors line-clamp-2 mt-1">
                      {item.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───── Popular Topics ───── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-16 py-12">
        <h2 className="font-heading text-2xl font-bold text-btg-dark mb-6">Popular Topics</h2>
        <div className="flex flex-wrap gap-3">
          {[
            'Trekking Guides', 'Heritage Walks', 'Best Time to Visit', 'Packing Tips',
            'Itineraries', 'Food Walks', 'Budget Travel', 'Weekend Getaways',
            'Monsoon Treks', 'Winter Treks', 'Group Trip Tips', 'Solo Travel',
            'Photography Spots', 'Cultural Experiences', 'Adventure Sports',
          ].map((topic) => (
            <Link
              key={topic}
              href={`/search?q=${encodeURIComponent(topic)}`}
              className="bg-white text-btg-dark text-sm px-4 py-2 rounded-full border border-btg-sand hover:border-btg-primary hover:text-btg-primary transition-colors font-body flex items-center gap-1.5"
            >
              <Tag className="w-3 h-3" /> {topic}
            </Link>
          ))}
        </div>
      </section>

      {/* ───── CTA ───── */}
      <section className="bg-gradient-to-r from-btg-dark to-btg-primary/80 py-16">
        <div className="max-w-3xl mx-auto text-center px-6">
          <h2 className="font-heading text-3xl font-bold text-white mb-4">
            {wp.plainText('cta_title', 'Are You a Guide? Share Your Stories.')}
          </h2>
          <p className="text-white/70 font-body mb-8">
            {wp.plainText('cta_description', 'Join Book The Guide and publish travel articles, video guides, and itineraries to inspire travellers across India.')}
          </p>
          <Link
            href="/register?role=guide"
            className="bg-white text-btg-dark font-semibold px-8 py-3.5 rounded-full hover:bg-btg-cream transition-colors font-heading text-sm"
          >
            Register as a Guide
          </Link>
        </div>
      </section>

      {/* WordPress-managed content */}
      <WPSeoContentBlock content={wp.seoContentBlock} />
      <WPFaqSection faqs={wp.faqItems} />
      <WPInternalLinksGrid links={wp.internalLinks} heading="Related Pages" />
    </main>
  );
}
