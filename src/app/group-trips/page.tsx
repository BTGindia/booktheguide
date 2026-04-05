import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Users, Calendar, ArrowRight, MapPin, Clock, Star } from 'lucide-react';
import prisma from '@/lib/prisma';
import { getActiveStates } from '@/lib/active-packages';
import { PackageCard, type PackageCardData } from '@/components/PackageCard';
import { formatDate, formatDateRange, formatCurrency, getRemainingSeats } from '@/lib/utils';
import { getPageBySlug, wpSeoToMetadata, getPageContent } from '@/lib/wordpress';
import { WPSeoContentBlock, WPFaqSection, WPInternalLinksGrid } from '@/components/wordpress/WPContentBlocks';
import { getUIConfig, getSectionSort, getSectionLimit, getFeaturedIds, applySorting, applyFeaturedPinning } from '@/lib/ui-config';

export async function generateMetadata(): Promise<Metadata> {
  const wpPage = await getPageBySlug('group-trips');
  if (wpPage?.seo) {
    return wpSeoToMetadata(wpPage.seo, {
      title: 'Group Trips — Fixed Departures & Group Travel | Book The Guide',
      description: 'Join fixed-departure group trips across India. Trek with groups in Himachal, explore Rajasthan heritage with fellow travellers, or join adventure trips with verified guides.',
      url: 'https://www.booktheguide.com/group-trips',
    });
  }
  return {
    title: 'Group Trips — Fixed Departures & Group Travel | Book The Guide',
    description: 'Join fixed-departure group trips across India. Trek with groups in Himachal, explore Rajasthan heritage with fellow travellers, or join adventure trips with verified guides.',
    keywords: 'group trips India, fixed departure treks, group travel India, group tours, backpacking India, group trek Himachal, group tour Rajasthan',
    openGraph: {
      title: 'Group Trips | Book The Guide',
      description: 'Join fixed-departure group trips with verified local guides across India.',
    },
  };
}

const productInclude = {
  destination: { include: { city: { include: { state: { select: { name: true } } } } } },
  guide: { include: { user: { select: { name: true, image: true } } } },
  fixedDepartures: {
    where: { isActive: true, approvalStatus: 'APPROVED', startDate: { gte: new Date() } },
    orderBy: { startDate: 'asc' as const },
    take: 3,
    select: {
      id: true,
      startDate: true,
      endDate: true,
      pricePerPerson: true,
      meetingPoint: true,
      totalSeats: true,
      bookedSeats: true,
    },
  },
} as any;

function toCard(p: any): PackageCardData {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    coverImage: p.coverImage,
    durationDays: p.durationDays,
    durationNights: p.durationNights,
    activityType: p.activityType,
    packageCategory: p.packageCategory || 'GROUP_TRIPS',
    destinationName: p.destination.name,
    stateName: p.destination.city.state.name,
    guideName: p.guide.user.name || 'Guide',
    guideRating: p.guide.averageRating,
    guideReviewCount: p.guide.totalReviews ?? 0,
    guideCertification: p.guide.certifications?.[0] || undefined,
    meetingPoint: p.fixedDepartures?.[0]?.meetingPoint || undefined,
    price: p.fixedDepartures?.[0]?.pricePerPerson ?? null,
    seatsLeft: p.fixedDepartures?.[0]
      ? getRemainingSeats(p.fixedDepartures[0].totalSeats, p.fixedDepartures[0].bookedSeats || 0)
      : undefined,
  };
}

