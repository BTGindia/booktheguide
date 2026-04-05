import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = (session.user as any).id;
    let stateIds: string[] = [];

    if (role === 'ADMIN') {
      const adminProfile = await prisma.adminProfile.findUnique({
        where: { userId },
        include: { managedStates: true },
      });
      if (adminProfile) {
        stateIds = adminProfile.managedStates.map((s) => s.id);
      }
    }

    // Build guide filter based on state
    const guideWhere = stateIds.length > 0
      ? { serviceAreas: { some: { stateId: { in: stateIds } } } }
      : {};

    const [guides, products, bookings] = await Promise.all([
      prisma.guideProfile.findMany({
        where: guideWhere,
        include: { user: { select: { name: true } } },
      }),
      prisma.product.findMany({
        where: stateIds.length > 0
          ? { guide: { serviceAreas: { some: { stateId: { in: stateIds } } } } }
          : {},
      }),
      prisma.booking.findMany({
        where: stateIds.length > 0
          ? { guide: { serviceAreas: { some: { stateId: { in: stateIds } } } } }
          : {},
        include: { customer: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalGuides = guides.length;
    const verifiedGuides = guides.filter((g) => g.isVerified).length;
    const totalProducts = products.length;
    const approvedProducts = products.filter((p) => p.status === 'APPROVED').length;
    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalCommission = bookings.reduce((sum, b) => sum + b.commissionAmount, 0);
    const avgRating = guides.length > 0
      ? guides.reduce((sum, g) => sum + g.averageRating, 0) / guides.length
      : 0;

    // Top guides by rating
    const topGuides = [...guides]
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 5)
      .map((g) => ({
        id: g.id,
        name: g.user.name || 'Unknown',
        rating: g.averageRating,
        trips: g.totalTrips,
      }));

    // Recent bookings
    const recentBookings = bookings.slice(0, 10).map((b) => ({
      id: b.id,
      bookingNumber: b.bookingNumber,
      amount: b.totalAmount,
      date: b.createdAt.toISOString().split('T')[0],
      customerName: b.customer.name || 'Guest',
    }));

    // Monthly bookings (last 6 months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const monthlyBookings = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const monthBookings = bookings.filter(
        (b) => b.createdAt >= monthStart && b.createdAt <= monthEnd
      );
      monthlyBookings.push({
        month: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
        count: monthBookings.length,
        revenue: monthBookings.reduce((sum, b) => sum + b.totalAmount, 0),
      });
    }

    return NextResponse.json({
      totalGuides,
      verifiedGuides,
      totalProducts,
      approvedProducts,
      totalBookings,
      totalRevenue,
      totalCommission,
      avgRating,
      topGuides,
      recentBookings,
      monthlyBookings,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
