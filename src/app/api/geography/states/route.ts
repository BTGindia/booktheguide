import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const states = await prisma.indianState.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true, isNorthIndia: true },
    });
    return NextResponse.json({ states });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch states' }, { status: 500 });
  }
}
