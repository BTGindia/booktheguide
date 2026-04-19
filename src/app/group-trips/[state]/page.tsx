import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Users, Calendar, ArrowRight, MapPin, Star } from 'lucide-react';
import prisma from '@/lib/prisma';
import { getStateBySlug, getAllStateSlugs } from '@/lib/states';
import { PackageCard, type PackageCardData } from '@/components/PackageCard';
import { formatCurrency, getRemainingSeats } from '@/lib/utils';
import { getStateCategoryContent } from '@/lib/wordpress';

interface PageProps {
  params: { state: string };
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

// ISR: render on-demand, cache for 60s, regenerate in background
export const revalidate = 60;

export async function generateStaticParams() {
  // Return empty to skip build-time prerendering (avoids DB connection exhaustion)
  return [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const state = getStateBySlug(params.state);
  if (!state) return { title: 'State Not Found | Book The Guide' };

  return {
    title: `Group Trips in ${state.name} — Fixed Departures | Book The Guide`,
    description: `Join group trips and fixed departure treks in ${state.name}. Book your seat with verified local guides and travel with a group.`,
    keywords: `group trips ${state.name}, ${state.name} group tour, fixed departure ${state.name}, group trek ${state.name}`,
    openGraph: {
      title: `Group Trips in ${state.name} | Book The Guide`,
      description: `Fixed departure group trips in ${state.name}`,
    },
  };
}

export default async function StateGroupTripsPage({ params }: PageProps) {
  const state = getStateBySlug(params.state);
  if (!state) notFound();

  /* Fetch group trips + upcoming departures */
  const [products, upcomingDepartures, wp] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: 'APPROVED',
        isActive: true,
        packageCategory: 'GROUP_TRIPS',
        destination: { city: { state: { name: state.name } } },
      },
      include: productInclude,
      orderBy: { createdAt: 'desc' },
      take: 24,
    }),
    prisma.fixedDeparture.findMany({
      where: {
        isActive: true,
        approvalStatus: 'APPROVED',
        startDate: { gte: new Date() },
        product: {
          status: 'APPROVED',
          isActive: true,
          packageCategory: 'GROUP_TRIPS',
          destination: { city: { state: { name: state.name } } },
        },
      },
      include: {
        product: {
          select: {
            title: true,
            slug: true,
            activityType: true,
            destination: { include: { city: { include: { state: { select: { name: true } } } } } },
          },
        },
      },
      orderBy: { startDate: 'asc' },
      take: 10,
    }),
    getStateCategoryContent(`${params.state}-group-trips`),
  ]);

  const cards = products.map(toCard);

  return (
    <main className="bg-btg-cream min-h-screen">
      {/* ───── Hero ───── */}
      <section className="relative h-[50vh] min-h-[380px] flex items-end overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${state.heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-16 pb-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full mb-3">
            <Users className="w-3.5 h-3.5 text-btg-primary" />
            <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-white/80 font-heading">
              {wp.plainText('hero_badge', 'Group Trips')}
            </span>
          </div>
          <h1 className="font-heading text-3xl md:text-5xl font-bold text-white mb-2 leading-tight">
            {wp.plainText('hero_title', `Group Trips in ${state.name}`)}
          </h1>
          <p className="text-base text-white/70 font-body max-w-xl">
            {wp.plainText('hero_description', `Fixed departure group travel experiences in ${state.name}. Pick a date, book your seat.`)}
          </p>
        </div>
      </section>

      {/* ───── Breadcrumb ───── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-16 py-4">
        <nav className="flex items-center gap-2 text-sm text-btg-light-text font-body flex-wrap">
          <Link href="/" className="hover:text-btg-primary transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/experiences/group-trips" className="hover:text-btg-primary transition-colors">Group Trips</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-btg-dark font-medium">{state.name}</span>
        </nav>
      </div>

      {/* ───── Upcoming Departures ───── */}
      {upcomingDepartures.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 lg:px-16 py-10">
          <h2 className="font-heading text-2xl font-bold text-btg-dark mb-6">{wp.plainText('departures_title', 'Upcoming Departures')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingDepartures.map((dep: any) => {
              const remaining = getRemainingSeats(dep.totalSeats, dep.bookedSeats || 0);
              return (
                <Link
                  key={dep.id}
                  href={`/trips/${dep.product.slug}`}
                  className="group flex items-stretch gap-4 bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-btg-sand"
                >
                  <div className="flex-shrink-0 w-20 bg-btg-primary flex flex-col items-center justify-center text-white p-3">
                    <span className="text-2xl font-bold font-heading">{new Date(dep.startDate).getDate()}</span>
                    <span className="text-[10px] uppercase tracking-wider font-heading">
                      {new Date(dep.startDate).toLocaleDateString('en-IN', { month: 'short' })}
                    </span>
                  </div>
                  <div className="flex-1 py-3 pr-4">
                    <h3 className="font-heading text-base font-semibold text-btg-dark group-hover:text-btg-primary transition-colors line-clamp-1">
                      {dep.product.title}
                    </h3>
                    <p className="text-xs text-btg-light-text font-body flex items-center gap-1 mb-1">
                      <MapPin className="w-3 h-3" /> {dep.product.destination.name}
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

      {/* ───── All Group Trips ───── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-16 py-10">
        <h2 className="font-heading text-2xl font-bold text-btg-dark mb-2">
          {cards.length} Group {cards.length === 1 ? 'Trip' : 'Trips'} in {state.name}
        </h2>

        {cards.length > 0 ? (
          <div className="space-y-5 mt-6">
            {cards.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-btg-sand mt-6">
            <Users className="w-12 h-12 text-btg-primary/30 mx-auto mb-4" />
            <h3 className="font-heading text-xl font-semibold text-btg-dark mb-2">
              No Group Trips in {state.name} Yet
            </h3>
            <p className="text-btg-light-text font-body mb-6 max-w-md mx-auto">
              We&apos;re expanding. Check back soon or explore other experiences in {state.name}.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={`/explore/${state.slug}`} className="text-sm text-btg-primary font-semibold hover:underline font-heading">
                Explore {state.name}
              </Link>
              <Link href="/experiences/group-trips" className="text-sm text-btg-primary font-semibold hover:underline font-heading">
                All Group Trips
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ───── Related Links ───── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-16 py-10">
        <h2 className="font-heading text-xl font-bold text-btg-dark mb-4">{wp.plainText('related_title', `More in ${state.name}`)}</h2>
        <div className="flex flex-wrap gap-3">
          <Link href={`/explore/${state.slug}`} className="text-xs bg-white text-btg-dark px-4 py-2 rounded-full border border-btg-sand hover:border-btg-primary hover:text-btg-primary transition-colors font-body">
            All Experiences
          </Link>
          <Link href={`/explore/${state.slug}/adventure-guides`} className="text-xs bg-white text-btg-dark px-4 py-2 rounded-full border border-btg-sand hover:border-btg-primary hover:text-btg-primary transition-colors font-body">
            Adventure Guides
          </Link>
          <Link href={`/explore/${state.slug}/heritage-walks`} className="text-xs bg-white text-btg-dark px-4 py-2 rounded-full border border-btg-sand hover:border-btg-primary hover:text-btg-primary transition-colors font-body">
            Heritage Walks
          </Link>
          <Link href={`/explore/${state.slug}/tourist-guides`} className="text-xs bg-white text-btg-dark px-4 py-2 rounded-full border border-btg-sand hover:border-btg-primary hover:text-btg-primary transition-colors font-body">
            Tourist Guides
          </Link>
          <Link href={`/blog/${state.slug}`} className="text-xs bg-white text-btg-dark px-4 py-2 rounded-full border border-btg-sand hover:border-btg-primary hover:text-btg-primary transition-colors font-body">
            Blog
          </Link>
        </div>
      </section>

      {/* ───── CTA ───── */}
      <section className="bg-gradient-to-r from-btg-primary to-btg-sage py-14">
        <div className="max-w-3xl mx-auto text-center px-6">
          <h2 className="font-heading text-3xl font-bold text-white mb-4">
            {wp.plainText('cta_title', "Can't Find Your Dates?")}
          </h2>
          <p className="text-white/80 font-body mb-8">
            {wp.plainText('cta_description', `Request a personal booking with any guide in ${state.name} — choose your own dates and group size.`)}
          </p>
          <Link
            href={`/search?state=${state.slug}`}
            className="bg-white text-btg-dark font-semibold px-8 py-3.5 rounded-full hover:bg-btg-cream transition-colors font-heading text-sm"
          >
            Search All Guides
          </Link>
        </div>
      </section>
    </main>
  );
}
