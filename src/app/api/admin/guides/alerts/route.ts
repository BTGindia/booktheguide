import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { REVERIFICATION_TRIGGERS } from '@/lib/taxonomy';

export const dynamic = 'force-dynamic';

// POST /api/admin/guides/alerts â€” Run automated alert checks
// This should be called by a cron job (daily) or manually by admin
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const results = {
      certExpiryAlerts: 0,
      certExpired: 0,
      inactiveGuides: 0,
      complaintFlags: 0,
    };

    // === 1. Certification Expiry Alerts (60, 30, 7 days) ===
    for (const days of REVERIFICATION_TRIGGERS.CERT_EXPIRY_ALERT_DAYS) {
      const alertDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      const alertField = days === 60 ? 'expiryAlertSent60d' : days === 30 ? 'expiryAlertSent30d' : 'expiryAlertSent7d';

      const expiringSoon = await prisma.guideCertification.findMany({
        where: {
          expiryDate: { lte: alertDate, gt: now },
          verificationStatus: 'VERIFIED',
          [alertField]: false,
        },
        include: {
          guide: {
            select: { id: true, email: true, phone: true, displayName: true },
          },
        },
      });

      for (const cert of expiringSoon) {
        // Mark alert as sent
        await prisma.guideCertification.update({
          where: { id: cert.id },
          data: { [alertField]: true },
        });

        // In production: send email/SMS to cert.guide.email / cert.guide.phone
        // For now, we just count the alerts
        results.certExpiryAlerts++;
      }
    }

    // === 2. Auto-expire certifications past their expiry date ===
    const expiredCerts = await prisma.guideCertification.updateMany({
      where: {
        expiryDate: { lte: now },
        verificationStatus: 'VERIFIED',
      },
      data: {
        verificationStatus: 'EXPIRED',
      },
    });
    results.certExpired = expiredCerts.count;

    // Auto-restrict guides whose ALL certifications have expired
    const guidesWithAllExpired = await prisma.guideProfile.findMany({
      where: {
        verificationStatus: 'VERIFIED',
        guideCertifications: {
          every: { verificationStatus: { in: ['EXPIRED', 'REJECTED'] } },
          some: {}, // at least one cert exists
        },
      },
      select: { id: true },
    });

    for (const guide of guidesWithAllExpired) {
      await prisma.guideProfile.update({
        where: { id: guide.id },
        data: { verificationStatus: 'SUSPENDED' },
      });
    }

    // === 3. Inactive login check (90 days without login) ===
    const inactiveThreshold = new Date(now.getTime() - REVERIFICATION_TRIGGERS.INACTIVE_LOGIN_DAYS * 24 * 60 * 60 * 1000);
    const inactiveGuides = await prisma.guideProfile.findMany({
      where: {
        verificationStatus: 'VERIFIED',
        OR: [
          { lastLoginAt: { lte: inactiveThreshold } },
          { lastLoginAt: null },
        ],
        createdAt: { lte: inactiveThreshold }, // Don't flag brand new guides
      },
      select: { id: true, email: true },
    });

    // In production: send re-verification email/SMS
    results.inactiveGuides = inactiveGuides.length;

    // === 4. Complaint threshold check (>2 complaints in 30 days) ===
    const guidesWithComplaints = await prisma.guideProfile.findMany({
      where: {
        complaintCount30d: { gt: REVERIFICATION_TRIGGERS.MAX_COMPLAINTS_30D },
        verificationStatus: 'VERIFIED',
      },
      select: { id: true },
    });

    for (const guide of guidesWithComplaints) {
      await prisma.guideProfile.update({
        where: { id: guide.id },
        data: { verificationStatus: 'IN_REVIEW' },
      });
    }
    results.complaintFlags = guidesWithComplaints.length;

    return NextResponse.json({
      message: 'Alert checks completed',
      results,
    });
  } catch (error) {
    console.error('Error running alerts:', error);
    return NextResponse.json({ error: 'Failed to run alerts' }, { status: 500 });
  }
}

// GET /api/admin/guides/alerts â€” Get current alert status
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN' && role !== 'GUIDE_MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      pendingVerifications,
      pendingCertReviews,
      pendingKycReviews,
      expiringCerts,
      suspendedGuides,
    ] = await Promise.all([
      prisma.guideProfile.count({ where: { verificationStatus: 'IN_REVIEW' } }),
      prisma.guideCertification.count({ where: { verificationStatus: 'PENDING' } }),
      prisma.guideKyc.count({ where: { kycStatus: 'PENDING' } }),
      prisma.guideCertification.count({
        where: {
          expiryDate: { lte: thirtyDays, gt: now },
          verificationStatus: 'VERIFIED',
        },
      }),
      prisma.guideProfile.count({ where: { verificationStatus: 'SUSPENDED' } }),
    ]);

    return NextResponse.json({
      alerts: {
        pendingVerifications,
        pendingCertReviews,
        pendingKycReviews,
        expiringCerts,
        suspendedGuides,
      },
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}
