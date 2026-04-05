import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && role !== 'STATE_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, reviewNotes } = body;

    if (!['APPROVED', 'REJECTED', 'CHANGES_REQUESTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Get admin profile including managed states (if any)
    const adminProfile = await prisma.adminProfile.findUnique({
      where: { userId: (session.user as any).id },
      include: { managedStates: true },
    });

    // Load the product and its destination state
    const productToCheck = await prisma.product.findUnique({
      where: { id: params.id },
      include: { destination: { include: { city: { include: { state: true } } } } },
    });

    if (!productToCheck) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // If user is a state admin (or admin with managedStates), ensure the product belongs to one of their states
    if (role === 'STATE_ADMIN' || role === 'ADMIN') {
      const managed = adminProfile?.managedStates || [];
      const stateId = productToCheck.destination?.city?.state?.id;
      if (managed.length > 0 && !managed.find((s) => s.id === stateId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        status,
        reviewNotes,
        reviewedById: adminProfile?.id,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json({ product, message: `Product ${status.toLowerCase()}` });
  } catch (error) {
    console.error('Product review error:', error);
    return NextResponse.json({ error: 'Failed to review product' }, { status: 500 });
  }
}
