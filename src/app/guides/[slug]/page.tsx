import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { formatCurrency, formatDate, formatDateRange, getRemainingSeats, ACTIVITY_LABELS, DIFFICULTY_LABELS } from '@/lib/utils';
import {
  MapPin, Shield, Calendar, Mountain, Languages, GraduationCap,
  Award, Star, ChevronRight,
} from 'lucide-react';

interface GuideProfilePageProps {
  params: { slug: string };
}

function getLocationString(serviceAreas: { state: { name: string } }[]): string {
  if (!serviceAreas || serviceAreas.length === 0) return 'India';
  const first = serviceAreas[0];
  return first.state.name;
}

export async function generateMetadata({ params }: GuideProfilePageProps): Promise<Metadata> {
  const guide = await prisma.guideProfile.findUnique({
    where: { slug: params.slug },
    include: {
      user: { select: { name: true } },
      serviceAreas: { include: { state: { select: { name: true } } } },
    },
  });
  if (!guide) return { title: 'Guide Not Found' };
  const location = getLocationString(guide.serviceAreas);
  return {
    title: `${guide.user.name} - Local Guide in ${location}`,
    description: `Book ${guide.user.name} as your local guide in ${location}. ${guide.experienceYears || 0} years experience, ${guide.totalTrips} trips completed, ${guide.averageRating.toFixed(1)} average rating. ${guide.tagline || ''}`,
    openGraph: {
      title: `${guide.user.name} - Book The Guide`,
      description: guide.bio?.slice(0, 160) || '',
      images: guide.coverImage ? [{ url: guide.coverImage }] : [],
    },
  };
}

