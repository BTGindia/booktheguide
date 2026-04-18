import Link from 'next/link';
import prisma from '@/lib/prisma';
import type { Metadata } from 'next';

export const revalidate = 300;
import { getPageBySlug, wpSeoToMetadata } from '@/lib/wordpress';

export async function generateMetadata(): Promise<Metadata> {
  const wpPage = await getPageBySlug('inspiration');
  if (wpPage?.seo) {
    return wpSeoToMetadata(wpPage.seo, {
      title: 'Inspiration — Travel Stories & Ideas | Book The Guide',
      description: 'Get inspired for your next Indian adventure — trending trips, curated guides, and travel stories.',
      url: 'https://www.booktheguide.com/inspiration',
    });
  }
  return {
    title: 'Inspiration — Travel Stories & Ideas | Book The Guide',
    description: 'Get inspired for your next Indian adventure — trending trips, curated guides, and travel stories.',
    alternates: { canonical: 'https://www.booktheguide.com/inspiration' },
  };
}

export default async function InspirationPage() {
  // Fetch inspiration content
  let inspirationItems: any[] = [];
  try {
    inspirationItems = await (prisma as any).inspirationContent.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 12,
    });
  } catch {
    // Model may not exist yet
  }

  // Fetch trending products as fallback/supplement
  const trendingProducts = await prisma.product.findMany({
    where: { isTrending: true, status: 'APPROVED', isActive: true },
    include: {
      destination: { include: { city: { include: { state: { select: { name: true } } } } } },
      guide: { include: { user: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 8,
  });

  const tabs = ['All', 'Trending', 'Heritage', 'Adventure', 'Culture'];

  return (
    <div className="bg-btg-cream min-h-screen">
      {/* Hero */}
      <section className="bg-[#1A1A18] pt-32 pb-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#58bdae] mb-3">Get Inspired</p>
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            Inspiration <em className="italic text-[#58bdae]">Hub</em>
          </h1>
          <p className="text-white/60 text-lg font-body max-w-xl">
            Discover curated travel stories, trending destinations, and expert guides to fuel your next Indian adventure.
          </p>
        </div>
      </section>

      {/* Tabs */}
      <div className="border-b border-[#1A1A18]/[0.08] bg-white sticky top-[64px] z-30">
        <div className="max-w-6xl mx-auto px-6 md:px-12 flex gap-6 overflow-x-auto">
          {tabs.map((tab, idx) => (
            <button
              key={tab}
              className={`py-4 text-sm font-medium font-body border-b-2 transition-colors whitespace-nowrap ${
                idx === 0
                  ? 'border-[#58bdae] text-[#58bdae]'
                  : 'border-transparent text-[#6B6560] hover:text-[#1A1A18]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      <section className="py-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          {/* Inspiration Content */}
          {inspirationItems.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {inspirationItems.map((item: any) => (
                <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                  {item.coverImage && (
                    <div className="h-48 overflow-hidden">
                      <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    </div>
                  )}
                  <div className="p-5">
                    <span className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[#58bdae] font-body">{item.category}</span>
                    <h3 className="font-heading text-lg font-bold text-[#1A1A18] mt-1 mb-2 line-clamp-2">{item.title}</h3>
                    <p className="text-sm text-[#6B6560] font-body line-clamp-3">{item.summary}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Trending Trips */}
          <div className="mb-8">
            <h2 className="font-heading text-2xl font-bold text-[#1A1A18] mb-2">Trending Experiences</h2>
            <p className="text-[#6B6560] font-body">The hottest trips our travellers are booking right now.</p>
          </div>

          {trendingProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trendingProducts.map((p) => (
                <Link
                  key={p.id}
                  href={`/trips/${p.slug}`}
                  className="group rounded-2xl overflow-hidden bg-white shadow-[0_2px_16px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
                >
                  <div className="relative h-48 overflow-hidden">
                    {p.coverImage ? (
                      <img src={p.coverImage} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#58bdae]/10 to-[#EDE8DF] flex items-center justify-center">
                        <span className="text-3xl">&#127757;</span>
                      </div>
                    )}
                    <span className="absolute top-3 left-3 bg-[#ff1949] text-white text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-wide">Trending</span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-heading text-base font-bold text-[#1A1A18] mb-1 line-clamp-2">{p.title}</h3>
                    <p className="text-xs text-[#6B6560] font-body">{p.destination.city.state.name} &middot; {p.durationDays}D{p.durationNights > 0 ? `/${p.durationNights}N` : ''}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-[#6B6560] text-center py-12 font-body">
              Trending content coming soon &mdash; check back shortly!
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
