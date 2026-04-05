import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/super-admin/ai-analytics - AI Travel Planner analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if ((session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Total sessions and queries
    const totalQueries = await prisma.aiQueryLog.count({
      where: { createdAt: { gte: startDate } },
    });

    const uniqueSessions = await prisma.aiQueryLog.groupBy({
      by: ['sessionId'],
      where: { createdAt: { gte: startDate } },
    });

    const uniqueUsers = await prisma.aiQueryLog.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: startDate },
        userId: { not: null },
      },
    });

    // Conversion: clicked a package
    const clickedQueries = await prisma.aiQueryLog.count({
      where: {
        createdAt: { gte: startDate },
        clickedPackageId: { not: null },
      },
    });

    // Average messages per session
    const messagesPerSession = totalQueries > 0 && uniqueSessions.length > 0
      ? (totalQueries / uniqueSessions.length).toFixed(1)
      : '0';

    // Recent queries log
    const recentQueries = await prisma.aiQueryLog.findMany({
      where: { createdAt: { gte: startDate } },
      include: {
        user: { select: { name: true, email: true } },
        clickedPackage: { select: { title: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Daily query counts for chart
    const dailyQueries = await prisma.$queryRaw`
      SELECT DATE("createdAt") as date, COUNT(*)::int as count
      FROM "AiQueryLog"
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY DATE("createdAt") ASC
    ` as { date: Date; count: number }[];

    // Top queries by frequency (simple keyword extraction)
    const allQueries = await prisma.aiQueryLog.findMany({
      where: { createdAt: { gte: startDate } },
      select: { query: true },
    });

    // Extract simple keyword frequencies
    const wordCounts: Record<string, number> = {};
    const stopWords = new Set(['i', 'me', 'my', 'we', 'our', 'you', 'your', 'it', 'its', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'am', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'can', 'may', 'might', 'shall', 'this', 'that', 'these', 'what', 'where', 'when', 'how', 'who', 'want', 'go', 'going', 'trip', 'like', 'looking', 'need', 'please', 'help', 'about', 'from', 'there', 'some', 'any', 'not', 'all']);
    allQueries.forEach(({ query }) => {
      const words = query.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
      words.forEach(word => { wordCounts[word] = (wordCounts[word] || 0) + 1; });
    });
    const topKeywords = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([keyword, count]) => ({ keyword, count }));

    return NextResponse.json({
      kpis: {
        totalQueries,
        totalSessions: uniqueSessions.length,
        uniqueUsers: uniqueUsers.length,
        messagesPerSession,
        clickedPackages: clickedQueries,
        conversionRate: totalQueries > 0 ? ((clickedQueries / totalQueries) * 100).toFixed(1) : '0',
      },
      dailyQueries,
      topKeywords,
      recentQueries,
    });
  } catch (error) {
    console.error('Error fetching AI analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
