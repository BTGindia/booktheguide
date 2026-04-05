import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, BookOpen, Calendar, ArrowRight, ArrowLeft, Clock, Share2, Tag } from 'lucide-react';
import prisma from '@/lib/prisma';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { getStateBySlug, getAllStateSlugs } from '@/lib/states';
import { formatDate } from '@/lib/utils';

interface PageProps {
  params: { slug: string };
}

/** Check if the slug is a state slug (for state blog hub) or an article slug */
function isStateSlug(slug: string): boolean {
  return !!getStateBySlug(slug);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // State blog hub
  if (isStateSlug(params.slug)) {
    const state = getStateBySlug(params.slug)!;
    return {
      title: `${state.name} Travel Blog — Guides, Itineraries & Tips | Book The Guide`,
      description: `Read travel articles about ${state.name}. Itineraries, best time to visit, packing tips, and insider guides from local experts.`,
      keywords: `${state.name} travel blog, ${state.name} itinerary, ${state.name} travel tips, ${state.name} guide`,
      openGraph: {
        title: `${state.name} Travel Blog | Book The Guide`,
        description: `Travel articles and guides for ${state.name}`,
      },
    };
  }

  // Individual article
  const article = await prisma.inspirationContent.findUnique({
    where: { slug: params.slug },
    select: { title: true, excerpt: true, tags: true, thumbnail: true },
  });

  if (!article) return { title: 'Article Not Found | Book The Guide' };

  return {
    title: `${article.title} | Book The Guide Blog`,
    description: article.excerpt || `Read "${article.title}" on the Book The Guide travel blog. Expert travel guides, tips, and itineraries from verified local guides.`,
    keywords: [article.tags?.join(', ') || '', 'travel blog', 'India travel', 'travel guide', 'itinerary'].filter(Boolean).join(', '),
    openGraph: {
      title: article.title,
      description: article.excerpt || `Read "${article.title}" on the Book The Guide travel blog.`,
      type: 'article',
      url: `https://www.booktheguide.com/blog/${params.slug}`,
      images: article.thumbnail ? [{ url: article.thumbnail, width: 1200, height: 630, alt: article.title }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt || undefined,
    },
    alternates: {
      canonical: `https://www.booktheguide.com/blog/${params.slug}`,
    },
  };
}

/* ─── State Blog Hub Component ─── */
async function StateBlogHub({ stateSlug }: { stateSlug: string }) {
  const state = getStateBySlug(stateSlug)!;

  /* Fetch articles tagged with this state (by searching tags/destinations) */
  const articles = await prisma.inspirationContent.findMany({
    where: {
      isPublished: true,
      OR: [
        { tags: { has: state.name } },
        { tags: { has: state.slug } },
        { tags: { has: state.code } },
      ],
    },
    include: { author: { select: { name: true, image: true } } },
    orderBy: { publishedAt: 'desc' },
    take: 20,
  });

  return (
    <main className="bg-btg-cream min-h-screen">
      {/* ───── Hero ───── */}
      <section className="relative h-[45vh] min-h-[320px] flex items-end overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${state.heroImage})` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-16 pb-10">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-btg-primary mb-2 font-heading">Blog</p>
          <h1 className="font-heading text-3xl md:text-5xl font-bold text-white mb-2">{state.name} Travel Blog</h1>
          <p className="text-base text-white/70 font-body max-w-xl">
            Itineraries, tips, and insider stories for travelling in {state.name}.
          </p>
        </div>
      </section>

      {/* ───── Breadcrumb ───── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-16 py-4">
        <nav className="flex items-center gap-2 text-sm text-btg-light-text font-body">
          <Link href="/" className="hover:text-btg-primary transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/blog" className="hover:text-btg-primary transition-colors">Blog</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-btg-dark font-medium">{state.name}</span>
        </nav>
      </div>

      {/* ───── Quick Links ───── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-16 py-6">
        <div className="flex flex-wrap gap-2">
          <Link href={`/explore/${state.slug}`} className="text-xs bg-btg-primary/10 text-btg-primary px-3.5 py-2 rounded-full font-medium hover:bg-btg-primary hover:text-white transition-colors font-body">
            Explore {state.name}
          </Link>
          <Link href={`/explore/${state.slug}/group-trips`} className="text-xs bg-btg-primary/10 text-btg-primary px-3.5 py-2 rounded-full font-medium hover:bg-btg-primary hover:text-white transition-colors font-body">
            Group Trips
          </Link>
          <Link href={`/explore/${state.slug}/heritage-walks`} className="text-xs bg-btg-primary/10 text-btg-primary px-3.5 py-2 rounded-full font-medium hover:bg-btg-primary hover:text-white transition-colors font-body">
            Heritage Walks
          </Link>
          <Link href={`/guides?state=${state.slug}`} className="text-xs bg-btg-primary/10 text-btg-primary px-3.5 py-2 rounded-full font-medium hover:bg-btg-primary hover:text-white transition-colors font-body">
            Guides in {state.name}
          </Link>
        </div>
      </section>

      {/* ───── Articles ───── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-16 py-8">
        <h2 className="font-heading text-2xl font-bold text-btg-dark mb-6">
          {articles.length > 0 ? `${articles.length} Articles` : 'Coming Soon'}
        </h2>

        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/blog/${article.slug}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-btg-sand"
              >
                <div className="h-[180px] overflow-hidden bg-gradient-to-br from-btg-primary/10 to-btg-sage/10">
                  {article.thumbnail ? (
                    <img src={article.thumbnail} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="flex items-center justify-center h-full"><BookOpen className="w-10 h-10 text-btg-primary/30" /></div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-heading text-lg font-semibold text-btg-dark group-hover:text-btg-primary transition-colors line-clamp-2 mb-2">
                    {article.title}
                  </h3>
                  {article.excerpt && <p className="text-sm text-btg-light-text font-body line-clamp-2 mb-3">{article.excerpt}</p>}
                  <div className="flex items-center justify-between text-xs text-btg-light-text font-body">
                    <span>by {article.author.name}</span>
                    {article.publishedAt && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(article.publishedAt)}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-btg-sand">
            <BookOpen className="w-12 h-12 text-btg-primary/30 mx-auto mb-4" />
            <h3 className="font-heading text-xl font-semibold text-btg-dark mb-2">
              Articles About {state.name} Coming Soon
            </h3>
            <p className="text-btg-light-text font-body mb-6 max-w-md mx-auto">
              Our guides are writing amazing content about {state.name}. Stay tuned for itineraries, tips, and travel stories.
            </p>
            <Link href={`/explore/${state.slug}`} className="text-sm text-btg-primary font-semibold hover:underline font-heading">
              Explore {state.name} Instead →
            </Link>
          </div>
        )}
      </section>

      {/* ───── CTA ───── */}
      <section className="bg-gradient-to-r from-btg-primary to-btg-sage py-14">
        <div className="max-w-3xl mx-auto text-center px-6">
          <h2 className="font-heading text-3xl font-bold text-white mb-4">Explore {state.name}</h2>
          <p className="text-white/80 font-body mb-8">Find guides, book trips, and create unforgettable memories.</p>
          <Link href={`/explore/${state.slug}`} className="bg-white text-btg-dark font-semibold px-8 py-3.5 rounded-full hover:bg-btg-cream transition-colors font-heading text-sm">
            Go to {state.name} Hub
          </Link>
        </div>
      </section>
    </main>
  );
}

/* ─── Individual Article Component ─── */
async function ArticlePage({ slug }: { slug: string }) {
  const article = await prisma.inspirationContent.findUnique({
    where: { slug },
    include: { author: { select: { name: true, image: true } } },
  });

  if (!article || !article.isPublished) notFound();

  /* Related articles (same tags) */
  const relatedArticles = await prisma.inspirationContent.findMany({
    where: {
      isPublished: true,
      id: { not: article.id },
      tags: { hasSome: article.tags || [] },
    },
    select: { id: true, slug: true, title: true, thumbnail: true, excerpt: true, publishedAt: true },
    take: 3,
    orderBy: { publishedAt: 'desc' },
  });

  return (
    <main className="bg-btg-cream min-h-screen">
      {/* ───── Article Header ───── */}
      <section className="relative h-[50vh] min-h-[400px] flex items-end overflow-hidden">
        {article.thumbnail ? (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${article.thumbnail})` }} />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-btg-dark to-btg-primary/40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="relative z-10 w-full max-w-4xl mx-auto px-6 lg:px-16 pb-10">
          {article.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {article.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-[10px] font-semibold tracking-wider uppercase text-btg-primary bg-btg-primary/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
          <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            {article.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-white/60 font-body">
            <span>by {article.author.name}</span>
            {article.publishedAt && (
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(article.publishedAt)}</span>
            )}
            <span className="flex items-center gap-1 uppercase tracking-wider text-[10px] font-semibold text-btg-primary">{article.type}</span>
          </div>
        </div>
      </section>

      {/* ───── Breadcrumb ───── */}
      <div className="max-w-4xl mx-auto px-6 lg:px-16 py-4">
        <nav className="flex items-center gap-2 text-sm text-btg-light-text font-body">
          <Link href="/" className="hover:text-btg-primary transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/blog" className="hover:text-btg-primary transition-colors">Blog</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-btg-dark font-medium line-clamp-1">{article.title}</span>
        </nav>
      </div>

      {/* ───── Article Body ───── */}
      <article className="max-w-4xl mx-auto px-6 lg:px-16 py-8">
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-btg-sand">
          {/* Excerpt */}
          {article.excerpt && (
            <p className="text-lg text-btg-dark font-body leading-relaxed mb-8 italic border-l-4 border-btg-primary pl-5">
              {article.excerpt}
            </p>
          )}

          {/* Embed for video/podcast */}
          {article.embedUrl && (
            <div className="mb-8 rounded-xl overflow-hidden aspect-video bg-btg-dark">
              <iframe
                src={article.embedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {/* Content */}
          {article.content ? (
            <div
              className="prose prose-lg max-w-none font-body text-btg-dark/90 prose-headings:font-heading prose-headings:text-btg-dark prose-a:text-btg-primary prose-a:no-underline hover:prose-a:underline"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}
            />
          ) : (
            <p className="text-btg-light-text font-body">This article is being written. Check back soon!</p>
          )}

          {/* Tags */}
          {article.tags?.length > 0 && (
            <div className="border-t border-btg-sand mt-10 pt-6">
              <h4 className="font-heading text-sm font-semibold text-btg-dark mb-3 flex items-center gap-1.5">
                <Tag className="w-4 h-4" /> Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-btg-sand text-btg-dark px-3 py-1.5 rounded-full font-body">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>

      {/* ───── Related Articles ───── */}
      {relatedArticles.length > 0 && (
        <section className="max-w-4xl mx-auto px-6 lg:px-16 py-10">
          <h2 className="font-heading text-2xl font-bold text-btg-dark mb-6">Related Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {relatedArticles.map((rel) => (
              <Link
                key={rel.id}
                href={`/blog/${rel.slug}`}
                className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-btg-sand"
              >
                <div className="h-[140px] overflow-hidden bg-gradient-to-br from-btg-primary/10 to-btg-sage/10">
                  {rel.thumbnail ? (
                    <img src={rel.thumbnail} alt={rel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="flex items-center justify-center h-full"><BookOpen className="w-8 h-8 text-btg-primary/30" /></div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-heading text-sm font-semibold text-btg-dark group-hover:text-btg-primary transition-colors line-clamp-2">
                    {rel.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ───── Back Link ───── */}
      <div className="max-w-4xl mx-auto px-6 lg:px-16 pb-12">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-btg-primary font-semibold hover:underline font-heading">
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>
      </div>

      {/* ─── JSON-LD : Article + BreadcrumbList ─── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: article.title,
            description: article.excerpt || undefined,
            image: article.thumbnail || undefined,
            author: { '@type': 'Person', name: article.author.name },
            datePublished: article.publishedAt?.toISOString(),
            dateModified: article.updatedAt.toISOString(),
            publisher: {
              '@type': 'Organization',
              name: 'Book The Guide',
              url: 'https://www.booktheguide.com',
              logo: { '@type': 'ImageObject', url: 'https://www.booktheguide.com/og-image.jpg' },
            },
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `https://www.booktheguide.com/blog/${article.slug}`,
            },
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
              { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://www.booktheguide.com/blog' },
              { '@type': 'ListItem', position: 3, name: article.title, item: `https://www.booktheguide.com/blog/${article.slug}` },
            ],
          }),
        }}
      />
    </main>
  );
}

/* ─── Main Router ─── */
export default function BlogSlugPage({ params }: PageProps) {
  if (isStateSlug(params.slug)) {
    return <StateBlogHub stateSlug={params.slug} />;
  }
  return <ArticlePage slug={params.slug} />;
}
