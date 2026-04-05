import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const states = await prisma.indianState.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ states });
  } catch (error) {
    console.error('States fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch states' }, { status: 500 });
  }
}
