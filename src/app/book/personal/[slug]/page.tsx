import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import PersonalBookingForm from '@/components/booking/PersonalBookingForm';
import { Star, Shield, MapPin, Calendar, ChevronRight } from 'lucide-react';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = await prisma.guideProfile.findUnique({
    where: { slug: params.slug },
    include: { user: { select: { name: true } } },
  });

  if (!guide) return { title: 'Guide Not Found | Book The Guide' };

  return {
    title: `Book ${guide.user.name} | Book The Guide`,
    description: `Book ${guide.user.name} as your personal guide. Submit your trip details and receive a custom quote.`,
  };
}

export default async function BookPersonalGuidePage({ params }: Props) {
  const guide = await prisma.guideProfile.findUnique({
    where: { slug: params.slug, isActive: true, isVerified: true },
    include: {
      user: { select: { name: true, image: true } },
      serviceAreas: {
        include: {
          state: true,
        },
      },
    },
  });

  if (!guide) notFound();

  return (
    <main className="bg-btg-cream min-h-screen">
      {/* ───── Breadcrumb ───── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-16 pt-6 pb-2">
        <nav className="flex items-center gap-2 text-sm text-btg-light-text font-body">
          <Link href="/" className="hover:text-btg-primary transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/guides" className="hover:text-btg-primary transition-colors">Guides</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href={`/guides/${guide.slug}`} className="hover:text-btg-primary transition-colors">{guide.user.name}</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-btg-dark font-medium">Book</span>
        </nav>
      </div>

      {/* ───── Header ───── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-16 py-8">
        <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-btg-primary mb-3 font-heading">
          Personal Guide Booking
        </p>
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-btg-dark mb-2">
          Book {guide.user.name}
        </h1>
        <p className="text-btg-light-text font-body text-[15px] max-w-2xl">
          Choose your dates and share your trip details. {guide.user.name} will create a custom package with pricing just for you.
        </p>
      </section>

      {/* ───── Content Grid ───── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-16 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-btg-sand shadow-sm">
              <PersonalBookingForm guide={JSON.parse(JSON.stringify(guide))} />
            </div>
          </div>

          {/* Guide Summary Sidebar */}
          <div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-btg-sand sticky top-24">
              <h3 className="font-heading text-lg font-semibold text-btg-dark mb-4">Your Guide</h3>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-14 h-14 rounded-full bg-btg-primary/15 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {guide.user.image ? (
                    <img src={guide.user.image} alt={guide.user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-btg-primary font-heading">{guide.user.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <p className="font-heading text-base font-semibold text-btg-dark">{guide.user.name}</p>
                  {guide.isVerified && (
                    <span className="text-xs text-btg-primary font-medium flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Verified Guide
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3 text-sm font-body">
                {guide.experienceYears && (
                  <div className="flex justify-between">
                    <span className="text-btg-light-text">Experience</span>
                    <span className="font-medium text-btg-dark">{guide.experienceYears} years</span>
                  </div>
                )}
                {guide.averageRating > 0 && (
                  <div className="flex justify-between">
                    <span className="text-btg-light-text">Rating</span>
                    <span className="font-medium text-btg-dark flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-btg-gold fill-btg-gold" /> {guide.averageRating.toFixed(1)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-btg-light-text">Languages</span>
                  <span className="font-medium text-btg-dark">{guide.languages.slice(0, 3).join(', ')}</span>
                </div>
              </div>

              {guide.serviceAreas.length > 0 && (
                <div className="mt-5 pt-5 border-t border-btg-sand">
                  <p className="text-[10px] font-semibold text-btg-light-text uppercase tracking-wider mb-2 font-heading">Service Areas</p>
                  <div className="flex flex-wrap gap-1.5">
                    {guide.serviceAreas.map((area: any) => (
                      <span key={area.id} className="text-xs bg-btg-sand text-btg-dark px-2.5 py-1 rounded-full font-body">
                        {area.state.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-btg-sand mt-5 pt-5">
                <p className="text-sm text-btg-light-text font-body">
                  Submit your trip details and {guide.user.name} will send you a custom quote with pricing.
                </p>
              </div>

              {(guide as any).cancellationPolicy && (
                <div className="mt-5 pt-5 border-t border-btg-sand">
                  <p className="text-[10px] font-semibold text-btg-light-text uppercase tracking-wider mb-2 font-heading">Cancellation Policy</p>
                  {(() => {
                    try {
                      const rules = typeof (guide as any).cancellationPolicy === 'string'
                        ? JSON.parse((guide as any).cancellationPolicy)
                        : (guide as any).cancellationPolicy;
                      if (Array.isArray(rules)) {
                        return (
                          <div className="space-y-1.5">
                            {rules.map((r: any, i: number) => (
                              <div key={i} className="flex items-center gap-2 p-2 bg-btg-cream rounded-lg">
                                <span className="text-xs text-btg-dark font-body">
                                  {r.hours}h+ before &rarr; <strong className="text-btg-sage">{r.refundPercent}%</strong> refund
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return <p className="text-xs text-btg-light-text font-body">Contact guide for details</p>;
                    } catch {
                      return <p className="text-xs text-btg-light-text font-body">{String((guide as any).cancellationPolicy)}</p>;
                    }
                  })()}
                </div>
              )}

              <Link
                href={`/guides/${guide.slug}`}
                className="block w-full text-center text-sm text-btg-primary font-semibold mt-5 hover:underline font-heading"
              >
                View Full Profile
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