export default async function GuideProfilePage({ params }: GuideProfilePageProps) {
  const guide = await prisma.guideProfile.findUnique({
    where: { slug: params.slug },
    include: {
      user: { select: { name: true, image: true, createdAt: true } },
      serviceAreas: { include: { state: { select: { name: true } } } },
      products: {
        where: { status: 'APPROVED', isActive: true },
        include: { destination: { select: { name: true, city: { select: { state: { select: { name: true } } } } } } },
        orderBy: { createdAt: 'desc' },
      },
      reviews: {
        include: {
          customer: { select: { name: true, image: true } },
          booking: { select: { tripType: true, startDate: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!guide || !guide.isActive) notFound();

  const upcomingDepartures = await prisma.fixedDeparture.findMany({
    where: { product: { guideId: guide.id, isActive: true }, isActive: true, startDate: { gte: new Date() } },
    include: {
      product: {
        select: {
          title: true, slug: true, activityType: true, difficultyLevel: true,
          durationDays: true, coverImage: true,
          destination: { select: { name: true, city: { select: { state: { select: { name: true } } } } } },
        },
      },
    },
    orderBy: { startDate: 'asc' },
  });

  const location = getLocationString(guide.serviceAreas);
  const coverImg = guide.coverImage || guide.portfolioImages?.[0] || '';

  return (
    <main className="bg-btg-cream min-h-screen">
      {/* ───── Hero ───── */}
      <section className="relative h-[50vh] min-h-[380px] flex items-end overflow-hidden">
        {coverImg ? (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${coverImg})` }} />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-btg-dark to-btg-sage" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-16 pb-12">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-btg-primary mb-3 font-heading">
            Local Guide · {location}
          </p>
          <h1 className="font-heading text-4xl md:text-6xl font-bold text-white mb-3 leading-tight">
            {guide.user.name}
          </h1>
          {guide.tagline && <p className="text-lg text-white/70 font-body italic mb-4 max-w-2xl">{guide.tagline}</p>}
          <div className="flex flex-wrap gap-3">
            <span className="text-xs bg-white/15 backdrop-blur-sm text-white px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-btg-gold fill-btg-gold" /> {guide.averageRating.toFixed(1)} ({guide.totalReviews} reviews)
            </span>
            <span className="text-xs bg-white/15 backdrop-blur-sm text-white px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Mountain className="w-3.5 h-3.5" /> {guide.totalTrips} trips
            </span>
            <span className="text-xs bg-white/15 backdrop-blur-sm text-white px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> {guide.experienceYears || 0} yrs experience
            </span>
            {guide.isVerified && (
              <span className="text-xs bg-white/15 backdrop-blur-sm text-white px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Verified Guide
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
          <Link href="/guides" className="hover:text-btg-primary transition-colors">Guides</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-btg-dark font-medium">{guide.user.name}</span>
        </nav>
      </div>

      {/* ───── Main Content Grid ───── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-16 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Content */}
          <div className="lg:col-span-2 space-y-10">
            {/* About */}
            {guide.bio && (
              <div>
                <h2 className="font-heading text-3xl font-bold text-btg-dark mb-4">About {guide.user.name}</h2>
                <p className="text-btg-light-text font-body leading-relaxed text-[15px] whitespace-pre-wrap">{guide.bio}</p>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-btg-sand shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Languages className="w-5 h-5 text-btg-primary" />
                  <h3 className="font-heading text-sm font-semibold text-btg-dark">Languages</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {guide.languages.map((lang) => (
                    <span key={lang} className="bg-btg-primary/10 text-btg-primary text-xs font-medium px-3 py-1.5 rounded-full font-body">{lang}</span>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-btg-sand shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <GraduationCap className="w-5 h-5 text-btg-primary" />
                  <h3 className="font-heading text-sm font-semibold text-btg-dark">Education</h3>
                </div>
                <p className="text-sm text-btg-light-text font-body">{guide.education || 'Not specified'}</p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-btg-sand shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-5 h-5 text-btg-primary" />
                  <h3 className="font-heading text-sm font-semibold text-btg-dark">Certifications</h3>
                </div>
                {guide.certifications.length > 0 ? (
                  <ul className="space-y-1.5">
                    {guide.certifications.map((cert) => (
                      <li key={cert} className="text-sm text-btg-light-text font-body flex items-start gap-2">
                        <ChevronRight className="w-3.5 h-3.5 text-btg-primary mt-0.5 flex-shrink-0" />
                        {cert}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-btg-light-text font-body">No certifications listed</p>
                )}
              </div>
              <div className="bg-white rounded-2xl p-5 border border-btg-sand shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-btg-primary" />
                  <h3 className="font-heading text-sm font-semibold text-btg-dark">Service Areas</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {guide.serviceAreas.map((area) => (
                    <span key={area.id} className="bg-btg-sand text-btg-dark text-xs px-2.5 py-1 rounded-full font-body">{area.state.name}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Specializations */}
            {guide.specializations.length > 0 && (
              <div>
                <h3 className="font-heading text-lg font-semibold text-btg-dark mb-3">Specializations</h3>
                <div className="flex flex-wrap gap-2">
                  {guide.specializations.map((spec) => (
                    <span key={spec} className="bg-btg-primary/10 text-btg-primary text-xs font-medium px-3 py-1.5 rounded-full font-body">{spec}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Tour Packages */}
            {guide.products.length > 0 && (
              <div>
                <h2 className="font-heading text-3xl font-bold text-btg-dark mb-3">Tour Packages</h2>
                <p className="text-btg-light-text font-body mb-6">Experiences offered by {guide.user.name}.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {guide.products.map((product) => (
                    <Link key={product.id} href={`/trips/${product.slug}`} className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-btg-sand">
                      <div className="relative h-40">
                        {product.coverImage ? (
                          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${product.coverImage})` }} />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-btg-primary/20 to-btg-sage/20" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute top-3 left-3 flex gap-1.5">
                          <span className="text-[10px] bg-white/90 text-btg-dark px-2.5 py-1 rounded-full font-body font-medium">{ACTIVITY_LABELS[product.activityType] || product.activityType}</span>
                          <span className="text-[10px] bg-white/90 text-btg-dark px-2.5 py-1 rounded-full font-body font-medium">{DIFFICULTY_LABELS[product.difficultyLevel] || product.difficultyLevel}</span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-heading text-base font-semibold text-btg-dark mb-1 line-clamp-1 group-hover:text-btg-primary transition-colors">{product.title}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-btg-light-text font-body mb-2">
                          <MapPin className="w-3 h-3" />
                          {product.destination.name}, {product.destination.city?.state?.name || ''}
                        </div>
                        <span className="text-xs text-btg-light-text font-body">{product.durationDays}D / {product.durationNights}N</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div>
              <h2 className="font-heading text-3xl font-bold text-btg-dark mb-3">Reviews ({guide.totalReviews})</h2>
              {guide.reviews.length > 0 ? (
                <div className="space-y-4">
                  {guide.reviews.map((review) => (
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
                      {(review.knowledgeRating || review.communicationRating || review.valueForMoneyRating || review.safetyRating) && (
                        <div className="mt-3 pt-3 border-t border-btg-sand grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {review.knowledgeRating && (
                            <div className="text-xs font-body">
                              <span className="text-btg-light-text">Knowledge</span>
                              <div className="flex items-center gap-1 mt-0.5">
                                <Star className="w-3 h-3 text-btg-gold fill-btg-gold" />
                                <span className="font-semibold text-btg-dark">{review.knowledgeRating}/5</span>
                              </div>
                            </div>
                          )}
                          {review.communicationRating && (
                            <div className="text-xs font-body">
                              <span className="text-btg-light-text">Communication</span>
                              <div className="flex items-center gap-1 mt-0.5">
                                <Star className="w-3 h-3 text-btg-gold fill-btg-gold" />
                                <span className="font-semibold text-btg-dark">{review.communicationRating}/5</span>
                              </div>
                            </div>
                          )}
                          {review.valueForMoneyRating && (
                            <div className="text-xs font-body">
                              <span className="text-btg-light-text">Value</span>
                              <div className="flex items-center gap-1 mt-0.5">
                                <Star className="w-3 h-3 text-btg-gold fill-btg-gold" />
                                <span className="font-semibold text-btg-dark">{review.valueForMoneyRating}/5</span>
                              </div>
                            </div>
                          )}
                          {review.safetyRating && (
                            <div className="text-xs font-body">
                              <span className="text-btg-light-text">Safety</span>
                              <div className="flex items-center gap-1 mt-0.5">
                                <Star className="w-3 h-3 text-btg-gold fill-btg-gold" />
                                <span className="font-semibold text-btg-dark">{review.safetyRating}/5</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-8 text-center border border-btg-sand shadow-sm">
                  <p className="text-btg-light-text font-body">No reviews yet. Be the first to book and review!</p>
                </div>
              )}
            </div>

            {/* Cancellation Policy */}
            {(guide as any).cancellationPolicy && (
              <div className="bg-white rounded-2xl p-6 border border-btg-sand shadow-sm">
                <h3 className="font-heading text-2xl font-bold text-btg-dark mb-4">Cancellation Policy</h3>
                <div className="space-y-2.5">
                  {(() => {
                    try {
                      const rules = typeof (guide as any).cancellationPolicy === 'string'
                        ? JSON.parse((guide as any).cancellationPolicy)
                        : (guide as any).cancellationPolicy;
                      if (Array.isArray(rules) && rules.length > 0) {
                        return rules.map((rule: any, i: number) => (
                          <div key={i} className="flex items-center gap-3 p-3 bg-btg-cream rounded-lg">
                            <span className="text-sm text-btg-dark font-body">
                              Cancel <strong>{rule.hours}+ hours</strong> before &rarr; <strong className="text-btg-sage">{rule.refundPercent}% refund</strong>
                            </span>
                          </div>
                        ));
                      }
                      return <p className="text-sm text-btg-light-text font-body">Contact guide for cancellation details.</p>;
                    } catch {
                      return <p className="text-sm text-btg-light-text font-body leading-relaxed whitespace-pre-wrap">{String((guide as any).cancellationPolicy)}</p>;
                    }
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-btg-sand sticky top-24">
              <h3 className="font-heading text-lg font-semibold text-btg-dark mb-1">Hire {guide.user.name}</h3>
              <p className="text-xs text-btg-light-text font-body mb-4">as your personal guide</p>
              <div className="text-center py-4">
                <p className="text-sm text-btg-light-text font-body">Tell us about your trip and {guide.user.name} will create a custom package with pricing just for you.</p>
              </div>
              <Link href={`/book/personal/${guide.slug}`} className="block w-full text-center bg-btg-primary text-white text-sm font-semibold py-3.5 rounded-full hover:bg-btg-primary/90 transition-colors font-heading shadow-lg">
                Request a Quote
              </Link>
              <p className="text-xs text-btg-light-text text-center mt-3 font-body">No payment required upfront</p>
            </div>

            {upcomingDepartures.length > 0 && (
              <div>
                <h3 className="font-heading text-lg font-semibold text-btg-dark mb-3">Upcoming Trips</h3>
                <div className="space-y-3">
                  {upcomingDepartures.map((dep) => {
                    const remaining = getRemainingSeats(dep.totalSeats, dep.bookedSeats);
                    return (
                      <div key={dep.id} className="bg-white rounded-xl p-4 border border-btg-sand shadow-sm hover:shadow-md transition-all">
                        <h4 className="font-heading text-sm font-semibold text-btg-dark mb-1 line-clamp-1">{dep.product.title}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-btg-light-text font-body mb-2">
                          <Calendar className="w-3 h-3" />
                          {formatDateRange(dep.startDate.toISOString(), dep.endDate.toISOString())}
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-btg-primary font-heading">{formatCurrency(dep.pricePerPerson)}</span>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${remaining <= 3 ? 'bg-btg-gold/15 text-btg-gold' : 'bg-btg-sage/15 text-btg-sage'}`}>
                            {remaining === 0 ? 'Full' : `${remaining} seats left`}
                          </span>
                        </div>
                        {remaining > 0 && (
                          <Link href={`/book/fixed/${dep.id}`} className="block text-center bg-btg-cream text-btg-primary font-semibold py-2 rounded-lg text-sm hover:bg-btg-sand transition-colors font-heading">
                            Join This Trip
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ───── CTA Section ───── */}
      <section className="bg-gradient-to-r from-btg-primary to-btg-sage py-16">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Explore with {guide.user.name}?
          </h2>
          <p className="text-white/80 font-body text-lg mb-8 max-w-2xl mx-auto">
            Book a verified local guide and experience India like never before.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={`/book/personal/${guide.slug}`} className="bg-white text-btg-dark font-semibold px-8 py-3.5 rounded-full hover:bg-btg-cream transition-colors font-heading text-sm">
              Request a Quote
            </Link>
            <Link href="/contact" className="border-2 border-white text-white font-semibold px-8 py-3.5 rounded-full hover:bg-white/10 transition-colors font-heading text-sm">
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: guide.user.name,
            description: guide.bio?.slice(0, 200) || '',
            address: { '@type': 'PostalAddress', addressLocality: location, addressCountry: 'IN' },
            aggregateRating: guide.totalReviews > 0
              ? { '@type': 'AggregateRating', ratingValue: guide.averageRating, reviewCount: guide.totalReviews, bestRating: 5 }
              : undefined,
            priceRange: 'Contact for pricing',
          }),
        }}
      />
    </main>
  );
}
