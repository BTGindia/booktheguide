import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/admin/corporate-inquiries - List corporate/school trip inquiries
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const resolved = searchParams.get('resolved');
    const type = searchParams.get('type');

    const where: any = {};
    if (resolved === 'true') where.isResolved = true;
    if (resolved === 'false') where.isResolved = false;
    if (type) where.organizationType = type;

    // State admin sees only inquiries for their state
    if (role === 'ADMIN') {
      const adminProfile = await prisma.adminProfile.findUnique({
        where: { userId: (session.user as any).id },
        include: { managedStates: true },
      });
      const stateIds = adminProfile?.managedStates?.map((s) => s.id) || [];
      if (stateIds.length > 0) {
        where.preferredStateId = { in: stateIds };
      }
    }

    const inquiries = await prisma.corporateTripInquiry.findMany({
      where,
      include: {
        preferredState: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ inquiries });
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/corporate-inquiries - Mark inquiry as resolved/unresolved
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, isResolved } = body;

    if (!id) return NextResponse.json({ error: 'Inquiry ID required' }, { status: 400 });

    const inquiry = await prisma.corporateTripInquiry.update({
      where: { id },
      data: { isResolved: isResolved ?? true },
    });

    return NextResponse.json({ inquiry });
  } catch (error) {
    console.error('Error updating inquiry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
