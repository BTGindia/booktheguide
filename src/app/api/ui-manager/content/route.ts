import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/ui-manager/content — List all page content entries
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== 'UI_MANAGER' && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const pageType = searchParams.get('pageType');

    const where: any = {};
    if (pageType) where.pageType = pageType;

    const contents = await prisma.pageContent.findMany({
      where,
      orderBy: [{ pageType: 'asc' }, { entityName: 'asc' }],
    });

    return NextResponse.json({ contents });
  } catch (error) {
    console.error('UI Manager content error:', error);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}

// POST /api/ui-manager/content — Create or update page content
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== 'UI_MANAGER' && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { pageType, entityId, entityName, content } = body;

    if (!pageType) {
      return NextResponse.json({ error: 'pageType is required' }, { status: 400 });
    }

    const userId = (session.user as any).id;

    const result = await prisma.pageContent.upsert({
      where: {
        pageType_entityId: {
          pageType,
          entityId: entityId || '',
        },
      },
      create: {
        pageType,
        entityId: entityId || '',
        entityName: entityName || null,
        content: content || {},
        updatedById: userId,
      },
      update: {
        entityName: entityName || null,
        content: content || {},
        updatedById: userId,
      },
    });

    return NextResponse.json({ content: result });
  } catch (error) {
    console.error('UI Manager content save error:', error);
    return NextResponse.json({ error: 'Failed to save content' }, { status: 500 });
  }
}
