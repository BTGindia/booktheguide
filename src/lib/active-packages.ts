import prisma from '@/lib/prisma';
import { getAllStates, type StateInfo } from '@/lib/states';

/**
 * Auto-detection utility: only return entities that have at least one
 * active, approved package (with a scheduled departure or personal booking option).
 *
 * Used across explore pages, experience pages, navigation, filters, homepage, etc.
 */

const ACTIVE_PRODUCT_FILTER = {
  status: 'APPROVED' as const,
  isActive: true,
};

/**
 * Get states that have at least one active package.
 * Optionally filter by packageCategory or activityType.
 */
export async function getStatesWithPackages(opts?: {
  packageCategory?: string;
  activityType?: string;
}) {
  const productWhere: any = { ...ACTIVE_PRODUCT_FILTER };
  if (opts?.packageCategory) productWhere.packageCategory = opts.packageCategory;
  if (opts?.activityType) productWhere.activityType = opts.activityType;

  return prisma.indianState.findMany({
    where: {
      isActive: true,
      cities: {
        some: {
          destinations: {
            some: {
              products: { some: productWhere },
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });
}

/**
 * Get cities in a state that have at least one active package.
 */
export async function getCitiesWithPackages(stateId: string, opts?: {
  packageCategory?: string;
  activityType?: string;
}) {
  const productWhere: any = { ...ACTIVE_PRODUCT_FILTER };
  if (opts?.packageCategory) productWhere.packageCategory = opts.packageCategory;
  if (opts?.activityType) productWhere.activityType = opts.activityType;

  return prisma.city.findMany({
    where: {
      stateId,
      isActive: true,
      destinations: {
        some: {
          products: { some: productWhere },
        },
      },
    },
    orderBy: { name: 'asc' },
  });
}

/**
 * Get destinations that have at least one active package.
 */
export async function getDestinationsWithPackages(cityId: string, opts?: {
  packageCategory?: string;
}) {
  const productWhere: any = { ...ACTIVE_PRODUCT_FILTER };
  if (opts?.packageCategory) productWhere.packageCategory = opts.packageCategory;

  return prisma.destination.findMany({
    where: {
      cityId,
      isActive: true,
      products: { some: productWhere },
    },
    orderBy: { name: 'asc' },
  });
}

/**
 * Get the set of category slugs that are disabled in the DB.
 * Returns an empty set if the table doesn't exist yet.
 */
export async function getDisabledCategorySlugs(): Promise<Set<string>> {
  try {
    const dbCategories = await prisma.experienceCategory.findMany({
      select: { slug: true, isEnabled: true },
    });
    return new Set(
      dbCategories.filter((c) => !c.isEnabled).map((c) => c.slug)
    );
  } catch {
    return new Set();
  }
}

/**
 * Get package categories that actually have packages (respects DB isEnabled flag).
 * Returns only categories for which at least one approved product exists.
 */
export async function getActiveCategories() {
  // First check which categories have products
  const categoryCounts = await prisma.product.groupBy({
    by: ['packageCategory'],
    where: ACTIVE_PRODUCT_FILTER,
    _count: true,
  });

  const disabledSlugs = await getDisabledCategorySlugs();

  // Return only categories that have packages AND are not disabled
  return categoryCounts
    .filter((c) => !disabledSlugs.has(c.packageCategory))
    .map((c) => ({ slug: c.packageCategory, count: c._count }));
}

/**
 * Get subcategories (activityTypes) that have packages in a given category.
 * Optionally scoped to a state.
 */
export async function getActiveSubCategories(packageCategory: string, stateId?: string) {
  const where: any = {
    ...ACTIVE_PRODUCT_FILTER,
    packageCategory,
  };

  if (stateId) {
    where.destination = {
      city: { stateId },
    };
  }

  const grouped = await prisma.product.groupBy({
    by: ['activityType'],
    where,
    _count: true,
  });

  // Check DB-driven subcategory enable/disable
  let disabledSubs = new Set<string>();
  try {
    const dbCat = await prisma.experienceCategory.findUnique({
      where: { slug: packageCategory },
      include: {
        subCategories: {
          where: { isEnabled: false },
          select: { name: true },
        },
      },
    });
    if (dbCat) {
      disabledSubs = new Set(dbCat.subCategories.map((s: { name: string }) => s.name));
    }
  } catch {
    // Table might not exist yet
  }

  return grouped
    .filter((g) => !disabledSubs.has(g.activityType))
    .map((g) => ({ activityType: g.activityType, count: g._count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Check if a specific category has any packages in a given state.
 */
export async function categoryHasPackagesInState(
  packageCategory: string,
  stateName: string
): Promise<boolean> {
  const count = await prisma.product.count({
    where: {
      ...ACTIVE_PRODUCT_FILTER,
      packageCategory,
      destination: {
        city: {
          state: { name: stateName },
        },
      },
    },
  });
  return count > 0;
}

/**
 * Get all enabled categories from DB with their subcategories.
 * Falls back to hardcoded categories if DB table is empty.
 */
export async function getEnabledCategoriesFromDB() {
  try {
    const cats = await prisma.experienceCategory.findMany({
      where: { isEnabled: true },
      include: {
        subCategories: {
          where: { isEnabled: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
    return cats.length > 0 ? cats : null; // null = use hardcoded fallback
  } catch {
    return null;
  }
}

/**
 * Get nav categories (categories marked showInNav = true, ordered by navOrder).
 */
export async function getNavCategories() {
  try {
    const cats = await prisma.experienceCategory.findMany({
      where: { isEnabled: true, showInNav: true },
      select: {
        slug: true,
        label: true,
        urlSlug: true,
        navLabel: true,
        navOrder: true,
        subCategories: {
          where: { isEnabled: true },
          select: { name: true, slug: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { navOrder: 'asc' },
    });
    return cats;
  } catch {
    return [];
  }
}

/**
 * Get slugs of states that are enabled AND have at least one active package.
 * Used to filter static state data on homepage and destinations pages.
 */
export async function getActiveStateSlugs(): Promise<Set<string>> {
  try {
    const states = await prisma.indianState.findMany({
      where: {
        isActive: true,
        cities: {
          some: {
            destinations: {
              some: {
                products: { some: { status: 'APPROVED', isActive: true } },
              },
            },
          },
        },
      },
      select: { name: true },
    });
    // Return state names (lowercased) for matching
    return new Set(states.map((s) => s.name.toLowerCase()));
  } catch {
    return new Set();
  }
}

/**
 * Get states that are enabled (isActive=true) in the DB.
 * Returns StateInfo[] from static metadata, filtered to only DB-active states.
 * Use this everywhere on the frontend instead of getPrimaryStates()/getAllStates().
 */
export async function getActiveStates(): Promise<StateInfo[]> {
  try {
    const dbStates = await prisma.indianState.findMany({
      where: { isActive: true },
      select: { name: true },
    });
    const activeNames = new Set(dbStates.map((s) => s.name.toLowerCase()));
    return getAllStates().filter((s) => activeNames.has(s.name.toLowerCase()));
  } catch {
    // Fallback: return all states from static data
    return getAllStates();
  }
}

/**
 * Get the set of enabled category slugs from the DB.
 * Returns null if no categories are configured (use all as fallback).
 */
export async function getEnabledCategorySlugsSet(): Promise<Set<string> | null> {
  try {
    const dbCats = await prisma.experienceCategory.findMany({
      select: { slug: true, isEnabled: true },
    });
    if (dbCats.length === 0) return null; // No DB config — show all
    return new Set(dbCats.filter((c) => c.isEnabled).map((c) => c.slug));
  } catch {
    return null;
  }
}
