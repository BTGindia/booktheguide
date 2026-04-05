import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { Heart, BookOpen, ArrowRight, Sparkles, MapPin } from 'lucide-react';

export default async function WishlistPage() {
  const session = await getServerSession(authOptions);

  // Logged-in users go to the dashboard wishlist
  if (session?.user) {
    redirect('/dashboard/customer/wishlist');
  }

  // Fetch a few published blogs for the "Get Inspired" section
  const blogs = await prisma.inspirationContent.findMany({
    where: { isPublished: true, type: 'BLOG' },
    include: { author: { select: { name: true, image: true } } },
    orderBy: { publishedAt: 'desc' },
    take: 6,
  });

  return (
    <div className="bg-btg-cream min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A4D4A] via-[#1A1A18] to-[#1A1A18]" />
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="absolute top-20 left-1/4 w-72 h-72 rounded-full bg-[#58bdae] blur-[100px]" />
          <div className="absolute bottom-10 right-1/4 w-56 h-56 rounded-full bg-[#E8943A] blur-[80px]" />
        </div>
        <div className="relative pt-36 pb-20 px-6 md:px-12">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-5 py-2 rounded-full mb-8">
              <Heart className="w-4 h-4 text-[#58bdae]" />
              <span className="text-xs font-semibold tracking-[0.18em] uppercase text-white/80 font-heading">
                Your Travel Wishlist
              </span>
            </div>
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Log in to start making your{' '}
              <span className="text-[#58bdae]">Dream Travel Wishlist</span>
            </h1>
            <p className="text-lg text-white/60 font-body max-w-xl mx-auto mb-10">
              Save your favourite destinations, bookmark trips by incredible local guides, and build the adventure of a lifetime.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 text-sm font-bold text-white bg-[#58bdae] px-10 py-4 rounded-full hover:bg-[#4aa99b] transition-all tracking-wide font-heading shadow-lg shadow-[#58bdae]/25"
              >
                Log In <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 text-sm font-bold text-white bg-white/10 backdrop-blur-sm border border-white/20 px-10 py-4 rounded-full hover:bg-white/20 transition-all tracking-wide font-heading"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative cards preview */}
        <div className="relative max-w-5xl mx-auto px-6 pb-16 hidden md:block">
          <div className="flex justify-center gap-4 -mt-2">
            {[
              { icon: MapPin, title: 'Mountain Treks', subtitle: 'Himalayas & Beyond' },
              { icon: Sparkles, title: 'Heritage Walks', subtitle: 'Royal Rajasthan' },
              { icon: Heart, title: 'Beach Escapes', subtitle: 'Goa & Kerala' },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-5 w-48 text-center"
              >
                <div className="w-10 h-10 rounded-full bg-[#58bdae]/20 flex items-center justify-center mx-auto mb-3">
                  <item.icon className="w-5 h-5 text-[#58bdae]" />
                </div>
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="text-xs text-white/50 mt-0.5">{item.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Get Inspired Section */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-[#58bdae]/10 px-4 py-1.5 rounded-full mb-4">
              <Sparkles className="w-4 h-4 text-[#58bdae]" />
              <span className="text-xs font-bold tracking-[0.15em] uppercase text-[#58bdae]">Get Inspired</span>
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-btg-dark mb-3">
              Stories to fuel your wanderlust
            </h2>
            <p className="text-btg-mid font-body max-w-lg mx-auto">
              Read travel guides, itineraries, and insider tips from India&apos;s best local guides before you create your wishlist.
            </p>
          </div>

          {blogs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((blog) => (
                <Link
                  key={blog.id}
                  href={`/blog/${blog.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-btg-sand"
                >
                  <div className="h-[200px] overflow-hidden bg-gradient-to-br from-[#58bdae]/10 to-[#7A9E7E]/10">
                    {blog.thumbnail ? (
                      <img
                        src={blog.thumbnail}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <BookOpen className="w-12 h-12 text-[#58bdae]/30" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    {blog.tags?.[0] && (
                      <span className="inline-block text-[10px] font-bold tracking-[0.12em] uppercase text-[#58bdae] bg-[#58bdae]/10 px-2.5 py-1 rounded-full mb-3">
                        {blog.tags[0]}
                      </span>
                    )}
                    <h3 className="font-heading text-lg font-bold text-btg-dark group-hover:text-[#58bdae] transition-colors line-clamp-2 mb-2">
                      {blog.title}
                    </h3>
                    {blog.excerpt && (
                      <p className="text-sm text-btg-mid font-body line-clamp-2">
                        {blog.excerpt}
                      </p>
                    )}
                    <div className="mt-4 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#58bdae]/20 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-[#58bdae]">
                          {blog.author?.name?.[0]?.toUpperCase() || 'B'}
                        </span>
                      </div>
                      <span className="text-xs text-btg-mid">{blog.author?.name || 'Book The Guide'}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-[#58bdae]/30 mx-auto mb-4" />
              <p className="text-btg-mid font-body">Blog articles coming soon!</p>
            </div>
          )}

          <div className="text-center mt-10">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#58bdae] hover:text-[#4aa99b] transition-colors font-heading"
            >
              View all articles <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
