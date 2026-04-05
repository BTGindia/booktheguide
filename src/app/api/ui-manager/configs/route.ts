import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== 'UI_MANAGER' && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const pageConfigs = await prisma.pageConfig.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    const configs = pageConfigs.map((pc) => {
      const config = pc.config as any;
      return {
        pageSlug: pc.pageSlug,
        sectionsConfigured: Array.isArray(config?.sectionOrder) ? config.sectionOrder.length : 0,
        lastUpdated: pc.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({ configs });
  } catch (error) {
    console.error('UI Manager configs error:', error);
    return NextResponse.json({ error: 'Failed to fetch configs' }, { status: 500 });
  }
}
