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

    // Return list of influencer guides (guides with TRAVEL_WITH_INFLUENCERS products)
    if (action === 'guides') {
      const guides = await prisma.guideProfile.findMany({
        where: {
          products: {
            some: { packageCategory: 'TRAVEL_WITH_INFLUENCERS' },
          },
        },
        include: {
          user: { select: { name: true } },
        },
      });
      return NextResponse.json({
        guides: guides.map((g) => ({ id: g.id, name: g.user.name })),
      });
    }

    // Return products for a specific guide
    if (action === 'products') {
      const guideId = searchParams.get('guideId');
      if (!guideId) return NextResponse.json({ error: 'guideId required' }, { status: 400 });
      const products = await prisma.product.findMany({
        where: { guideId },
        select: { id: true, title: true },
        orderBy: { title: 'asc' },
      });
      return NextResponse.json({ products });
    }

    // Default: return all P&L entries
    const entries = await prisma.influencerPnL.findMany({
      include: {
        guide: { include: { user: { select: { name: true } } } },
        product: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ entries });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch P&L data' }, { status: 500 });
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
    const {
      guideId, productId, contractType, profitSharePercent,
      onlineSaleAmount, onlineSalePersons, offlineSaleAmount, offlineSalePersons,
      totalCostAmount, totalRevenue, totalProfit,
      influencerShare, platformShare, notes, period,
    } = body;

    if (!guideId) {
      return NextResponse.json({ error: 'Guide ID required' }, { status: 400 });
    }

    if (!['COMMISSION', 'PNL_SHARING'].includes(contractType)) {
      return NextResponse.json({ error: 'Invalid contract type' }, { status: 400 });
    }

    // Verify the guide exists
    const guide = await prisma.guideProfile.findUnique({ where: { id: guideId } });
    if (!guide) {
      return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
    }

    const entry = await prisma.influencerPnL.create({
      data: {
        guideId,
        productId: productId || null,
        contractType,
        profitSharePercent: contractType === 'PNL_SHARING' ? Number(profitSharePercent) : null,
        onlineSaleAmount: Number(onlineSaleAmount) || 0,
        onlineSalePersons: Number(onlineSalePersons) || 0,
        offlineSaleAmount: Number(offlineSaleAmount) || 0,
        offlineSalePersons: Number(offlineSalePersons) || 0,
        totalCostAmount: Number(totalCostAmount) || 0,
        totalRevenue: Number(totalRevenue) || 0,
        totalProfit: Number(totalProfit) || 0,
        influencerShare: Number(influencerShare) || 0,
        platformShare: Number(platformShare) || 0,
        notes: notes || null,
        period: period || null,
      },
    });

    return NextResponse.json({ entry, message: 'P&L entry created' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create P&L entry' }, { status: 500 });
  }
}
