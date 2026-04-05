import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/admin/categories — list all categories + subcategories
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const categories = await prisma.experienceCategory.findMany({
      include: { subCategories: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Categories GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST /api/admin/categories — create or seed categories
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if ((session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    // Seed default categories from categories.ts definitions
    if (action === 'seed') {
      const { CATEGORY_MAP } = await import('@/lib/categories');
      const entries = Object.entries(CATEGORY_MAP);
      let created = 0;

      for (let i = 0; i < entries.length; i++) {
        const [slug, def] = entries[i];
        const existing = await prisma.experienceCategory.findUnique({ where: { slug } });
        if (!existing) {
          await prisma.experienceCategory.create({
            data: {
              slug,
              label: def.label,
              urlSlug: def.urlSlug,
              image: def.image,
              description: def.description,
              isEnabled: true,
              showInNav: false,
              sortOrder: i,
              subCategories: {
                create: def.activityTypes.map((name: string, j: number) => ({
                  name,
                  slug: name.toLowerCase().replace(/[\s\/]+/g, '-'),
                  isEnabled: true,
                  sortOrder: j,
                })),
              },
            },
          });
          created++;
        }
      }

      return NextResponse.json({ message: `Seeded ${created} categories` });
    }

    // Create a new category
    const { slug, label, urlSlug, image, description, subCategories } = body;
    if (!slug || !label || !urlSlug) {
      return NextResponse.json({ error: 'slug, label, and urlSlug are required' }, { status: 400 });
    }

    // Validate slug format
    if (!/^[A-Z_]+$/.test(slug)) {
      return NextResponse.json({ error: 'Slug must be UPPER_SNAKE_CASE' }, { status: 400 });
    }

    const maxOrder = await prisma.experienceCategory.aggregate({ _max: { sortOrder: true } });
    const category = await prisma.experienceCategory.create({
      data: {
        slug,
        label,
        urlSlug,
        image: image || null,
        description: description || null,
        isEnabled: true,
        showInNav: false,
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
        subCategories: {
          create: (subCategories || []).map((sc: { name: string }, i: number) => ({
            name: sc.name,
            slug: sc.name.toLowerCase().replace(/[\s\/]+/g, '-'),
            isEnabled: true,
            sortOrder: i,
          })),
        },
      },
      include: { subCategories: true },
    });

    return NextResponse.json({ message: 'Category created', category });
  } catch (error: any) {
    console.error('Categories POST error:', error);
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Category with this slug or urlSlug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

// PUT /api/admin/categories — update category or subcategory
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if ((session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, type, ...data } = body;

    if (!id || !type) {
      return NextResponse.json({ error: 'id and type are required' }, { status: 400 });
    }

    if (type === 'category') {
      const allowed = ['label', 'image', 'description', 'isEnabled', 'showInNav', 'navLabel', 'navOrder', 'sortOrder'] as const;
      const updates: Record<string, any> = {};
      for (const key of allowed) {
        if (data[key] !== undefined) updates[key] = data[key];
      }

      const updated = await prisma.experienceCategory.update({
        where: { id },
        data: updates,
      });
      return NextResponse.json({ message: 'Category updated', category: updated });
    }

    if (type === 'subcategory') {
      const allowed = ['name', 'isEnabled', 'sortOrder'] as const;
      const updates: Record<string, any> = {};
      for (const key of allowed) {
        if (data[key] !== undefined) updates[key] = data[key];
      }
      if (data.name) {
        updates.slug = data.name.toLowerCase().replace(/[\s\/]+/g, '-');
      }

      const updated = await prisma.subCategory.update({
        where: { id },
        data: updates,
      });
      return NextResponse.json({ message: 'Subcategory updated', subCategory: updated });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Categories PUT error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

// DELETE /api/admin/categories — add a subcategory
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if ((session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type');

    if (!id || !type) {
      return NextResponse.json({ error: 'id and type query params required' }, { status: 400 });
    }

    if (type === 'subcategory') {
      await prisma.subCategory.delete({ where: { id } });
      return NextResponse.json({ message: 'Subcategory deleted' });
    }

    return NextResponse.json({ error: 'Only subcategory deletion is allowed' }, { status: 400 });
  } catch (error) {
    console.error('Categories DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
