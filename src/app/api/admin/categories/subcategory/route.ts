import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/admin/categories/subcategory — add a subcategory to a category
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if ((session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { categoryId, name } = body;

    if (!categoryId || !name) {
      return NextResponse.json({ error: 'categoryId and name are required' }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[\s\/]+/g, '-');
    const maxOrder = await prisma.subCategory.aggregate({
      where: { categoryId },
      _max: { sortOrder: true },
    });

    const sub = await prisma.subCategory.create({
      data: {
        categoryId,
        name,
        slug,
        isEnabled: true,
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      },
    });

    return NextResponse.json({ message: 'Subcategory added', subCategory: sub });
  } catch (error: any) {
    console.error('Add subcategory error:', error);
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Subcategory already exists in this category' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to add subcategory' }, { status: 500 });
  }
}
