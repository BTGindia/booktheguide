import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { recalculateAllGuideScores, recalculateSingleGuideScore } from '@/lib/guide-score';

export const dynamic = 'force-dynamic';

// POST /api/guide/score/recalculate
// Bulk recalculate all scores (super admin) or single guide score
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any).role;
    const body = await request.json().catch(() => ({}));
    const { guideId } = body;

    // Single guide can recalculate their own score
    if (role === 'GUIDE' && !guideId) {
      return NextResponse.json({ error: 'guideId required' }, { status: 400 });
    }

    // Bulk recalculation is super admin only
    if (!guideId && role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (guideId) {
      const score = await recalculateSingleGuideScore(guideId);
      return NextResponse.json({ score });
    }

    // Bulk recalculation
    const result = await recalculateAllGuideScores();
    return NextResponse.json({ message: 'Scores recalculated', ...result });
  } catch (error) {
    console.error('Score recalculation error:', error);
    return NextResponse.json({ error: 'Failed to recalculate scores' }, { status: 500 });
  }
}
