import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { CATEGORY_MAP, CATEGORIES_ORDERED, type PackageCategorySlug } from '@/lib/categories';
import { PackageCard, type PackageCardData } from '@/components/PackageCard';
import { SearchFilters } from '@/components/search/SearchFilters';
import { getPageBySlug, wpSeoToMetadata } from '@/lib/wordpress';

// Accept both URL slugs (e.g. 'adventure-guides') and enum keys (e.g. 'ADVENTURE_GUIDES')
const URL_SLUG_TO_ENUM: Record<string, PackageCategorySlug> = Object.fromEntries(
  CATEGORIES_ORDERED.map((c) => [c.urlSlug, c.slug])
) as Record<string, PackageCategorySlug>;

export async function generateMetadata(): Promise<Metadata> {
  const wpPage = await getPageBySlug('search');
  if (wpPage?.seo) {
    return wpSeoToMetadata(wpPage.seo, {
      title: 'Search Trips - Find Adventures & Treks | Book The Guide',
      description: 'Search and compare upcoming trips across India. Filter by destination, category, activity, and price.',
      url: 'https://www.booktheguide.com/search',
    });
  }
  return {
    title: 'Search Trips - Find Adventures & Treks | Book The Guide',
    description: 'Search and compare upcoming trips across India. Filter by destination, category, activity, and price.',
    alternates: { canonical: 'https://www.booktheguide.com/search' },
  };
}

interface SearchPageProps {
  searchParams: {
    q?: string;
    destination?: string;
    category?: string;
    activity?: string;
    experience?: string;
    state?: string;
    gender?: string;
    minPrice?: string;
    maxPrice?: string;
    rating?: string;
    sort?: string;
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, destination, category, activity, experience, state, gender, minPrice, maxPrice, rating, sort } = searchParams;

  // ── Build Product-level filter (shows ALL packages for a destination) ──
  const productWhere: any = { isActive: true, status: 'APPROVED' };

  // Keyword search — matches title, destination, city, state, or activityType
  const keyword = q || destination;
  if (keyword) {
    productWhere.OR = [
      { title: { contains: keyword, mode: 'insensitive' } },
      { activityType: { contains: keyword, mode: 'insensitive' } },
      { destination: { name: { contains: keyword, mode: 'insensitive' } } },
      { destination: { city: { name: { contains: keyword, mode: 'insensitive' } } } },
      { destination: { city: { state: { name: { contains: keyword, mode: 'insensitive' } } } } },
    ];
  }

  // Build destination filter conditions
  const destinationFilter: any = {};

  // State filter - merge with destination filter instead of overwriting
  if (state) {
    const stateFilter = { name: { contains: state, mode: 'insensitive' as const } };
    if (destinationFilter.city) {
      destinationFilter.city = { ...destinationFilter.city, state: stateFilter };
    } else {
      destinationFilter.city = { state: stateFilter };
    }
  }

  if (Object.keys(destinationFilter).length > 0) {
    productWhere.destination = destinationFilter;
  }

  // Category filter - accepts both URL slug ('adventure-guides') and enum key ('ADVENTURE_GUIDES')
  const categoryEnum: PackageCategorySlug | null = category
    ? (CATEGORY_MAP[category as PackageCategorySlug] ? (category as PackageCategorySlug) : (URL_SLUG_TO_ENUM[category] ?? null))
    : null;
  if (categoryEnum) {
    productWhere.packageCategory = categoryEnum;
  }

  // Activity / experience filter — match against activityType
  const activityFilter = activity || experience;
  if (activityFilter) {
    productWhere.activityType = { equals: activityFilter, mode: 'insensitive' as const };
  }

  // Sort
  let productOrderBy: any = { createdAt: 'desc' as const };
  if (sort === 'newest') productOrderBy = { createdAt: 'desc' as const };

  // ── Query products directly (only packages with upcoming approved departures) ──
  const productInclude = {
    destination: { include: { city: { include: { state: true } } } },
    guide: { include: { user: { select: { name: true, image: true } } } },
    fixedDepartures: {
      where: { isActive: true, approvalStatus: 'APPROVED' as const, startDate: { gte: new Date() } },
      orderBy: { pricePerPerson: 'asc' as const },
      take: 1,
      select: { pricePerPerson: true, meetingPoint: true, totalSeats: true, bookedSeats: true, genderPolicy: true },
    },
  };

  // Only show packages that have at least 1 upcoming approved departure
  productWhere.fixedDepartures = {
    some: { isActive: true, approvalStatus: 'APPROVED', startDate: { gte: new Date() } },
  };

  const products = await prisma.product.findMany({
    where: productWhere,
    orderBy: productOrderBy,
    include: productInclude,
    take: 80,
  }) as any[];

  // ── Post-query filters ──

  // Gender policy filter (applied on departure level)
  let filteredProducts = products;
  if (gender) {
    filteredProducts = products.filter((p) =>
      p.fixedDepartures.length === 0 || p.fixedDepartures.some((d: any) => d.genderPolicy === gender)
    );
  }

