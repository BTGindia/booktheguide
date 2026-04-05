import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { computeGuideScore, getScoreTips } from '@/lib/guide-score';

// GET /api/guide/score?guideId=xxx
// Returns guide score breakdown + tips
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any).role;
    const { searchParams } = new URL(request.url);
    let guideId = searchParams.get('guideId');

    // If guide is requesting their own score
    if (role === 'GUIDE' && !guideId) {
      const profile = await prisma.guideProfile.findUnique({
        where: { userId: (session.user as any).id },
        select: { id: true },
      });
      if (!profile) {
        return NextResponse.json({ error: 'Guide profile not found' }, { status: 404 });
      }
      guideId = profile.id;
    }

    // Admins can look up any guide
    if (!guideId) {
      return NextResponse.json({ error: 'guideId required' }, { status: 400 });
    }

    // Non-admins can only view their own
    if (role === 'GUIDE') {
      const profile = await prisma.guideProfile.findUnique({
        where: { userId: (session.user as any).id },
        select: { id: true },
      });
      if (profile?.id !== guideId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (!['SUPER_ADMIN', 'ADMIN', 'GUIDE_MANAGER'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get stored score first
    const guide = await prisma.guideProfile.findUnique({
      where: { id: guideId },
      select: {
        guideScore: true,
        scoreBreakdown: true,
        scoreUpdatedAt: true,
        user: { select: { name: true } },
      },
    });

    if (!guide) {
      return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
    }

    // If score was never computed or is stale (>24h), compute fresh
    const isStale = !guide.scoreUpdatedAt ||
      Date.now() - new Date(guide.scoreUpdatedAt).getTime() > 24 * 60 * 60 * 1000;

    let breakdown = guide.scoreBreakdown as any;
    if (isStale || !breakdown?.total) {
      breakdown = await computeGuideScore(guideId);
      // Persist the fresh score
      await prisma.guideProfile.update({
        where: { id: guideId },
        data: {
          guideScore: breakdown.total,
          scoreBreakdown: breakdown,
          scoreUpdatedAt: new Date(),
        },
      });
    }

    const tips = getScoreTips(breakdown);

    return NextResponse.json({
      guideName: guide.user.name,
      guideId,
      score: breakdown.total,
      breakdown,
      tips,
      updatedAt: guide.scoreUpdatedAt || new Date(),
    });
  } catch (error) {
    console.error('Score fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch score' }, { status: 500 });
  }
}
