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
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    let managedStates: any[] = [];
    if (role === 'ADMIN') {
      const adminProfile = await prisma.adminProfile.findUnique({
        where: { userId },
        include: {
          managedStates: {
            select: { id: true, name: true, commissionPercent: true },
          },
        },
      });
      managedStates = adminProfile?.managedStates || [];
    }

    return NextResponse.json({
      name: user?.name || '',
      email: user?.email || '',
      managedStates,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}