  // Price filter (applied on departure level)
  if (minPrice || maxPrice) {
    const min = minPrice ? parseFloat(minPrice) : 0;
    const max = maxPrice ? parseFloat(maxPrice) : Infinity;
    filteredProducts = filteredProducts.filter((p) => {
      if (p.fixedDepartures.length === 0) return true; // show personal-only packages
      return p.fixedDepartures.some((d: any) => d.pricePerPerson >= min && d.pricePerPerson <= max);
    });
  }

  // Guide rating filter
  if (rating) {
    const minRating = parseFloat(rating);
    filteredProducts = filteredProducts.filter((p) => p.guide.averageRating >= minRating);
  }

  // Sort by price (post-query since price is on departures)
  if (sort === 'price-low') {
    filteredProducts.sort((a, b) => (a.fixedDepartures[0]?.pricePerPerson ?? Infinity) - (b.fixedDepartures[0]?.pricePerPerson ?? Infinity));
  } else if (sort === 'price-high') {
    filteredProducts.sort((a, b) => (b.fixedDepartures[0]?.pricePerPerson ?? 0) - (a.fixedDepartures[0]?.pricePerPerson ?? 0));
  }

  // Fetch states for filter sidebar (only states with packages)
  const [states, sponsoredItems] = await Promise.all([
    prisma.indianState.findMany({
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
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true, isNorthIndia: true },
    }),
    prisma.sponsoredItem.findMany({
      where: { isActive: true, entityType: 'PRODUCT', context: { in: ['search', 'both'] } },
      orderBy: { rank: 'asc' },
      select: { entityId: true, rank: true },
    }),
  ]);

  const sponsoredProductIds = new Set(sponsoredItems.map((s) => s.entityId));
  const sponsoredRankMap = new Map(sponsoredItems.map((s) => [s.entityId, s.rank]));

  // Map products to PackageCard data
  let packageCards: PackageCardData[] = filteredProducts.map((p: any) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    coverImage: p.coverImage,
    durationDays: p.durationDays,
    durationNights: p.durationNights,
    activityType: p.activityType,
    packageCategory: p.packageCategory || 'TOURIST_GUIDES',
    destinationName: p.destination.name,
    stateName: p.destination.city.state.name,
    guideName: p.guide.user.name || 'Guide',
    guideRating: p.guide.averageRating,
    guideReviewCount: p.guide.totalReviews ?? 0,
    guideCertification: p.guide.certifications?.[0] || undefined,
    meetingPoint: p.fixedDepartures?.[0]?.meetingPoint || undefined,
    price: p.fixedDepartures?.[0]?.pricePerPerson ?? null,
    seatsLeft: p.fixedDepartures?.[0]
      ? p.fixedDepartures[0].totalSeats - (p.fixedDepartures[0].bookedSeats || 0)
      : undefined,
    isSponsored: sponsoredProductIds.has(p.id),
  }));

  // Sort sponsored items to top (preserving relative order within each group)
  packageCards.sort((a, b) => {
    const aSponsored = a.isSponsored ? 0 : 1;
    const bSponsored = b.isSponsored ? 0 : 1;
    if (aSponsored !== bSponsored) return aSponsored - bSponsored;
    if (a.isSponsored && b.isSponsored) {
      return (sponsoredRankMap.get(a.id) ?? 999) - (sponsoredRankMap.get(b.id) ?? 999);
    }
    return 0;
  });

  // Derive title
  const categoryDef = categoryEnum ? CATEGORY_MAP[categoryEnum] : null;
  const pageTitle = categoryDef
    ? categoryDef.label
    : destination
    ? `Trips to "${destination}"`
    : activity
    ? `${activity.replace(/_/g, ' ')} Trips`
    : 'Find Your Perfect Trip';

  return (
    <>
      {/* ---- Hero / header ---- */}
      <section className="bg-btg-dark py-14 lg:py-20">
        <div className="w-full px-6 md:px-12">
          <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-btg-blush mb-3">Search Trips</p>
          <h1 className="font-heading text-[clamp(32px,5vw,52px)] font-normal leading-[1.1] text-btg-cream mb-2">
            {pageTitle}
          </h1>
          <p className="text-btg-cream/45 text-sm">
            {packageCards.length} trip{packageCards.length !== 1 ? 's' : ''} found
          </p>
        </div>
      </section>

      {/* ---- Content ---- */}
      <section className="py-10 lg:py-16 bg-btg-cream">
        <div className="w-full px-6 md:px-12">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <aside className="w-full lg:w-72 flex-shrink-0">
              <SearchFilters states={states} categories={CATEGORIES_ORDERED} currentFilters={searchParams} />
            </aside>

            {/* Results */}
            <div className="flex-1">
              {packageCards.length === 0 ? (
                <div className="text-center py-20">
                  <span className="text-5xl block mb-4">&#x1F3D4;&#xFE0F;</span>
                  <h3 className="font-heading text-xl font-medium text-btg-dark mb-2">No trips found</h3>
                  <p className="text-btg-light-text max-w-md mx-auto text-sm">
                    Try adjusting your filters or explore different destinations.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {packageCards.map((pkg) => (
                    <PackageCard key={`${pkg.id}-${pkg.price}`} pkg={pkg} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
