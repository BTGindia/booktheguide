import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if ((session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Return available products for selection
    if (action === 'products') {
      const products = await prisma.product.findMany({
        where: { status: 'APPROVED', isActive: true },
        select: { id: true, title: true, packageCategory: true, slug: true },
        orderBy: { title: 'asc' },
      });
      return NextResponse.json({ products });
    }

    // Return available destinations
    if (action === 'destinations') {
      const destinations = await prisma.destination.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });
      return NextResponse.json({ destinations });
    }

    // Return available categories
    if (action === 'categories') {
      const categories = await prisma.experienceCategory.findMany({
        where: { isEnabled: true },
        select: { id: true, slug: true, label: true },
        orderBy: { sortOrder: 'asc' },
      });
      return NextResponse.json({ categories });
    }

    // Default: return all homepage selections grouped by section
    const selections = await prisma.homepageSelection.findMany({
      where: { isActive: true },
      orderBy: [{ section: 'asc' }, { sortOrder: 'asc' }],
    });

    return NextResponse.json({ selections });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch homepage data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if ((session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { section, entityType, entityId, sortOrder } = body;

    if (!section || !entityType || !entityId) {
      return NextResponse.json({ error: 'section, entityType, and entityId are required' }, { status: 400 });
    }

    const selection = await prisma.homepageSelection.upsert({
      where: {
        section_entityType_entityId: { section, entityType, entityId },
      },
      create: { section, entityType, entityId, sortOrder: sortOrder ?? 0, isActive: true },
      update: { sortOrder: sortOrder ?? 0, isActive: true },
    });

    return NextResponse.json({ selection, message: 'Selection saved' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save selection' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if ((session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await prisma.homepageSelection.delete({ where: { id } });
    return NextResponse.json({ message: 'Selection removed' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove selection' }, { status: 500 });
  }
}
