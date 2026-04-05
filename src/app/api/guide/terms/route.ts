import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET: Fetch applicable terms for a guide based on their state & guide type
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state') || undefined;
    const guideType = searchParams.get('guideType') || undefined;

    // Find terms that match: exact state+type, state only, type only, or global (null/null)
    const terms = await prisma.guideTermsConditions.findMany({
      where: {
        isActive: true,
        OR: [
          { state, guideType },
          { state, guideType: null },
          { state: null, guideType },
          { state: null, guideType: null },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ terms });
  } catch (error) {
    console.error('Terms fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch terms' }, { status: 500 });
  }
}
