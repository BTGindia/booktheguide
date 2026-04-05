import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import {
  User, Star, MapPin, Phone, Mail, Shield, CheckCircle,
  XCircle, Package, CalendarDays, Mountain, Languages,
  Award, BookOpen, Camera, ArrowLeft, ClipboardList,
} from 'lucide-react';

export default async function SuperAdminGuideDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'SUPER_ADMIN') redirect('/login');

  const guide = await prisma.user.findUnique({
    where: { id: params.id, role: 'GUIDE' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      isActive: true,
      createdAt: true,
      guideProfile: {
        include: {
          serviceAreas: {
            include: {
              state: { select: { name: true } },

            },
          },
          products: {
            select: { id: true, title: true, status: true, activityType: true, isTrending: true },
            orderBy: { createdAt: 'desc' },
          },
          reviews: {
            select: { id: true, overallRating: true, comment: true, createdAt: true, customer: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          _count: {
            select: { products: true, bookings: true, reviews: true },
          },
        },
      },
    },
  });

  if (!guide || !guide.guideProfile) notFound();
  const profile = guide.guideProfile;

  const totalEarnings = await prisma.booking.aggregate({
    where: { guideId: profile.id, status: { in: ['CONFIRMED', 'COMPLETED'] } },
    _sum: { baseAmount: true },
  });

  const recentBookings = await prisma.booking.findMany({
    where: { guideId: profile.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      customer: { select: { name: true } },
    },
  });

  return (
    <div className="max-w-5xl">
      <Link href="/dashboard/super-admin/guides" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-btg-terracotta mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Guides
      </Link>

      {/* Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-btg-sand flex items-center justify-center flex-shrink-0 overflow-hidden">
              {guide.image ? (
                <img src={guide.image} alt={guide.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-btg-terracotta" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-btg-dark">{guide.name}</h1>
                {profile.isVerified ? (
                  <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" /> Verified</Badge>
                ) : (
                  <Badge variant="warning"><XCircle className="w-3 h-3 mr-1" /> Unverified</Badge>
                )}
                <Badge variant={guide.isActive ? 'info' : 'danger'}>{guide.isActive ? 'Active' : 'Inactive'}</Badge>
              </div>
              {profile.tagline && <p className="text-gray-600 italic mb-2">{profile.tagline}</p>}
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {guide.email}</span>
                {guide.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {guide.phone}</span>}
                <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> Joined {formatDate(guide.createdAt)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        <Card><CardContent className="p-4 text-center">
          <Star className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className="text-xl font-bold">{profile.averageRating.toFixed(1)}</p>
          <p className="text-xs text-gray-500">Rating ({profile.totalReviews})</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Mountain className="w-5 h-5 text-green-600 mx-auto mb-1" />
          <p className="text-xl font-bold">{profile.totalTrips}</p>
          <p className="text-xs text-gray-500">Trips</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Package className="w-5 h-5 text-blue-600 mx-auto mb-1" />
          <p className="text-xl font-bold">{profile._count.products}</p>
          <p className="text-xs text-gray-500">Products</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <ClipboardList className="w-5 h-5 text-sky-600 mx-auto mb-1" />
          <p className="text-xl font-bold">{profile._count.bookings}</p>
          <p className="text-xs text-gray-500">Bookings</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <span className="text-green-600 text-lg">₹</span>
          <p className="text-xl font-bold">{formatCurrency(totalEarnings._sum.baseAmount || 0)}</p>
          <p className="text-xs text-gray-500">Earnings</p>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Profile Details */}
        <Card>
          <CardContent className="p-6">
            <h2 className="font-bold text-btg-dark mb-4">Profile Details</h2>
            <div className="space-y-3 text-sm">
              {profile.bio && <div><p className="text-gray-500 font-medium">Bio</p><p className="text-gray-700 mt-0.5">{profile.bio}</p></div>}
              {profile.experienceYears && <div className="flex justify-between"><span className="text-gray-500">Experience</span><span className="font-medium">{profile.experienceYears} years</span></div>}
              {profile.gender && <div className="flex justify-between"><span className="text-gray-500">Gender</span><span className="font-medium">{profile.gender}</span></div>}
              {profile.education && <div className="flex justify-between"><span className="text-gray-500">Education</span><span className="font-medium">{profile.education}</span></div>}
              {profile.idType && <div className="flex justify-between"><span className="text-gray-500">ID Type</span><span className="font-medium">{profile.idType}</span></div>}
              {profile.idNumber && <div className="flex justify-between"><span className="text-gray-500">ID Number</span><span className="font-medium">{profile.idNumber}</span></div>}
              {profile.languages.length > 0 && (
                <div>
                  <p className="text-gray-500 font-medium mb-1">Languages</p>
                  <div className="flex flex-wrap gap-1">{profile.languages.map(l => <Badge key={l} size="sm" variant="outline">{l}</Badge>)}</div>
                </div>
              )}
              {profile.specializations.length > 0 && (
                <div>
                  <p className="text-gray-500 font-medium mb-1">Specializations</p>
                  <div className="flex flex-wrap gap-1">{profile.specializations.map(s => <Badge key={s} size="sm" variant="info">{s}</Badge>)}</div>
                </div>
              )}
              {profile.certifications.length > 0 && (
                <div>
                  <p className="text-gray-500 font-medium mb-1">Certifications</p>
                  <div className="flex flex-wrap gap-1">{profile.certifications.map(c => <Badge key={c} size="sm" variant="success">{c}</Badge>)}</div>
                </div>
              )}
              {profile.guideTypes.length > 0 && (
                <div>
                  <p className="text-gray-500 font-medium mb-1">Guide Types</p>
                  <div className="flex flex-wrap gap-1">{profile.guideTypes.map(t => <Badge key={t} size="sm" variant="outline">{t.replace(/_/g, ' ')}</Badge>)}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Service Areas */}
        <Card>
          <CardContent className="p-6">
            <h2 className="font-bold text-btg-dark mb-4">Service Areas</h2>
            {profile.serviceAreas.length > 0 ? (
              <div className="space-y-3">
                {profile.serviceAreas.map((area) => (
                  <div key={area.id} className="p-3 bg-gray-50 rounded-xl">
                    <p className="font-semibold text-sm text-gray-900 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-btg-terracotta" />
                      {area.state.name}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No service areas defined</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Products */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="font-bold text-btg-dark mb-4">Products ({profile.products.length})</h2>
          {profile.products.length > 0 ? (
            <div className="space-y-2">
              {profile.products.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{product.title}</p>
                    <div className="flex gap-1.5 mt-1">
                      <Badge size="sm" variant={
                        product.status === 'APPROVED' ? 'success' :
                        product.status === 'PENDING_REVIEW' ? 'warning' :
                        product.status === 'REJECTED' ? 'danger' : 'outline'
                      }>{product.status.replace(/_/g, ' ')}</Badge>
                      <Badge size="sm" variant="info">{product.activityType.replace(/_/g, ' ')}</Badge>
                      {product.isTrending && <Badge size="sm" variant="warning">Trending</Badge>}
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/super-admin/products`}
                    className="text-xs text-btg-terracotta hover:underline"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">No products yet</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <Card>
          <CardContent className="p-6">
            <h2 className="font-bold text-btg-dark mb-4">Recent Bookings</h2>
            {recentBookings.length > 0 ? (
              <div className="space-y-2">
                {recentBookings.map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{b.customer.name}</p>
                      <p className="text-xs text-gray-500">{b.bookingNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-btg-terracotta">{formatCurrency(b.totalAmount)}</p>
                      <Badge size="sm" variant={
                        b.status === 'CONFIRMED' ? 'success' :
                        b.status === 'COMPLETED' ? 'info' :
                        b.status === 'CANCELLED' ? 'danger' : 'warning'
                      }>{b.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">No bookings</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Reviews */}
        <Card>
          <CardContent className="p-6">
            <h2 className="font-bold text-btg-dark mb-4">Recent Reviews</h2>
            {profile.reviews.length > 0 ? (
              <div className="space-y-2">
                {profile.reviews.map((r) => (
                  <div key={r.id} className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-sm text-gray-900">{r.customer.name}</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-bold">{r.overallRating}</span>
                      </div>
                    </div>
                    {r.comment && <p className="text-xs text-gray-600 line-clamp-2">{r.comment}</p>}
                    <p className="text-xs text-gray-400 mt-1">{formatDate(r.createdAt)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">No reviews</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
