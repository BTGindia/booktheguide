import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin,
  Star,
  Calendar,
  Users,
  Clock,
  ArrowRight,
  Mountain,
  Shield,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Sparkles,
  Heart,
  Share2,
  Phone,
  HelpCircle,
} from 'lucide-react';
import { formatCurrency, ACTIVITY_LABELS, DIFFICULTY_LABELS } from '@/lib/utils';
import { CATEGORY_MAP } from '@/lib/categories';
import { PackageCard, type PackageCardData } from '@/components/PackageCard';
import dynamic from 'next/dynamic';
import { getTrip, wpSeoToMetadata, getTripContent } from '@/lib/wordpress';

const AiTravelAssistant = dynamic(
  () => import('@/components/ai/AiTravelAssistant').then(m => m.AiTravelAssistant),
  { ssr: false, loading: () => <div className="h-32 flex items-center justify-center"><p className="text-white/50">Loading AI Assistant...</p></div> }
);
import { WPFaqSection, WPSeoContentBlock, WPInternalLinksGrid } from '@/components/wordpress/WPContentBlocks';

function toCard(p: any): PackageCardData {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    coverImage: p.coverImage,
    durationDays: p.durationDays,
    durationNights: p.durationNights,
    activityType: p.activityType,
    packageCategory: p.packageCategory || 'TOURIST_GUIDES',
    destinationName: p.destination.name,
    stateName: p.destination.city.state.name,
    guideName: p.guide.user.name || 'Guide',
    guideRating: p.guide.averageRating,
    guideReviewCount: p.guide.totalReviews ?? 0,
    guideCertification: p.guide.certifications?.[0] || undefined,
    meetingPoint: p.fixedDepartures?.[0]?.meetingPoint || undefined,
    price: p.fixedDepartures?.[0]?.pricePerPerson ?? null,
    seatsLeft: p.fixedDepartures?.[0]
      ? p.fixedDepartures[0].totalSeats - (p.fixedDepartures[0].bookedSeats || 0)
      : undefined,
  };
}

interface TripDetailProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: TripDetailProps): Promise<Metadata> {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      guide: { include: { user: { select: { name: true } } } },
      destination: { include: { city: { include: { state: { select: { name: true } } } } } },
    },
  });
  if (!product) return { title: 'Trip Not Found' };
  
  const categoryLabel = CATEGORY_MAP[product.packageCategory as keyof typeof CATEGORY_MAP]?.label || 'Experience';
  const stateName = product.destination.city.state.name;

  const title = `${product.title} — ${categoryLabel} in ${product.destination.name}, ${stateName} | Book The Guide`;
  const description = `Book ${product.title} in ${product.destination.name}, ${stateName}. ${product.description?.slice(0, 120) || `${categoryLabel} with guide ${product.guide.user.name}`}. ✓ Verified Guide ✓ Instant Booking ✓ Best Price`;
  const url = `https://www.booktheguide.com/trips/${params.slug}`;

  // Try WordPress Yoast SEO first for content-marketing-optimized metadata
  const wpTrip = await getTrip(params.slug);
  if (wpTrip?.seo) {
    return wpSeoToMetadata(wpTrip.seo, {
      title,
      description,
      url,
      image: product.coverImage || undefined,
    });
  }
  
  return {
    title,
    description,
    keywords: `${product.title}, ${product.destination.name}, ${stateName}, ${categoryLabel}, ${product.activityType}, ${product.guide.user.name}, book ${product.destination.name} guide`,
    openGraph: {
      title: `${product.title} | Book The Guide`,
      description: product.description?.slice(0, 160) || `${categoryLabel} in ${product.destination.name} with ${product.guide.user.name}`,
      url: `https://www.booktheguide.com/trips/${params.slug}`,
      images: product.coverImage ? [{ url: product.coverImage, width: 1200, height: 630, alt: product.title }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.title} | Book The Guide`,
      description: `${categoryLabel} in ${product.destination.name}. Book verified guide instantly.`,
    },
    alternates: {
      canonical: `https://www.booktheguide.com/trips/${params.slug}`,
    },
  };
}

