import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  Mountain, Star, Calendar, Users, IndianRupee, 
  ClipboardList, TrendingUp, AlertCircle, Package,
  CalendarDays, AlertTriangle, ArrowRight, Eye,
  Shield, Award, Wallet
} from 'lucide-react';
import Link from 'next/link';
import GuideHealthDashboard from '@/components/guide/GuideHealthDashboard';
import ProfileCompletenessWidget from '@/components/guide/ProfileCompletenessWidget';
import VerificationStatusBadge from '@/components/guide/VerificationStatusBadge';

export default async function GuideDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'GUIDE') redirect('/login');

  const guideProfile = await prisma.guideProfile.findUnique({
    where: { userId: (session.user as any).id },
    include: {
      _count: {
        select: {
          products: true,
          bookings: true,
          reviews: true,
        },
      },
    },
  });

  // If no profile yet, redirect to create profile
  if (!guideProfile) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-20 h-20 bg-btg-sand rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-btg-terracotta" />
        </div>
        <h1 className="text-2xl font-bold font-heading text-btg-dark mb-3">
          Complete Your Guide Profile
        </h1>
        <p className="text-gray-600 mb-6">
          You need to set up your guide profile before you can start receiving bookings.
          Add your details, experience, pricing, and more.
        </p>
        <Link
          href="/dashboard/guide/profile"
          className="inline-flex items-center gap-2 bg-btg-terracotta text-white font-semibold px-8 py-3 rounded-xl hover:bg-btg-dark transition-colors shadow-lg"
        >
          Set Up Profile
        </Link>
      </div>
    );
  }

  // Fetch recent bookings
  const recentBookings = await prisma.booking.findMany({
    where: { guideId: guideProfile.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      customer: { select: { name: true } },
      fixedDeparture: {
        include: {
          product: { select: { title: true } },
        },
      },
    },
  });

  const totalEarnings = await prisma.booking.aggregate({
    where: {
      guideId: guideProfile.id,
      status: { in: ['CONFIRMED', 'COMPLETED'] },
    },
    _sum: { baseAmount: true },
  });

  // Fetch pending items for alerts
  const pendingProducts = await prisma.product.count({
    where: { guideId: guideProfile.id, status: 'PENDING_REVIEW' },
  });

  const pendingDepartures = await prisma.fixedDeparture.count({
    where: {
      product: { guideId: guideProfile.id },
      approvalStatus: 'PENDING_APPROVAL',
    },
  });

  const awaitingQuoteBookings = await prisma.booking.count({
    where: { guideId: guideProfile.id, status: 'AWAITING_QUOTE' },
  });

  return (
    <div>
      {/* Welcome Banner */}
      <div className="mb-8 bg-gradient-to-r from-btg-terracotta/10 to-btg-sage/10 rounded-2xl p-6 border border-btg-sand">
        <h1 className="text-2xl font-bold font-heading text-btg-dark">
          Welcome back, {session.user.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-600 mt-1">Here&apos;s an overview of your guide activity. Keep creating amazing experiences!</p>
      </div>

      {/* Pending Tasks Alert */}
      {(pendingProducts > 0 || pendingDepartures > 0 || awaitingQuoteBookings > 0) && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-amber-800">Pending Tasks</p>
              <div className="mt-2 space-y-1 text-sm text-amber-700">
                {pendingProducts > 0 && (
                  <Link href="/dashboard/guide/products" className="flex items-center gap-1 hover:text-amber-900">
                    <span>• {pendingProducts} package{pendingProducts > 1 ? 's' : ''} pending review</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
                {pendingDepartures > 0 && (
                  <Link href="/dashboard/guide/departures" className="flex items-center gap-1 hover:text-amber-900">
                    <span>• {pendingDepartures} departure{pendingDepartures > 1 ? 's' : ''} awaiting approval</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
                {awaitingQuoteBookings > 0 && (
                  <Link href="/dashboard/guide/bookings?filter=AWAITING_QUOTE" className="flex items-center gap-1 hover:text-amber-900">
                    <span>• {awaitingQuoteBookings} booking{awaitingQuoteBookings > 1 ? 's' : ''} awaiting your quote</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-btg-sand rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-btg-terracotta" />
            </div>
            <div>
              <p className="text-2xl font-bold text-btg-dark">{guideProfile.averageRating.toFixed(1)}</p>
              <p className="text-xs text-gray-500">Avg Rating ({guideProfile.totalReviews} reviews)</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-btg-sand rounded-xl flex items-center justify-center">
              <Mountain className="w-6 h-6 text-btg-sage" />
            </div>
            <div>
              <p className="text-2xl font-bold text-btg-dark">{guideProfile.totalTrips}</p>
              <p className="text-xs text-gray-500">Trips Completed</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-sky-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-btg-dark">{guideProfile._count.bookings}</p>
              <p className="text-xs text-gray-500">Total Bookings</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-btg-dark">
                {formatCurrency(totalEarnings._sum.baseAmount || 0)}
              </p>
              <p className="text-xs text-gray-500">Total Earnings</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Verification Status & Profile Completeness */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <VerificationStatusBadge status={guideProfile.verificationStatus || 'UNVERIFIED'} />
        <ProfileCompletenessWidget />
      </div>

      {/* Guide Health Score */}
      <div className="mb-8">
        <GuideHealthDashboard />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Link href="/dashboard/guide/products/new">
          <Card hover>
            <CardContent className="p-5 text-center">
              <div className="w-10 h-10 bg-btg-sand rounded-xl flex items-center justify-center mx-auto mb-2">
                <Package className="w-5 h-5 text-btg-terracotta" />
              </div>
              <p className="font-semibold text-btg-dark text-sm">Add New Product</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/guide/certifications">
          <Card hover>
            <CardContent className="p-5 text-center">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Award className="w-5 h-5 text-green-600" />
              </div>
              <p className="font-semibold text-btg-dark text-sm">Certifications</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/guide/kyc">
          <Card hover>
            <CardContent className="p-5 text-center">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Wallet className="w-5 h-5 text-purple-600" />
              </div>
              <p className="font-semibold text-btg-dark text-sm">KYC & Payouts</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/guide/availability">
          <Card hover>
            <CardContent className="p-5 text-center">
              <div className="w-10 h-10 bg-btg-sand rounded-xl flex items-center justify-center mx-auto mb-2">
                <Calendar className="w-5 h-5 text-btg-sage" />
              </div>
              <p className="font-semibold text-btg-dark text-sm">Manage Availability</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/guide/departures">
          <Card hover>
            <CardContent className="p-5 text-center">
              <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-5 h-5 text-sky-600" />
              </div>
              <p className="font-semibold text-btg-dark text-sm">Create Fixed Departure</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-btg-dark">Recent Bookings</h2>
            <Link href="/dashboard/guide/bookings" className="text-sm text-btg-terracotta hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 font-medium text-gray-500">Customer</th>
                    <th className="text-left py-2 font-medium text-gray-500">Package / Trip</th>
                    <th className="text-left py-2 font-medium text-gray-500">Start Date</th>
                    <th className="text-left py-2 font-medium text-gray-500">Status</th>
                    <th className="text-right py-2 font-medium text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50/50">
                      <td className="py-3">
                        <p className="font-medium text-gray-900">{booking.customer.name}</p>
                        <p className="text-xs text-gray-500">{booking.bookingNumber}</p>
                      </td>
                      <td className="py-3">
                        <p className="text-gray-700">
                          {booking.fixedDeparture?.product?.title || booking.destinationName || 'Personal Trip'}
                        </p>
                      </td>
                      <td className="py-3 text-gray-600">
                        {booking.fixedDeparture?.startDate 
                          ? formatDate(booking.fixedDeparture.startDate)
                          : booking.startDate 
                            ? formatDate(booking.startDate)
                            : '-'}
                      </td>
                      <td className="py-3">
                        <Badge
                          variant={
                            booking.status === 'CONFIRMED' ? 'success' :
                            booking.status === 'COMPLETED' ? 'info' :
                            booking.status === 'CANCELLED' ? 'danger' : 'warning'
                          }
                          size="sm"
                        >
                          {booking.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <Link 
                          href={`/dashboard/guide/bookings`}
                          className="text-btg-terracotta hover:text-btg-dark text-xs font-medium inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-3">No bookings yet</p>
              <Link 
                href="/dashboard/guide/products" 
                className="text-sm text-btg-terracotta hover:underline"
              >
                Create your first package →
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
