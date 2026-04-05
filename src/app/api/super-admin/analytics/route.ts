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
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [states, guides, products, bookings, customers] = await Promise.all([
      prisma.indianState.findMany({
        where: { isActive: true },
        include: {
          _count: { select: { cities: true, serviceAreas: true } },
          cities: {
            include: { _count: { select: { destinations: true } } },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.guideProfile.findMany({
        include: {
          user: { select: { name: true, email: true } },
          serviceAreas: { include: { state: true } },
        },
      }),
      prisma.product.findMany({
        include: {
          guide: { include: { serviceAreas: { include: { state: true } } } },
        },
      }),
      prisma.booking.findMany({
        include: {
          customer: { select: { name: true } },
          guide: {
            include: {
              user: { select: { name: true } },
              serviceAreas: { include: { state: true } },
            },
          },
          fixedDeparture: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
    ]);

    // --- Overall KPIs ---
    const totalGuides = guides.length;
    const verifiedGuides = guides.filter((g) => g.isVerified).length;
    const totalProducts = products.length;
    const approvedProducts = products.filter((p) => p.status === 'APPROVED').length;
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter((b) => b.status === 'CONFIRMED').length;
    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalCommission = bookings.reduce((sum, b) => sum + b.commissionAmount, 0);
    const totalCGST = bookings.reduce((sum, b) => sum + (b.cgstAmount || 0), 0);
    const totalSGST = bookings.reduce((sum, b) => sum + (b.sgstAmount || 0), 0);
    const totalGST = totalCGST + totalSGST;

    // --- State-wise breakdown ---
    const stateAnalytics = states.map((state) => {
      const stateGuides = guides.filter((g) =>
        g.serviceAreas.some((sa) => sa.stateId === state.id)
      );
      const stateProducts = products.filter((p) =>
        p.guide?.serviceAreas.some((sa) => sa.stateId === state.id)
      );
      const stateBookings = bookings.filter((b) =>
        b.guide?.serviceAreas.some((sa) => sa.stateId === state.id)
      );
      const stateRevenue = stateBookings.reduce((sum, b) => sum + b.totalAmount, 0);
      const stateCommission = stateBookings.reduce((sum, b) => sum + b.commissionAmount, 0);

      return {
        id: state.id,
        name: state.name,
        code: state.code,
        commissionPercent: state.commissionPercent,
        guides: stateGuides.length,
        products: stateProducts.length,
        bookings: stateBookings.length,
        destinations: state.cities.reduce((sum, c) => sum + c._count.destinations, 0),
        revenue: stateRevenue,
        commission: stateCommission,
      };
    }).filter((s) => s.guides > 0 || s.bookings > 0 || s.destinations > 0);

    // --- Monthly bookings (last 12 months) ---
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const monthBookings = bookings.filter(
        (b) => b.createdAt >= monthStart && b.createdAt <= monthEnd
      );
      monthlyData.push({
        month: `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`,
        bookings: monthBookings.length,
        revenue: monthBookings.reduce((sum, b) => sum + b.totalAmount, 0),
        commission: monthBookings.reduce((sum, b) => sum + b.commissionAmount, 0),
      });
    }

    // --- Top Guides (by total revenue) ---
    const guideRevenueMap = new Map<string, { name: string; rating: number; trips: number; revenue: number; bookings: number }>();
    bookings.forEach((b) => {
      if (!b.guide) return;
      const existing = guideRevenueMap.get(b.guideId);
      if (existing) {
        existing.revenue += b.totalAmount;
        existing.bookings += 1;
      } else {
        guideRevenueMap.set(b.guideId, {
          name: b.guide.user?.name || 'Unknown',
          rating: b.guide.averageRating,
          trips: b.guide.totalTrips,
          revenue: b.totalAmount,
          bookings: 1,
        });
      }
    });
    const topGuides = Array.from(guideRevenueMap.entries())
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 10)
      .map(([id, data]) => ({ id, ...data }));

    // --- Recent Bookings ---
    const recentBookings = bookings.slice(0, 15).map((b) => ({
      id: b.id,
      bookingNumber: b.bookingNumber,
      amount: b.totalAmount,
      commission: b.commissionAmount,
      date: b.createdAt.toISOString().split('T')[0],
      customerName: b.customer?.name || 'Guest',
      status: b.status,
    }));

    // --- Trip type breakdown ---
    const fixedBookings = bookings.filter((b) => b.tripType === 'FIXED_DEPARTURE').length;
    const personalBookings = bookings.filter((b) => b.tripType === 'PERSONAL_BOOKING').length;

    // --- User Engagement Metrics ---
    const activeCustomers = new Set(bookings.map(b => b.customerId)).size;
    const repeatCustomers = new Set(
      bookings
        .filter(b => bookings.filter(b2 => b2.customerId === b.customerId).length > 1)
        .map(b => b.customerId)
    ).size;
    const avgBookingsPerCustomer = activeCustomers > 0 ? totalBookings / activeCustomers : 0;
    const userEngagement = {
      totalUsers: customers,
      activeUsers: activeCustomers,
      repeatCustomers,
      avgBookingsPerCustomer: avgBookingsPerCustomer.toFixed(1),
      engagementRate: customers > 0 ? ((activeCustomers / customers) * 100).toFixed(1) : '0',
    };

    // --- Conversion Funnel (simplified) ---
    const pendingBookings = bookings.filter(b => b.status === 'PENDING' || b.status === 'AWAITING_QUOTE').length;
    const quoteSent = bookings.filter(b => b.status === 'QUOTE_SENT').length;
    const completedBookings = bookings.filter(b => b.status === 'COMPLETED').length;
    const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED').length;
    const conversionFunnel = {
      pending: pendingBookings,
      quoteSent,
      confirmed: confirmedBookings,
      completed: completedBookings,
      cancelled: cancelledBookings,
      conversionRate: totalBookings > 0 
        ? (((confirmedBookings + completedBookings) / totalBookings) * 100).toFixed(1) 
        : '0',
    };

    // --- Activity Type Performance ---
    const activityStats: Record<string, { bookings: number; revenue: number; products: number }> = {};
    products.forEach(p => {
      if (!activityStats[p.activityType]) {
        activityStats[p.activityType] = { bookings: 0, revenue: 0, products: 0 };
      }
      activityStats[p.activityType].products++;
    });
    bookings.forEach(b => {
      // Find the activityType from the booking
      const product = products.find(p => p.id === b.productId);
      if (product) {
        if (!activityStats[product.activityType]) {
          activityStats[product.activityType] = { bookings: 0, revenue: 0, products: 0 };
        }
        activityStats[product.activityType].bookings++;
        activityStats[product.activityType].revenue += b.totalAmount;
      }
    });
    const categoryPerformance = Object.entries(activityStats)
      .map(([category, stats]) => ({ category, ...stats }))
      .sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json({
      kpis: {
        totalGuides,
        verifiedGuides,
        totalProducts,
        approvedProducts,
        totalBookings,
        confirmedBookings,
        totalRevenue,
        totalCommission,
        totalGST,
        totalCGST,
        totalSGST,
        totalCustomers: customers,
      },
      stateAnalytics,
      monthlyData,
      topGuides,
      recentBookings,
      tripTypeBreakdown: { fixed: fixedBookings, personal: personalBookings },
      userEngagement,
      conversionFunnel,
      categoryPerformance,
    });
  } catch (error) {
    console.error('Error fetching super admin analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