export default async function TripDetailPage({ params }: TripDetailProps) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      guide: {
        include: {
          user: { select: { name: true, image: true } },
          reviews: {
            include: { customer: { select: { name: true, image: true } } },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      },
      destination: {
        include: { city: { include: { state: { select: { id: true, name: true } } } } },
      },
      fixedDepartures: {
        where: {
          isActive: true,
          approvalStatus: 'APPROVED',
          startDate: { gte: new Date() },
        },
        orderBy: { startDate: 'asc' },
      },
    },
  });

  if (!product || !product.isActive || product.status !== 'APPROVED') notFound();

  // Get reviews from guide
  const reviews = product.guide.reviews || [];

  // Fetch related products + WordPress trip content in parallel
  const [relatedByDestination, relatedByCategory, moreFromGuide, wpTripContent] = await Promise.all([
    // Products in same destination (any guide)
    prisma.product.findMany({
      where: {
        destinationId: product.destinationId,
        status: 'APPROVED',
        isActive: true,
        id: { not: product.id },
      },
      include: {
        destination: { include: { city: { include: { state: { select: { name: true } } } } } },
        guide: { include: { user: { select: { name: true, image: true } } } },
        fixedDepartures: {
          where: { isActive: true, approvalStatus: 'APPROVED', startDate: { gte: new Date() } },
          orderBy: { pricePerPerson: 'asc' as const },
          take: 1,
          select: { pricePerPerson: true, meetingPoint: true, totalSeats: true, bookedSeats: true },
        },
      },
      take: 4,
    }) as any,
    // Products in same category (any guide)
    prisma.product.findMany({
      where: {
        packageCategory: product.packageCategory,
        status: 'APPROVED',
        isActive: true,
        id: { not: product.id },
      },
      include: {
        destination: { include: { city: { include: { state: { select: { name: true } } } } } },
        guide: { include: { user: { select: { name: true, image: true } } } },
        fixedDepartures: {
          where: { isActive: true, approvalStatus: 'APPROVED', startDate: { gte: new Date() } },
          orderBy: { pricePerPerson: 'asc' as const },
          take: 1,
          select: { pricePerPerson: true, meetingPoint: true, totalSeats: true, bookedSeats: true },
        },
      },
      take: 4,
    }) as any,
    // More from this guide
    prisma.product.findMany({
      where: {
        guideId: product.guideId,
        status: 'APPROVED',
        isActive: true,
        id: { not: product.id },
      },
      include: {
        destination: { include: { city: { include: { state: { select: { name: true } } } } } },
        guide: { include: { user: { select: { name: true, image: true } } } },
        fixedDepartures: {
          where: { isActive: true, approvalStatus: 'APPROVED', startDate: { gte: new Date() } },
          orderBy: { pricePerPerson: 'asc' as const },
          take: 1,
          select: { pricePerPerson: true, meetingPoint: true, totalSeats: true, bookedSeats: true },
        },
      },
      take: 4,
    }) as any,
    // WordPress trip content for SEO
    getTripContent(params.slug),
  ]);

  const allImages = [product.coverImage, ...(product.images || [])].filter(Boolean) as string[];
  const stateName = product.destination.city.state.name;
  const stateSlug = stateName.toLowerCase().replace(/\s+/g, '-');
  const cityName = product.destination.city.name;
  const destName = product.destination.name;
  const categorySlug = product.packageCategory || 'TOURIST_GUIDES';
  const categoryMeta = CATEGORY_MAP[categorySlug as keyof typeof CATEGORY_MAP];
  const categoryUrlSlug = categoryMeta?.urlSlug || 'tourist-guides';
  const lowestPrice = product.fixedDepartures?.length
    ? Math.min(...product.fixedDepartures.map((d: any) => d.pricePerPerson))
    : null;

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <main className="bg-btg-cream min-h-screen">
      {/* ───── Hero ───── */}
      <section className="relative h-[65vh] min-h-[460px] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          {product.coverImage ? (
            <Image src={product.coverImage} alt={destName} fill sizes="100vw" className="object-cover" priority />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-btg-dark to-btg-sage" />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-16 pb-12">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-btg-primary mb-3 font-heading">
            {categoryMeta?.label || 'Experience'} · {stateName}
          </p>
          <h1 className="font-heading text-4xl md:text-6xl font-bold text-white mb-3 leading-tight">
            {product.title}
          </h1>
          <p className="text-lg text-white/70 font-body italic mb-4 max-w-2xl">
            {destName}, {cityName}, {stateName}
          </p>
          <div className="flex flex-wrap gap-3">
            <span className="text-xs bg-white/15 backdrop-blur-sm text-white px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> {product.durationDays}D / {product.durationNights}N
            </span>
            <span className="text-xs bg-white/15 backdrop-blur-sm text-white px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-btg-gold fill-btg-gold" /> {product.guide.averageRating.toFixed(1)} ({product.guide.totalReviews} reviews)
            </span>
            {product.guide.isVerified && (
              <span className="text-xs bg-white/15 backdrop-blur-sm text-white px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Verified Guide
              </span>
            )}
            {(product as any).maxGroupSize && (
              <span className="text-xs bg-white/15 backdrop-blur-sm text-white px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Max {(product as any).maxGroupSize} people
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ───── Breadcrumb ───── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-16 py-4">
        <nav className="flex items-center gap-2 text-sm text-btg-light-text font-body">
          <Link href="/" className="hover:text-btg-primary transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href={`/experiences/${categoryUrlSlug}`} className="hover:text-btg-primary transition-colors">{categoryMeta?.label}</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href={`/explore/${stateSlug}`} className="hover:text-btg-primary transition-colors">{stateName}</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-btg-dark font-medium">{product.title}</span>
        </nav>
      </div>

      {/* ───── Main Content Grid ───── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-16 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Trip Details */}
            <div>
              <h2 className="font-heading text-3xl font-bold text-btg-dark mb-4">{product.title}</h2>
              <p className="text-btg-light-text font-body leading-relaxed text-[15px] mb-6">
                {product.description || 'Tour description coming soon...'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-btg-sand shadow-sm text-center">
                  <Clock className="w-6 h-6 text-btg-primary mx-auto mb-2" />
                  <p className="text-xs text-btg-light-text font-body">Duration</p>
                  <p className="font-heading text-lg font-semibold text-btg-dark">{product.durationDays}D / {product.durationNights}N</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-btg-sand shadow-sm text-center">
                  <MapPin className="w-6 h-6 text-btg-primary mx-auto mb-2" />
                  <p className="text-xs text-btg-light-text font-body">Meeting Point</p>
                  <p className="font-heading text-sm font-semibold text-btg-dark">{(product as any).meetingPoint || `${cityName}, ${stateName}`}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-btg-sand shadow-sm text-center">
                  <Users className="w-6 h-6 text-btg-primary mx-auto mb-2" />
                  <p className="text-xs text-btg-light-text font-body">Group Size</p>
                  <p className="font-heading text-lg font-semibold text-btg-dark">{(product as any).maxGroupSize || 'Flexible'}</p>
                </div>
              </div>
            </div>

            {/* What's Included */}
            {(product.inclusions.length > 0 || product.exclusions.length > 0) && (
              <div>
                <h3 className="font-heading text-2xl font-bold text-btg-dark mb-4">What&apos;s Included</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {product.inclusions.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 border border-btg-sand shadow-sm">
                      <h4 className="font-heading text-sm font-semibold text-btg-sage mb-3 uppercase tracking-wider">Included</h4>
                      <ul className="space-y-2.5">
                        {product.inclusions.map((item, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-btg-dark font-body">
                            <CheckCircle2 className="w-4 h-4 text-btg-sage mt-0.5 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {product.exclusions.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 border border-btg-sand shadow-sm">
                      <h4 className="font-heading text-sm font-semibold text-red-500 mb-3 uppercase tracking-wider">Not Included</h4>
                      <ul className="space-y-2.5">
                        {product.exclusions.map((item, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-btg-dark font-body">
                            <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* About Guide */}
            <div className="bg-white rounded-2xl p-6 border border-btg-sand shadow-sm">
              <h3 className="font-heading text-2xl font-bold text-btg-dark mb-5">Your Guide</h3>
              <div className="flex items-start gap-4">
                {product.guide.user.image ? (
                  <Image src={product.guide.user.image} alt={product.guide.user.name || ''} width={64} height={64} className="w-16 h-16 rounded-full object-cover border-2 border-btg-primary" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-btg-primary/15 flex items-center justify-center text-btg-primary font-heading font-bold text-lg">
                    {(product.guide.user.name || 'G').charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-heading text-lg font-semibold text-btg-dark">{product.guide.user.name}</h4>
                  {product.guide.tagline && <p className="text-sm text-btg-light-text font-body mt-0.5">{product.guide.tagline}</p>}
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-btg-light-text font-body">
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-btg-gold fill-btg-gold" /> {product.guide.averageRating.toFixed(1)}
                    </span>
                    <span>{product.guide.totalTrips} trips</span>
                    <span>{product.guide.experienceYears} yrs exp</span>
                    {product.guide.isVerified && (
                      <span className="flex items-center gap-1 text-btg-primary"><Shield className="w-3.5 h-3.5" /> Verified</span>
                    )}
                  </div>
                  {product.guide.bio && (
                    <p className="text-sm text-btg-light-text font-body mt-3 leading-relaxed line-clamp-3">{product.guide.bio}</p>
                  )}
                  <Link href={`/guides/${product.guide.slug}`} className="inline-flex items-center gap-1.5 text-sm text-btg-primary font-semibold mt-3 hover:underline font-heading">
                    View Full Profile <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Cancellation Policy */}
            <div className="bg-white rounded-2xl p-6 border border-btg-sand shadow-sm">
              <h3 className="font-heading text-2xl font-bold text-btg-dark mb-4">Cancellation &amp; Refund Policy</h3>
              <div className="space-y-2.5">
                {(product as any).cancellationPolicy ? (() => {
                  try {
                    const rules = typeof (product as any).cancellationPolicy === 'string'
                      ? JSON.parse((product as any).cancellationPolicy)
                      : (product as any).cancellationPolicy;
                    if (Array.isArray(rules) && rules.length > 0) {
                      return rules.map((rule: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-btg-cream rounded-lg">
                          <span className="text-sm text-btg-dark font-body">
                            Cancel <strong>{rule.hours}+ hours</strong> before &rarr; <strong className="text-btg-sage">{rule.refundPercent}% refund</strong>
                          </span>
                        </div>
                      ));
                    }
                    return <p className="text-sm text-btg-light-text font-body">{String((product as any).cancellationPolicy)}</p>;
                  } catch {
                    return <p className="text-sm text-btg-light-text font-body">{String((product as any).cancellationPolicy)}</p>;
                  }
                })() : (
                  <>
                    <div className="flex items-center gap-3 p-3 bg-btg-cream rounded-lg">
                      <span className="text-sm text-btg-dark font-body">Cancel <strong>7+ days</strong> before &rarr; <strong className="text-btg-sage">100% refund</strong></span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-btg-cream rounded-lg">
                      <span className="text-sm text-btg-dark font-body">Cancel <strong>3-7 days</strong> before &rarr; <strong className="text-btg-sage">50% refund</strong></span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-btg-cream rounded-lg">
                      <span className="text-sm text-btg-dark font-body">Cancel <strong>&lt; 3 days</strong> before &rarr; <strong className="text-red-500">No refund</strong></span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Gallery */}
            {allImages.length > 0 && (
              <div>
                <h3 className="font-heading text-2xl font-bold text-btg-dark mb-4">Gallery</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {allImages.slice(0, 6).map((img, i) => (
                    <div key={i} className="aspect-[4/3] rounded-xl overflow-hidden shadow-sm relative">
                      <Image src={img} alt={`Gallery ${i + 1}`} fill sizes="(max-width: 640px) 50vw, 33vw" className="object-cover" loading="lazy" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <div>
                <h3 className="font-heading text-2xl font-bold text-btg-dark mb-4">Reviews</h3>
                <div className="space-y-4">
                  {reviews.map((review: any) => (
                    <div key={review.id} className="bg-white rounded-2xl p-6 border border-btg-sand shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-btg-primary/15 flex items-center justify-center text-btg-primary font-bold text-sm">
                            {review.customer.name[0]}
                          </div>
                          <div>
                            <p className="font-heading text-sm font-semibold text-btg-dark">{review.customer.name}</p>
                            <p className="text-xs text-btg-light-text font-body">{formatDate(review.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          {Array.from({ length: review.overallRating }).map((_, i) => (
                            <Star key={i} className="w-4 h-4 text-btg-gold fill-btg-gold" />
                          ))}
                        </div>
                      </div>
                      {review.comment && <p className="text-sm text-btg-light-text font-body leading-relaxed">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ───── More {Destination} Packages ───── */}
            {relatedByDestination.length > 0 && (
              <div>
                <div className="flex items-end justify-between mb-5">
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-btg-primary mb-1 font-heading">Same Destination</p>
                    <h3 className="font-heading text-2xl font-bold text-btg-dark">More {destName} Packages</h3>
                    <p className="text-sm text-btg-light-text font-body mt-1">Compare packages for {destName} from different guides.</p>
                  </div>
                  <Link href={`/search?destination=${encodeURIComponent(destName)}`} className="hidden sm:flex items-center gap-1.5 text-xs text-btg-primary font-semibold hover:underline font-heading">
                    View All <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="space-y-4">
                  {relatedByDestination.map((p: any) => (
                    <PackageCard key={p.id} pkg={toCard(p)} />
                  ))}
                </div>
              </div>
            )}

            {/* ───── Similar Category Packages ───── */}
            {relatedByCategory.length > 0 && (
              <div>
                <div className="flex items-end justify-between mb-5">
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-btg-primary mb-1 font-heading">Similar Experiences</p>
                    <h3 className="font-heading text-2xl font-bold text-btg-dark">More {categoryMeta?.label || 'Experiences'}</h3>
                    <p className="text-sm text-btg-light-text font-body mt-1">Explore similar experiences across destinations.</p>
                  </div>
                  <Link href={`/experiences/${categoryUrlSlug}`} className="hidden sm:flex items-center gap-1.5 text-xs text-btg-primary font-semibold hover:underline font-heading">
                    View All <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="space-y-4">
                  {relatedByCategory.map((p: any) => (
                    <PackageCard key={p.id} pkg={toCard(p)} />
                  ))}
                </div>
              </div>
            )}

            {/* ───── More from this Guide ───── */}
            {moreFromGuide.length > 0 && (
              <div>
                <div className="flex items-end justify-between mb-5">
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-btg-primary mb-1 font-heading">From This Guide</p>
                    <h3 className="font-heading text-2xl font-bold text-btg-dark">More from {product.guide.user.name}</h3>
                    <p className="text-sm text-btg-light-text font-body mt-1">Other trips offered by this guide.</p>
                  </div>
                  <Link href={`/guides/${product.guide.slug}`} className="hidden sm:flex items-center gap-1.5 text-xs text-btg-primary font-semibold hover:underline font-heading">
                    View Profile <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="space-y-4">
                  {moreFromGuide.map((p: any) => (
                    <PackageCard key={p.id} pkg={toCard(p)} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar — Booking Card */}
          <div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-btg-sand sticky top-24">
              <h3 className="font-heading text-lg font-semibold text-btg-dark mb-1">Book This Experience</h3>
              <p className="text-xs text-btg-light-text font-body mb-4">{categoryMeta?.label} in {destName}</p>

              {lowestPrice && (
                <div className="mb-4">
                  <p className="text-xs text-btg-light-text font-body">Starting from</p>
                  <p className="font-heading text-3xl font-bold text-btg-dark">{formatCurrency(lowestPrice)}</p>
                  <p className="text-xs text-btg-light-text font-body">per person</p>
                </div>
              )}

              {/* Upcoming Departures */}
              {product.fixedDepartures.length > 0 && (
                <div className="space-y-3 mb-5">
                  <p className="text-xs font-semibold text-btg-light-text uppercase tracking-wider font-heading">Available Dates</p>
                  {product.fixedDepartures.slice(0, 3).map((dep: any) => (
                    <Link key={dep.id} href={`/book/fixed/${dep.id}`} className="block p-3 bg-btg-cream rounded-xl hover:bg-btg-sand transition-colors border border-btg-sand">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-body">
                          <Calendar className="w-3.5 h-3.5 text-btg-primary" />
                          <span className="text-btg-dark font-medium">{formatDate(dep.startDate)}</span>
                        </div>
                        <span className="text-sm font-bold text-btg-primary font-heading">{formatCurrency(dep.pricePerPerson)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {product.fixedDepartures.length > 0 ? (
                <Link
                  href={`/book/fixed/${product.fixedDepartures[0].id}`}
                  className="block w-full text-center bg-btg-primary text-white text-sm font-semibold py-3.5 rounded-full hover:bg-btg-primary/90 transition-colors font-heading shadow-lg"
                >
                  Book Now
                </Link>
              ) : (
                <Link
                  href={`/book/personal/${product.guide.slug}`}
                  className="block w-full text-center bg-btg-primary text-white text-sm font-semibold py-3.5 rounded-full hover:bg-btg-primary/90 transition-colors font-heading shadow-lg"
                >
                  Request a Quote
                </Link>
              )}
              <p className="text-xs text-btg-light-text text-center mt-3 font-body">No hidden fees · Instant confirmation</p>
            </div>
          </div>
        </div>
      </section>

      {/* ───── AI CTA ───── */}
      <section className="bg-gradient-to-r from-btg-primary to-btg-sage py-16">
        <div className="max-w-4xl mx-auto text-center px-6">
          <span className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-semibold px-4 py-2 rounded-full mb-6 font-heading">
            <Sparkles className="w-4 h-4" /> AI Powered
          </span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
            Need Help Planning?
          </h2>
          <p className="text-white/80 font-body text-lg mb-8 max-w-2xl mx-auto">
            Chat with our AI Travel Assistant to create the perfect {destName} tour tailored to your preferences.
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 lg:p-8">
            <AiTravelAssistant />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link href={`/explore/${stateSlug}`} className="bg-white text-btg-dark font-semibold px-8 py-3.5 rounded-full hover:bg-btg-cream transition-colors font-heading text-sm">
              Explore {stateName}
            </Link>
            <Link href="/contact" className="border-2 border-white text-white font-semibold px-8 py-3.5 rounded-full hover:bg-white/10 transition-colors font-heading text-sm">
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ WORDPRESS SEO CONTENT ═══════════════ */}
      {wpTripContent.overview && (
        <section className="py-14 px-6 md:px-12 bg-white">
          <div className="max-w-4xl mx-auto prose prose-lg font-body" dangerouslySetInnerHTML={{ __html: wpTripContent.overview }} />
        </section>
      )}
      {wpTripContent.raw?.tripFields && (
        <>
          <WPSeoContentBlock content={wpTripContent.seoContentBlock} />
          <WPFaqSection faqs={wpTripContent.faqItems} />
          <WPInternalLinksGrid links={wpTripContent.internalLinks} />
        </>
      )}

      {/* =================== JSON-LD: Product + BreadcrumbList =================== */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.title,
            description: product.description?.slice(0, 300) || '',
            image: product.coverImage || '',
            url: `https://www.booktheguide.com/trips/${product.slug}`,
            brand: { '@type': 'Brand', name: 'Book The Guide' },
            category: categoryMeta?.label || 'Experience',
            ...(lowestPrice ? {
              offers: {
                '@type': 'Offer',
                price: lowestPrice,
                priceCurrency: 'INR',
                availability: 'https://schema.org/InStock',
                url: `https://www.booktheguide.com/trips/${product.slug}`,
                seller: { '@type': 'Organization', name: 'Book The Guide' },
              },
            } : {}),
            ...(product.guide.averageRating > 0 ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: product.guide.averageRating,
                reviewCount: product.guide.totalReviews || 1,
                bestRating: 5,
              },
            } : {}),
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
              { '@type': 'ListItem', position: 2, name: categoryMeta?.label || 'Experiences', item: `https://www.booktheguide.com/experiences/${categoryUrlSlug}` },
              { '@type': 'ListItem', position: 3, name: stateName, item: `https://www.booktheguide.com/explore/${stateSlug}` },
              { '@type': 'ListItem', position: 4, name: product.title, item: `https://www.booktheguide.com/trips/${product.slug}` },
            ],
          }),
        }}
      />
    </main>
  );
}
