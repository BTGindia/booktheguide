import { NextResponse } from 'next/server';
import { getActiveCategories, getActiveStates } from '@/lib/active-packages';
import { CATEGORY_MAP, type PackageCategorySlug } from '@/lib/categories';

export const revalidate = 300;

/**
 * GET /api/active-config
 * Returns active (admin-enabled) categories and states for client components.
 */
export async function GET() {
  try {
    const [activeCategories, activeStates] = await Promise.all([
      getActiveCategories().catch(() => []),
      getActiveStates().catch(() => []),
    ]);

    const categories = activeCategories.map((c: any) => {
      const cat = CATEGORY_MAP[c.slug as PackageCategorySlug];
      return {
        slug: c.slug,
        label: cat?.label || c.slug.replace(/_/g, ' '),
        urlSlug: cat?.urlSlug || c.slug.toLowerCase().replace(/_/g, '-'),
        href: cat?.href || `/experiences/${c.slug.toLowerCase().replace(/_/g, '-')}`,
      };
    });

    const states = activeStates.map((s: any) => ({
      slug: s.slug,
      name: s.name,
    }));

    return NextResponse.json({ categories, states });
  } catch (error) {
    return NextResponse.json({ categories: [], states: [] }, { status: 500 });
  }
}
