import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if ((session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const items = await prisma.sponsoredItem.findMany({
      orderBy: [{ rank: 'asc' }, { createdAt: 'desc' }],
    });

    // Resolve entity names
    const resolved = await Promise.all(
      items.map(async (item: any) => {
        let entityName = item.entityId;
        if (item.entityType === 'PRODUCT') {
          const p = await prisma.product.findUnique({ where: { id: item.entityId }, select: { title: true } });
          if (p) entityName = p.title;
        } else if (item.entityType === 'GUIDE') {
          const g = await prisma.guideProfile.findUnique({
            where: { id: item.entityId },
            include: { user: { select: { name: true } } },
          });
          if (g) entityName = g.user.name;
        }
        return { ...item, entityName };
      })
    );

    // Also return available products and guides for selection
    const [products, guides] = await Promise.all([
      prisma.product.findMany({
        where: { status: 'APPROVED', isActive: true },
        select: { id: true, title: true, packageCategory: true },
        orderBy: { title: 'asc' },
      }),
      prisma.guideProfile.findMany({
        where: { isActive: true, isVerified: true },
        include: { user: { select: { name: true } } },
        orderBy: { user: { name: 'asc' } },
      }),
    ]);

    return NextResponse.json({
      items: resolved,
      products: products.map((p) => ({ id: p.id, label: `${p.title} (${p.packageCategory})` })),
      guides: guides.map((g) => ({ id: g.id, label: g.user.name })),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sponsored items' }, { status: 500 });
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
    const { entityType, entityId, rank, context } = body;

    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'entityType and entityId are required' }, { status: 400 });
    }

    if (!['PRODUCT', 'GUIDE'].includes(entityType)) {
      return NextResponse.json({ error: 'entityType must be PRODUCT or GUIDE' }, { status: 400 });
    }

    const item = await prisma.sponsoredItem.upsert({
      where: { entityType_entityId: { entityType, entityId } },
      create: {
        entityType,
        entityId,
        rank: Number(rank) || 0,
        context: context || 'both',
        isActive: true,
      },
      update: {
        rank: Number(rank) || 0,
        context: context || 'both',
        isActive: true,
      },
    });

    return NextResponse.json({ item, message: 'Sponsored item saved' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save sponsored item' }, { status: 500 });
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

    await prisma.sponsoredItem.delete({ where: { id } });
    return NextResponse.json({ message: 'Sponsored item removed' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
