import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/admin/guides/[id]/verify - Toggle guide verification
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && role !== 'GUIDE_MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { isVerified } = body;

    const guide = await prisma.guideProfile.update({
      where: { id: params.id },
      data: { isVerified },
    });

    return NextResponse.json({
      guide,
      message: isVerified ? 'Guide verified' : 'Verification removed',
    });
  } catch (error) {
    console.error('Error verifying guide:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
