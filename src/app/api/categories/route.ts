import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { CATEGORY_MAP } from '@/lib/categories';

// GET /api/categories — public endpoint, returns enabled categories with their subcategories
// Falls back to categories.ts static data if DB is empty
export async function GET() {
  try {
    const dbCategories = await prisma.experienceCategory.findMany({
      where: { isEnabled: true },
      include: {
        subCategories: {
          where: { isEnabled: true },
          orderBy: { sortOrder: 'asc' },
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    if (dbCategories.length > 0) {
      return NextResponse.json({ categories: dbCategories });
    }

    // Fallback: build from static CATEGORY_MAP
    const fallback = Object.values(CATEGORY_MAP).map((cat) => ({
      id: cat.slug,
      slug: cat.slug,
      label: cat.label,
      isEnabled: true,
      subCategories: cat.activityTypes.map((name, i) => ({
        id: `${cat.slug}_${i}`,
        name,
        slug: name.toLowerCase().replace(/[\s/]+/g, '-'),
      })),
    }));

    return NextResponse.json({ categories: fallback });
  } catch (error) {
    console.error('Categories GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
