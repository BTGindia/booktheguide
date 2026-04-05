import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [
      totalGuides,
      totalStates,
      totalProducts,
      pendingProducts,
      pendingDepartures,
      totalBookings,
      totalUsers,
      activeUsers,
      bookings,
      guides,
      products,
      states,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'GUIDE' } }),
      prisma.indianState.count({ where: { isActive: true } }),
      prisma.product.count(),
      prisma.product.count({ where: { status: 'PENDING_REVIEW' } }),
      prisma.fixedDeparture.count({ where: { approvalStatus: 'PENDING_APPROVAL' } }),
      prisma.booking.count(),
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.booking.findMany({
        include: {
          customer: { select: { name: true } },
          guide: {
            include: {
              user: { select: { name: true } },
              serviceAreas: { include: { state: true } },
            },
          },
          product: { select: { title: true, packageCategory: true, activityType: true } },
          fixedDeparture: { include: { product: { select: { title: true, packageCategory: true, activityType: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.guideProfile.findMany({
        include: {
          user: { select: { name: true } },
          serviceAreas: { include: { state: true } },
          products: { where: { status: 'APPROVED' } },
        },
      }),
      prisma.product.findMany({
        where: { status: 'APPROVED' },
        include: {
          guide: { include: { serviceAreas: { include: { state: true } }, user: { select: { name: true } } } },
          destination: { include: { city: { include: { state: true } } } },
          _count: { select: { bookings: true } },
        },
      }),
      prisma.indianState.findMany({
        where: { isActive: true },
        include: {
          cities: {
            include: {
              destinations: {
                include: {
                  _count: { select: { products: true } },
                },
              },
            },
          },
        },
      }),
    ]);

    // Calculate total commission earned
    const totalCommission = bookings.reduce((sum, b) => sum + (b.commissionAmount || 0), 0);

    // Best Sellers - States
    const stateBookings = new Map<string, { name: string; bookings: number; revenue: number }>();
    bookings.forEach((b) => {
      const stateName = b.guide?.serviceAreas?.[0]?.state?.name || 'Unknown';
      const existing = stateBookings.get(stateName) || { name: stateName, bookings: 0, revenue: 0 };
      existing.bookings++;
      existing.revenue += b.totalAmount;
      stateBookings.set(stateName, existing);
    });
    const bestSellerStates = Array.from(stateBookings.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Best Sellers - Experiences (by packageCategory)
    const categoryBookings = new Map<string, { category: string; bookings: number; revenue: number }>();
    bookings.forEach((b) => {
      const category = b.fixedDeparture?.product?.packageCategory || b.product?.packageCategory || 'OTHER';
      const existing = categoryBookings.get(category) || { category, bookings: 0, revenue: 0 };
      existing.bookings++;
      existing.revenue += b.totalAmount;
      categoryBookings.set(category, existing);
    });
    const bestSellerExperiences = Array.from(categoryBookings.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Best Sellers - Packages
    const packageBookings = new Map<string, { id: string; title: string; bookings: number; revenue: number }>();
    bookings.forEach((b) => {
      const productId = b.productId || b.fixedDeparture?.productId;
      const title = b.fixedDeparture?.product?.title || b.product?.title || 'Unknown';
      if (!productId) return;
      const existing = packageBookings.get(productId) || { id: productId, title, bookings: 0, revenue: 0 };
      existing.bookings++;
      existing.revenue += b.totalAmount;
      packageBookings.set(productId, existing);
    });
    const bestSellerPackages = Array.from(packageBookings.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Best Sellers - Guides
    const guideBookings = new Map<string, { id: string; name: string; bookings: number; revenue: number; rating: number }>();
    bookings.forEach((b) => {
      if (!b.guide) return;
      const existing = guideBookings.get(b.guideId) || {
        id: b.guideId,
        name: b.guide.user?.name || 'Unknown',
        bookings: 0,
        revenue: 0,
        rating: b.guide.averageRating,
      };
      existing.bookings++;
      existing.revenue += b.totalAmount;
      guideBookings.set(b.guideId, existing);
    });
    const bestSellerGuides = Array.from(guideBookings.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return NextResponse.json({
      stats: {
        totalGuides,
        totalStates,
        totalProducts,
        pendingProducts,
        pendingDepartures,
        totalBookings,
        totalCommission,
        totalUsers,
        activeUsers,
      },
      bestSellers: {
        states: bestSellerStates,
        experiences: bestSellerExperiences,
        packages: bestSellerPackages,
        guides: bestSellerGuides,
      },
    });
  } catch (error) {
    console.error('Error fetching super admin dashboard:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
