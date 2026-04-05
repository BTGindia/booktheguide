import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/admin/audit-log — View audit trail
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && role !== 'GUIDE_MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const guideId = searchParams.get('guideId');
    const entityType = searchParams.get('entityType');
    const action = searchParams.get('action');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    const where: any = {};
    if (guideId) where.guideId = guideId;
    if (entityType) where.entityType = entityType;
    if (action) where.action = action;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          guide: {
            select: {
              displayName: true,
              slug: true,
              user: { select: { name: true } },
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
