import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/super-admin/best-sellers - Get best sellers with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const filterStateId = searchParams.get('stateId');
    const filterActivityType = searchParams.get('category');
    const filterGuideId = searchParams.get('guideId');

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    // Build booking where clause
    const bookingWhere: any = {
      status: { in: ['CONFIRMED', 'COMPLETED'] },
    };
    if (Object.keys(dateFilter).length > 0) {
      bookingWhere.createdAt = dateFilter;
    }
    if (filterGuideId) {
      bookingWhere.guideId = filterGuideId;
    }

    // Get all bookings for analysis
    const bookings = await prisma.booking.findMany({
      where: bookingWhere,
      include: {
        product: {
          include: {
            destination: {
              include: {
                city: {
                  include: {
                    state: { select: { id: true, name: true } },
                  },
                },
              },
            },
          },
        },
        guide: {
          select: {
            id: true,
            slug: true,
            user: { select: { name: true } },
          },
        },
      },
    });

    // Inline filter function
    const matchesFilters = (b: typeof bookings[0]) => {
      if (filterStateId && b.product?.destination?.city?.state?.id !== filterStateId) return false;
      if (filterActivityType && b.product?.activityType !== filterActivityType) return false;
      return true;
    };

    // Best Selling States
    const stateStats: Record<string, { name: string; bookings: number; revenue: number }> = {};
    bookings.filter(matchesFilters).forEach((b) => {
      const state = b.product?.destination?.city?.state;
      if (state) {
        if (!stateStats[state.id]) {
          stateStats[state.id] = {
            name: state.name,
            bookings: 0,
            revenue: 0,
          };
        }
        stateStats[state.id].bookings++;
        stateStats[state.id].revenue += b.totalAmount;
      }
    });
    const bestStates = Object.entries(stateStats)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Best Selling Experiences (Activity Types)
    const categoryStats: Record<string, { bookings: number; revenue: number }> = {};
    bookings.filter(matchesFilters).forEach((b) => {
      if (b.product?.activityType) {
        const cat = b.product.activityType;
        if (!categoryStats[cat]) {
          categoryStats[cat] = { bookings: 0, revenue: 0 };
        }
        categoryStats[cat].bookings++;
        categoryStats[cat].revenue += b.totalAmount;
      }
    });
    const bestExperiences = Object.entries(categoryStats)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Best Selling Packages
    const packageStats: Record<string, { title: string; category: string; bookings: number; revenue: number }> = {};
    bookings.filter(matchesFilters).forEach((b) => {
      if (b.product) {
        const prodId = b.product.id;
        if (!packageStats[prodId]) {
          packageStats[prodId] = {
            title: b.product.title,
            category: b.product.activityType,
            bookings: 0,
            revenue: 0,
          };
        }
        packageStats[prodId].bookings++;
        packageStats[prodId].revenue += b.totalAmount;
      }
    });
    const bestPackages = Object.entries(packageStats)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Best Selling Guides
    const guideStats: Record<string, { name: string; slug: string; bookings: number; revenue: number }> = {};
    bookings.filter(matchesFilters).forEach((b) => {
      if (b.guide) {
        const gId = b.guide.id;
        if (!guideStats[gId]) {
          guideStats[gId] = {
            name: b.guide.user.name || 'Unknown',
            slug: b.guide.slug,
            bookings: 0,
            revenue: 0,
          };
        }
        guideStats[gId].bookings++;
        guideStats[gId].revenue += b.totalAmount;
      }
    });
    const bestGuides = Object.entries(guideStats)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Get filter options
    const states = await prisma.indianState.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    const activityTypes = await prisma.product.findMany({
      select: { activityType: true },
      distinct: ['activityType'],
    });

    const guides = await prisma.guideProfile.findMany({
      where: { isVerified: true },
      select: {
        id: true,
        user: { select: { name: true } },
      },
      orderBy: { user: { name: 'asc' } },
    });

    // Summary stats
    const filteredBookings = bookings.filter(matchesFilters);
    const totalRevenue = filteredBookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalBookingsCount = filteredBookings.length;
    const avgOrderValue = totalBookingsCount > 0 ? totalRevenue / totalBookingsCount : 0;

    return NextResponse.json({
      bestStates,
      bestExperiences,
      bestPackages,
      bestGuides,
      summary: {
        totalRevenue,
        totalBookings: totalBookingsCount,
        avgOrderValue,
      },
      filters: {
        states: states.map((s) => ({ value: s.id, label: s.name })),
        categories: activityTypes.map((c) => ({ value: c.activityType, label: c.activityType })),
        guides: guides.map((g) => ({ value: g.id, label: g.user.name || 'Unknown' })),
      },
    });
  } catch (error) {
    console.error('Error fetching best sellers:', error);
    return NextResponse.json({ error: 'Failed to fetch best sellers' }, { status: 500 });
  }
}