export default async function GroupTripsPage() {
  const wp = await getPageContent('group-trips');
  const activeStates = await getActiveStates();

  /* Fetch group trip products with upcoming departures */
  const [groupProducts, upcomingDepartures, totalCount, uiConfig] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: 'APPROVED',
        isActive: true,
        packageCategory: 'GROUP_TRIPS',
        fixedDepartures: {
          some: { isActive: true, approvalStatus: 'APPROVED', startDate: { gte: new Date() } },
        },
      },
      include: productInclude,
      orderBy: { createdAt: 'desc' },
      take: 18,
    }),
    prisma.fixedDeparture.findMany({
      where: {
        isActive: true,
        approvalStatus: 'APPROVED',
        startDate: { gte: new Date() },
        product: { status: 'APPROVED', isActive: true, packageCategory: 'GROUP_TRIPS' },
      },
      include: {
        product: {
          select: {
            title: true,
            slug: true,
            coverImage: true,
            activityType: true,
            destination: { include: { city: { include: { state: { select: { name: true } } } } } },
          },
        },
      },
      orderBy: { startDate: 'asc' },
      take: 8,
    }),
    prisma.product.count({
      where: { status: 'APPROVED', isActive: true, packageCategory: 'GROUP_TRIPS' },
    }),
    getUIConfig('group-trips'),
  ]);

  const cards = applyFeaturedPinning(
    applySorting(groupProducts as any[], getSectionSort(uiConfig, 'upcoming')),
    getFeaturedIds(uiConfig, 'upcoming')
  ).slice(0, getSectionLimit(uiConfig, 'upcoming', 18)).map(toCard);

  return (
    <main className="bg-btg-cream min-h-screen">
      {/* ───── Hero ───── */}
      <section className="relative h-[55vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-btg-dark via-btg-dark/90 to-btg-primary/40" />
        <div className="absolute inset-0 opacity-20 bg-[url('/images/btg/optimized/frame-6.webp')] bg-cover bg-center" />
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-5 py-2 rounded-full mb-6">
            <Users className="w-4 h-4 text-btg-primary" />
            <span className="text-xs font-semibold tracking-[0.18em] uppercase text-white/80 font-heading">
              {wp.plainText('hero_badge', 'Group Trips')}
            </span>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-white mb-4 leading-tight"
              dangerouslySetInnerHTML={{ __html: wp.text('hero_title', 'Travel Together. <span class="text-btg-primary">Save More.</span>') }} />
          <p className="text-lg text-white/70 font-body max-w-2xl mx-auto mb-8">
            {wp.plainText('hero_description', 'Join fixed-departure group trips with verified local guides. From Himalayan treks to desert safaris \u2014 pick a date, book your seat, and go.')}
          </p>
          <Link
            href="/experiences/group-trips"
            className="bg-btg-primary text-white font-semibold px-8 py-3.5 rounded-full hover:bg-btg-primary/90 transition-colors font-heading text-sm"
          >
            Browse All Group Trips
          </Link>
        </div>
      </section>

      {/* ───── Breadcrumb ───── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-16 py-4">
        <nav className="flex items-center gap-2 text-sm text-btg-light-text font-body">
          <Link href="/" className="hover:text-btg-primary transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-btg-dark font-medium">Group Trips</span>
        </nav>
      </div>

      {/* ───── Upcoming Departures Calendar ───── */}
      {upcomingDepartures.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 lg:px-16 py-10">
          <h2 className="font-heading text-3xl font-bold text-btg-dark mb-2">{wp.plainText('upcoming_title', 'Upcoming Departures')}</h2>
          <p className="text-btg-light-text font-body mb-6">{wp.plainText('upcoming_subtitle', 'Seats filling fast \u2014 book your spot now.')}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingDepartures.map((dep: any) => {
              const remaining = getRemainingSeats(dep.totalSeats, dep.bookedSeats || 0);
              return (
                <Link
                  key={dep.id}
                  href={`/trips/${dep.product.slug}`}
                  className="group flex items-stretch gap-4 bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-btg-sand"
                >
                  {/* Date */}
                  <div className="flex-shrink-0 w-20 bg-btg-primary flex flex-col items-center justify-center text-white p-3">
                    <span className="text-2xl font-bold font-heading">{new Date(dep.startDate).getDate()}</span>
                    <span className="text-[10px] uppercase tracking-wider font-heading">
                      {new Date(dep.startDate).toLocaleDateString('en-IN', { month: 'short' })}
                    </span>
                  </div>
                  {/* Content */}
                  <div className="flex-1 py-3 pr-4">
                    <h3 className="font-heading text-base font-semibold text-btg-dark group-hover:text-btg-primary transition-colors line-clamp-1">
                      {dep.product.title}
                    </h3>
                    <p className="text-xs text-btg-light-text font-body flex items-center gap-1 mb-1">
                      <MapPin className="w-3 h-3" />
                      {dep.product.destination.name}, {dep.product.destination.city.state.name}
                    </p>
                    <div className="flex items-center gap-3 text-xs font-body">
                      <span className="text-btg-dark font-semibold">{formatCurrency(dep.pricePerPerson)}</span>
                      {remaining > 0 && (
                        <span className="text-btg-terracotta font-medium">{remaining} seats left</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ───── Browse by State ───── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-16 py-10">
        <h2 className="font-heading text-3xl font-bold text-btg-dark mb-6">{wp.plainText('by_state_title', 'Group Trips by State')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {activeStates.map((state) => (
            <Link
              key={state.slug}
              href={`/group-trips/${state.slug}`}
              className="group relative rounded-xl overflow-hidden h-[140px] shadow-sm hover:shadow-lg transition-all"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url(${state.heroImage})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="relative h-full flex flex-col justify-end p-3">
                <h3 className="text-white font-heading text-sm font-semibold">{state.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ───── All Group Trips ───── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-16 py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-heading text-3xl font-bold text-btg-dark">{wp.plainText('all_title', 'All Group Trips')}</h2>
            <p className="text-sm text-btg-light-text font-body">{totalCount} trips available</p>
          </div>
          <Link href="/experiences/group-trips" className="hidden sm:flex items-center gap-1.5 text-sm text-btg-primary font-semibold hover:underline font-heading">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {cards.length > 0 ? (
          <div className="space-y-5">
            {cards.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-btg-sand">
            <Users className="w-12 h-12 text-btg-primary/30 mx-auto mb-4" />
            <h3 className="font-heading text-xl font-semibold text-btg-dark mb-2">
              Group Trips Coming Soon
            </h3>
            <p className="text-btg-light-text font-body mb-6 max-w-md mx-auto">
              Our guides are preparing exciting group departure trips. Check back soon!
            </p>
            <Link href="/upcoming-trips" className="text-sm text-btg-primary font-semibold hover:underline font-heading">
              View Upcoming Trips →
            </Link>
          </div>
        )}
      </section>

      {/* ───── How It Works ───── */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <h2 className="font-heading text-3xl font-bold text-btg-dark text-center mb-10">{wp.plainText('how_title', 'How Group Trips Work')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Browse', desc: 'Find a group trip by destination, activity or date.' },
              { step: '02', title: 'Book a Seat', desc: 'Reserve your spot instantly. No waiting for quotes.' },
              { step: '03', title: 'Meet Your Group', desc: 'Connect with fellow travellers and your guide.' },
              { step: '04', title: 'Travel Together', desc: 'Enjoy a curated experience led by a local expert.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 rounded-full bg-btg-primary/10 text-btg-primary font-heading font-bold text-xl flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-heading text-base font-semibold text-btg-dark mb-1">{item.title}</h3>
                <p className="text-sm text-btg-light-text font-body">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── CTA ───── */}
      <section className="bg-gradient-to-r from-btg-primary to-btg-sage py-16">
        <div className="max-w-3xl mx-auto text-center px-6">
          <h2 className="font-heading text-3xl font-bold text-white mb-4">
            {wp.plainText('cta_title', 'Ready to Join a Group Trip?')}
          </h2>
          <p className="text-white/80 font-body mb-8 max-w-xl mx-auto">
            {wp.plainText('cta_description', 'From easy weekend hikes to multi-day Himalayan treks \u2014 find the perfect group adventure and book your seat today.')}
          </p>
          <Link
            href="/experiences/group-trips"
            className="bg-white text-btg-dark font-semibold px-8 py-3.5 rounded-full hover:bg-btg-cream transition-colors font-heading text-sm"
          >
            Search Group Trips
          </Link>
        </div>
      </section>

      {/* WordPress-managed content */}
      <WPSeoContentBlock content={wp.seoContentBlock} />
      <WPFaqSection faqs={wp.faqItems} />
      <WPInternalLinksGrid links={wp.internalLinks} heading="Explore More" />
    </main>
  );
}
