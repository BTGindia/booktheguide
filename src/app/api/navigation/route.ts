import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAllStates } from '@/lib/states';
import { getNavCategories, getDisabledCategorySlugs } from '@/lib/active-packages';

// Cache navigation for 5 minutes — nav data rarely changes
export const revalidate = 300;

// GET /api/navigation - Get navigation menu data with dynamic subcategories
// Only returns states/categories that have at least one approved, active package
export async function GET() {
  try {
    // States with active packages (destinations dropdown)
    // Only show states that are enabled AND have at least one approved package
    const statesWithPackages = await prisma.indianState.findMany({
      where: {
        isActive: true,
        cities: {
          some: {
            destinations: {
              some: {
                products: {
                  some: {
                    status: 'APPROVED',
                    isActive: true,
                  },
                },
              },
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        code: true,
        cities: {
          where: {
            destinations: {
              some: {
                products: {
                  some: {
                    status: 'APPROVED',
                    isActive: true,
                  },
                },
              },
            },
          },
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                destinations: {
                  where: {
                    products: {
                      some: {
                        status: 'APPROVED',
                        isActive: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Build a name-to-slug lookup from states.ts
    const stateSlugMap = new Map(getAllStates().map(s => [s.name.toLowerCase(), s.slug]));

    // Format destinations data
    const destinations = statesWithPackages.map((state) => ({
      name: state.name,
      code: state.code,
      slug: stateSlugMap.get(state.name.toLowerCase()) || state.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      cities: state.cities
        .filter((c) => c._count.destinations > 0)
        .map((c) => ({
          name: c.name,
          slug: c.name.toLowerCase().replace(/\s+/g, '-'),
          packageCount: c._count.destinations,
        }))
        .sort((a, b) => b.packageCount - a.packageCount)
        .slice(0, 6), // Top 6 cities per state
    })).filter((s) => s.cities.length > 0);

    // Get activity types with package counts (for experiences)
    const products = await prisma.product.findMany({
      where: {
        status: 'APPROVED',
        isActive: true,
      },
      select: {
        packageCategory: true,
        activityType: true,
      },
    });

    // Get disabled categories from DB
    const disabledSlugs = await getDisabledCategorySlugs();

    // Group by packageCategory and activityType (skip disabled categories)
    const experienceMap: Record<string, Record<string, number>> = {};
    products.forEach((p) => {
      if (disabledSlugs.has(p.packageCategory)) return;
      if (!experienceMap[p.packageCategory]) {
        experienceMap[p.packageCategory] = {};
      }
      experienceMap[p.packageCategory][p.activityType] = 
        (experienceMap[p.packageCategory][p.activityType] || 0) + 1;
    });

    // Category labels and slugs
    const categoryInfo: Record<string, { label: string; slug: string }> = {
      TOURIST_GUIDES: { label: 'Tourist Guides', slug: 'tourist-guides' },
      GROUP_TRIPS: { label: 'Group Trips', slug: 'group-trips' },
      ADVENTURE_GUIDES: { label: 'Adventure Sports', slug: 'adventure-guides' },
      HERITAGE_WALKS: { label: 'Heritage Walks', slug: 'heritage-walks' },
      TRAVEL_WITH_INFLUENCERS: { label: 'Travel with Influencers', slug: 'travel-with-influencers' },
      OFFBEAT_TRAVEL: { label: 'Offbeat Travel', slug: 'offbeat-travel' },
      TREKKING: { label: 'Trekking', slug: 'trekking' },
    };

    const experiences = Object.entries(experienceMap)
      .filter(([cat]) => categoryInfo[cat])
      .map(([category, activities]) => ({
        name: categoryInfo[category].label,
        slug: categoryInfo[category].slug,
        key: category,
        activities: Object.entries(activities)
          .map(([activity, count]) => ({
            name: activity.replace(/_/g, ' '),
            slug: activity.toLowerCase().replace(/[\s\/]+/g, '-'),
            packageCount: count,
          }))
          .sort((a, b) => b.packageCount - a.packageCount)
          .slice(0, 8), // Top 8 activities per category
      }))
      .sort((a, b) => {
        const order = ['TOURIST_GUIDES', 'GROUP_TRIPS', 'ADVENTURE_GUIDES', 'HERITAGE_WALKS', 'TRAVEL_WITH_INFLUENCERS', 'OFFBEAT_TRAVEL', 'TREKKING'];
        return order.indexOf(a.key) - order.indexOf(b.key);
      });

    // Fetch nav categories and logo from DB (graceful fallback)
    let navCategories: any[] = [];
    let logoUrl: string | undefined;
    try {
      navCategories = await getNavCategories();
    } catch {}
    try {
      const setting = await prisma.platformSettings.findUnique({ where: { key: 'logo_url' } });
      if (setting) logoUrl = setting.value;
    } catch {}

    const response = NextResponse.json({
      destinations,
      experiences,
      navCategories,
      logoUrl,
    });
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return response;
  } catch (error) {
    console.error('Navigation API error:', error);
    return NextResponse.json({ error: 'Failed to fetch navigation data' }, { status: 500 });
  }
}
