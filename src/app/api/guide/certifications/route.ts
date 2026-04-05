import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { certificationSchema } from '@/lib/validations';
import { recalculateProfileCompleteness } from '@/lib/profile-completeness';

export const dynamic = 'force-dynamic';

// GET /api/guide/certifications â€” list guide's certifications
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'GUIDE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const guide = await prisma.guideProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!guide) {
      return NextResponse.json({ error: 'Guide profile not found' }, { status: 404 });
    }

    const certifications = await prisma.guideCertification.findMany({
      where: { guideId: guide.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ certifications });
  } catch (error) {
    console.error('Error fetching certifications:', error);
    return NextResponse.json({ error: 'Failed to fetch certifications' }, { status: 500 });
  }
}

// POST /api/guide/certifications â€” add a new certification
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'GUIDE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const guide = await prisma.guideProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!guide) {
      return NextResponse.json({ error: 'Guide profile not found' }, { status: 404 });
    }

    const body = await request.json();

    // Validate at point of entry
    const validation = certificationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: validation.error.errors[0]?.message || 'Validation failed',
        errors: validation.error.errors,
      }, { status: 400 });
    }

    const { certType, issuingAuthority, certificateNumber, issueDate, expiryDate, documentUrl } = validation.data;

    const certification = await prisma.guideCertification.create({
      data: {
        guideId: guide.id,
        certType,
        issuingAuthority,
        certificateNumber: certificateNumber || null,
        issueDate: issueDate ? new Date(issueDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        documentUrl: documentUrl || null,
        documentType: documentUrl ? (documentUrl.endsWith('.pdf') ? 'pdf' : 'image') : null,
        verificationStatus: 'PENDING',
      },
    });

    // If guide has submitted certs and is UNVERIFIED, move to IN_REVIEW
    const guideProfile = await prisma.guideProfile.findUnique({
      where: { id: guide.id },
      select: { verificationStatus: true },
    });

    if (guideProfile?.verificationStatus === 'UNVERIFIED') {
      await prisma.guideProfile.update({
        where: { id: guide.id },
        data: { verificationStatus: 'IN_REVIEW' },
      });
    }

    // Recalculate profile completeness
    await recalculateProfileCompleteness(guide.id);

    return NextResponse.json({ certification, message: 'Certification added successfully' });
  } catch (error) {
    console.error('Error adding certification:', error);
    return NextResponse.json({ error: 'Failed to add certification' }, { status: 500 });
  }
}

// PUT /api/guide/certifications â€” update an existing certification
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'GUIDE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const guide = await prisma.guideProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!guide) {
      return NextResponse.json({ error: 'Guide profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Certification ID is required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.guideCertification.findFirst({
      where: { id, guideId: guide.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Certification not found' }, { status: 404 });
    }

    // Guide CANNOT change verificationStatus (platform-owned field)
    delete updateData.verificationStatus;
    delete updateData.verifiedById;
    delete updateData.verifiedAt;
    delete updateData.rejectionReason;

    // Validate expiry date is in the future
    if (updateData.expiryDate && new Date(updateData.expiryDate) <= new Date()) {
      return NextResponse.json({ error: 'Expiry date must be in the future' }, { status: 400 });
    }

    const certification = await prisma.guideCertification.update({
      where: { id },
      data: {
        ...updateData,
        issueDate: updateData.issueDate ? new Date(updateData.issueDate) : existing.issueDate,
        expiryDate: updateData.expiryDate ? new Date(updateData.expiryDate) : existing.expiryDate,
        // Reset verification status on any update (needs re-review)
        verificationStatus: 'PENDING',
      },
    });

    return NextResponse.json({ certification, message: 'Certification updated' });
  } catch (error) {
    console.error('Error updating certification:', error);
    return NextResponse.json({ error: 'Failed to update certification' }, { status: 500 });
  }
}

// DELETE /api/guide/certifications â€” soft-delete (just remove)
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'GUIDE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const guide = await prisma.guideProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!guide) {
      return NextResponse.json({ error: 'Guide profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const certId = searchParams.get('id');

    if (!certId) {
      return NextResponse.json({ error: 'Certification ID is required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.guideCertification.findFirst({
      where: { id: certId, guideId: guide.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Certification not found' }, { status: 404 });
    }

    await prisma.guideCertification.delete({ where: { id: certId } });

    // Recalculate profile completeness
    await recalculateProfileCompleteness(guide.id);

    return NextResponse.json({ message: 'Certification removed' });
  } catch (error) {
    console.error('Error deleting certification:', error);
    return NextResponse.json({ error: 'Failed to delete certification' }, { status: 500 });
  }
}
