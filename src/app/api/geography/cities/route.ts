import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stateId = searchParams.get('stateId');

    const where: any = { isActive: true };
    if (stateId) where.stateId = stateId;

    const cities = await prisma.city.findMany({
      where,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, stateId: true },
    });
    return NextResponse.json({ cities });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch cities' }, { status: 500 });
  }
}
