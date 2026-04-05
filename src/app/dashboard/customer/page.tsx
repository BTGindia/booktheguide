import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { ClipboardList, Star, MapPin, Calendar, ArrowRight, Compass, Mountain, Users, Sparkles } from 'lucide-react';

export default async function CustomerDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const userId = (session.user as any).id;

  const [bookings, reviewsCount] = await Promise.all([
    prisma.booking.findMany({
      where: { customerId: userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        guide: {
          include: {
            user: { select: { name: true } },
            serviceAreas: { include: { state: { select: { name: true } } } },
          },
        },
        fixedDeparture: {
          include: {
            product: { select: { title: true } },
          },
        },
        review: { select: { id: true } },
      },
    }),
    prisma.review.count({ where: { customerId: userId } }),
  ]);

  const upcomingBookings = bookings.filter(
    (b) => b.status === 'CONFIRMED' && (b.startDate ? new Date(b.startDate) >= new Date() : true)
  );

  const hasBookings = bookings.length > 0;
  const firstName = session.user.name?.split(' ')[0];

  return (
    <div>
      {/* Hero Welcome Banner */}
      <div className="relative mb-8 rounded-2xl overflow-hidden bg-gradient-to-br from-[#1A4D4A] via-[#58bdae] to-[#7A9E7E] p-8 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-8 w-32 h-32 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute bottom-4 left-12 w-24 h-24 rounded-full bg-white/15 blur-xl" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <span className="text-sm font-medium text-white/80">Welcome back</span>
          </div>
          <h1 className="text-3xl font-bold font-heading">
            Hello, {firstName}! 👋
          </h1>
          <p className="text-white/80 mt-2 max-w-md">
            {hasBookings
              ? 'Here\'s a quick snapshot of your travel journey with Book The Guide.'
              : 'Your travel journey starts here. Let\'s find you the perfect guide!'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="group hover:shadow-lg transition-shadow border-l-4 border-l-[#58bdae]">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#58bdae]/10 flex items-center justify-center group-hover:bg-[#58bdae]/20 transition-colors">
                <ClipboardList className="w-6 h-6 text-[#58bdae]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-btg-dark">{bookings.length}</p>
                <p className="text-xs text-gray-500">Total Bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-lg transition-shadow border-l-4 border-l-[#7A9E7E]">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#7A9E7E]/10 flex items-center justify-center group-hover:bg-[#7A9E7E]/20 transition-colors">
                <Calendar className="w-6 h-6 text-[#7A9E7E]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-btg-dark">{upcomingBookings.length}</p>
                <p className="text-xs text-gray-500">Upcoming Trips</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-lg transition-shadow border-l-4 border-l-amber-500">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                <Star className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-btg-dark">{reviewsCount}</p>
                <p className="text-xs text-gray-500">Reviews Given</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CTA — conditional based on booking status */}
      {hasBookings ? (
        <Card className="mb-8 bg-gradient-to-r from-btg-cream to-white border-btg-sand">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-btg-dark">Ready for your next adventure?</h3>
              <p className="text-sm text-gray-600">Discover new destinations with verified local guides across India</p>
            </div>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 bg-[#58bdae] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#4aa99b] transition-colors whitespace-nowrap"
            >
              Find Guides <ArrowRight className="w-4 h-4" />
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="mb-8">
          <Card className="border-none shadow-lg overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-[#F5F0E8] to-white p-8">
                <div className="text-center max-w-lg mx-auto mb-8">
                  <div className="w-16 h-16 rounded-full bg-[#58bdae]/10 flex items-center justify-center mx-auto mb-4">
                    <Compass className="w-8 h-8 text-[#58bdae]" />
                  </div>
                  <h3 className="text-xl font-bold text-btg-dark mb-2">
                    You haven&apos;t made any bookings yet
                  </h3>
                  <p className="text-gray-600">
                    Ready to plan a trip with India&apos;s best guides?
                  </p>
                </div>

                {/* Explore Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <Link href="/explore" className="group">
                    <div className="relative h-40 rounded-xl overflow-hidden bg-gradient-to-br from-[#1A4D4A] to-[#58bdae] p-5 flex flex-col justify-end">
                      <Mountain className="w-8 h-8 text-white/30 absolute top-4 right-4 group-hover:text-white/50 transition-colors" />
                      <h4 className="text-white font-bold text-lg">Explore Destinations</h4>
                      <p className="text-white/70 text-sm">Mountains, beaches, heritage &amp; more</p>
                    </div>
                  </Link>
                  <Link href="/experiences/tourist-guides" className="group">
                    <div className="relative h-40 rounded-xl overflow-hidden bg-gradient-to-br from-[#E8943A] to-[#FF7F50] p-5 flex flex-col justify-end">
                      <Compass className="w-8 h-8 text-white/30 absolute top-4 right-4 group-hover:text-white/50 transition-colors" />
                      <h4 className="text-white font-bold text-lg">Find Experiences</h4>
                      <p className="text-white/70 text-sm">Curated trips by expert guides</p>
                    </div>
                  </Link>
                  <Link href="/guides" className="group">
                    <div className="relative h-40 rounded-xl overflow-hidden bg-gradient-to-br from-[#7A9E7E] to-[#58bdae] p-5 flex flex-col justify-end">
                      <Users className="w-8 h-8 text-white/30 absolute top-4 right-4 group-hover:text-white/50 transition-colors" />
                      <h4 className="text-white font-bold text-lg">Meet Our Guides</h4>
                      <p className="text-white/70 text-sm">Verified locals who know India best</p>
                    </div>
                  </Link>
                </div>

                <div className="text-center">
                  <Link
                    href="/search"
                    className="inline-flex items-center gap-2 bg-[#58bdae] text-white font-bold px-8 py-3.5 rounded-full hover:bg-[#4aa99b] transition-colors text-base shadow-lg shadow-[#58bdae]/25"
                  >
                    Start Planning Your Trip <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bookings List */}
      {hasBookings && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-btg-dark">Your Bookings</h2>
              <Link href="/dashboard/customer/bookings" className="text-sm text-btg-terracotta hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {bookings.map((booking) => (
                <div key={booking.id} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">
                        {booking.tripType === 'FIXED_DEPARTURE' && booking.fixedDeparture
                          ? booking.fixedDeparture.product.title
                          : `Personal Guide - ${booking.guide.user.name}`}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {booking.bookingNumber} &bull; Guide: {booking.guide.user.name}
                      </p>
                      {booking.startDate && (
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(booking.startDate)}
                          {booking.endDate && ` - ${formatDate(booking.endDate)}`}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-btg-terracotta">
                        {formatCurrency(booking.totalAmount)}
                      </p>
                      <Badge
                        variant={
                          booking.status === 'CONFIRMED' ? 'success' :
                          booking.status === 'COMPLETED' ? 'info' :
                          booking.status === 'CANCELLED' ? 'danger' : 'warning'
                        }
                        size="sm"
                      >
                        {booking.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Review CTA */}
                  {booking.status === 'COMPLETED' && !booking.review && (
                    <Link
                      href={`/dashboard/customer/reviews/new?bookingId=${booking.id}`}
                      className="inline-flex items-center gap-1 mt-2 text-xs text-amber-600 font-semibold hover:underline"
                    >
                      <Star className="w-3 h-3" /> Write a Review
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
