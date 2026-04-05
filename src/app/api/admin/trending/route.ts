import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { status: 'APPROVED', isActive: true },
      select: {
        id: true,
        title: true,
        activityType: true,
        packageCategory: true,
        durationDays: true,
        isTrending: true,
        guide: { include: { user: { select: { name: true } } } },
        destination: {
          include: { city: { include: { state: { select: { name: true } } } } },
        },
        fixedDepartures: {
          where: { isActive: true, approvalStatus: 'APPROVED', startDate: { gte: new Date() } },
          orderBy: { startDate: 'asc' },
          take: 1,
          select: { pricePerPerson: true, startDate: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ products });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only super admin can manage trending' }, { status: 403 });
    }

    const body = await request.json();
    const { productId, isTrending } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: { isTrending: !!isTrending },
    });

    return NextResponse.json({
      message: isTrending ? 'Marked as trending' : 'Removed from trending',
      product: updated,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update trending status' }, { status: 500 });
  }
}
