import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import {
  Users, Package, ClipboardList, IndianRupee, AlertCircle,
  CheckCircle, Clock, TrendingUp,
} from 'lucide-react';

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || (role !== 'ADMIN' && role !== 'SUPER_ADMIN')) redirect('/login');

  // Get admin's managed states
  const adminProfile = await prisma.adminProfile.findUnique({
    where: { userId: (session.user as any).id },
    include: { managedStates: true },
  });

  // For super admin, show all. For admin, filter by their managed states via serviceAreas
  const managedStateIds = adminProfile?.managedStates?.map((s) => s.id) || [];
  const guideFilter = role === 'SUPER_ADMIN'
    ? {}
    : managedStateIds.length > 0
    ? { serviceAreas: { some: { stateId: { in: managedStateIds } } } }
    : { id: 'none' };

  // Stats
  const [guidesCount, productsCount, pendingProducts, bookingsCount, totalRevenue] = await Promise.all([
    prisma.guideProfile.count({ where: guideFilter }),
    prisma.product.count({
      where: {
        guide: guideFilter,
      },
    }),
    prisma.product.count({
      where: {
        guide: guideFilter,
        status: 'PENDING_REVIEW',
      },
    }),
    prisma.booking.count({
      where: {
        guide: guideFilter,
      },
    }),
    prisma.booking.aggregate({
      where: {
        guide: guideFilter,
        status: { in: ['CONFIRMED', 'COMPLETED'] },
      },
      _sum: { commissionAmount: true },
    }),
  ]);

  // Recent pending products
  const pendingProductsList = await prisma.product.findMany({
    where: {
      guide: guideFilter,
      status: 'PENDING_REVIEW',
    },
    include: {
      guide: {
        include: {
          user: { select: { name: true } },
          serviceAreas: { include: { state: { select: { name: true } } } },
        },
      },
      destination: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-heading text-btg-dark">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 mt-1">
          {adminProfile && adminProfile.managedStates.length > 0
            ? `Managing ${adminProfile.managedStates.map((s) => s.name).join(', ')}`
            : role === 'SUPER_ADMIN'
            ? 'Super Admin - All India'
            : 'Admin Panel'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="p-5 text-center">
            <Users className="w-6 h-6 text-btg-terracotta mx-auto mb-2" />
            <p className="text-2xl font-bold text-btg-dark">{guidesCount}</p>
            <p className="text-xs text-gray-500">Guides</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <Package className="w-6 h-6 text-btg-sage mx-auto mb-2" />
            <p className="text-2xl font-bold text-btg-dark">{productsCount}</p>
            <p className="text-xs text-gray-500">Products</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <AlertCircle className="w-6 h-6 text-amber-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-amber-600">{pendingProducts}</p>
            <p className="text-xs text-gray-500">Pending Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <ClipboardList className="w-6 h-6 text-sky-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-btg-dark">{bookingsCount}</p>
            <p className="text-xs text-gray-500">Bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <IndianRupee className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-700">
              {formatCurrency(totalRevenue._sum.commissionAmount || 0)}
            </p>
            <p className="text-xs text-gray-500">Commission Earned</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Products */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <h2 className="font-bold text-btg-dark">Products Pending Review</h2>
            </div>
            <Link
              href="/dashboard/admin/products"
              className="text-sm text-btg-terracotta hover:underline"
            >
              View All
            </Link>
          </div>

          {pendingProductsList.length > 0 ? (
            <div className="space-y-3">
              {pendingProductsList.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                >
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{product.title}</p>
                    <p className="text-xs text-gray-500">
                      by {product.guide.user.name} &bull;{' '}
                      {product.guide.serviceAreas?.[0]?.state?.name || 'India'} &bull;{' '}
                      {product.destination.name}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <Badge size="sm" variant="info">{product.activityType.replace('_', ' ')}</Badge>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/admin/products/${product.id}`}
                    className="text-sm font-semibold text-btg-terracotta bg-btg-cream px-4 py-2 rounded-lg hover:bg-btg-sand transition-colors"
                  >
                    Review
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
              <p className="text-gray-500">All caught up! No pending reviews.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
