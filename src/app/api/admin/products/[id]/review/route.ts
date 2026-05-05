import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendGuideProductReviewNotifications } from '@/lib/notifications/guide-review-notifications';

export const dynamic = 'force-dynamic';

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

    if ((status === 'APPROVED' || status === 'REJECTED') && !reviewNotes?.trim()) {
      return NextResponse.json(
        { error: 'Review notes are required. This message will be sent to the guide.' },
        { status: 400 }
      );
    }

    // Get admin profile including managed states (if any)
    const adminProfile = await prisma.adminProfile.findUnique({
      where: { userId: (session.user as any).id },
      include: { managedStates: true },
    });

    // Load the product and its destination state
    const productToCheck = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        destination: { include: { city: { include: { state: true } } } },
        guide: {
          include: {
            user: { select: { name: true, email: true, phone: true } },
          },
        },
      },
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

    let notificationResult = null;
    if (status === 'APPROVED' || status === 'REJECTED') {
      notificationResult = await sendGuideProductReviewNotifications({
        guideName: productToCheck.guide.user.name,
        guideEmail: productToCheck.guide.email || productToCheck.guide.user.email,
        guidePhone: productToCheck.guide.phone || productToCheck.guide.user.phone,
        productTitle: productToCheck.title,
        decision: status,
        reviewNote: reviewNotes.trim(),
      });
    }

    return NextResponse.json({
      product,
      message: `Product ${status.toLowerCase()}`,
      notification: notificationResult,
    });
  } catch (error) {
    console.error('Product review error:', error);
    return NextResponse.json({ error: 'Failed to review product' }, { status: 500 });
  }
}
