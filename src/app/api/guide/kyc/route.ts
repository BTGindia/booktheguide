import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { kycSchema } from '@/lib/validations';
import { recalculateProfileCompleteness } from '@/lib/profile-completeness';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Simple AES-256-CBC encryption for bank details
// In production, use a proper KMS (AWS KMS, Vault, etc.)
const ENCRYPTION_KEY = process.env.KYC_ENCRYPTION_KEY || 'btg-kyc-encryption-key-32-chars!'; // Must be 32 chars
const IV_LENGTH = 16;

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// GET /api/guide/kyc â€” get KYC status (masked data)
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

    const kyc = await prisma.guideKyc.findUnique({
      where: { guideId: guide.id },
    });

    if (!kyc) {
      return NextResponse.json({
        kyc: null,
        kycStatus: 'NOT_SUBMITTED',
        payoutEligible: false,
      });
    }

    // Return masked data â€” never expose full Aadhaar, PAN, or bank details to client
    let bankInfo = null;
    if (kyc.bankAccountEncrypted) {
      try {
        const decrypted = JSON.parse(decrypt(kyc.bankAccountEncrypted));
        bankInfo = {
          bankName: decrypted.bankName || '',
          branchName: decrypted.branchName || '',
          accountNumberMasked: decrypted.accountNumber ? '****' + decrypted.accountNumber.slice(-4) : '',
          ifsc: decrypted.ifsc || '',
        };
      } catch {
        bankInfo = { bankName: '', branchName: '', accountNumberMasked: '', ifsc: '' };
      }
    }

    return NextResponse.json({
      kyc: {
        aadhaarLast4: kyc.aadhaarLast4,
        aadhaarVerified: kyc.aadhaarVerified,
        aadhaarDocumentUrl: kyc.aadhaarDocumentUrl,
        panNumber: kyc.panNumber ? kyc.panNumber.slice(0, 2) + '****' + kyc.panNumber.slice(-2) : null,
        panVerified: kyc.panVerified,
        panDocumentUrl: kyc.panDocumentUrl,
        bankInfo,
        bankVerified: kyc.bankVerified,
        kycStatus: kyc.kycStatus,
        payoutEligible: kyc.payoutEligible,
      },
    });
  } catch (error) {
    console.error('Error fetching KYC:', error);
    return NextResponse.json({ error: 'Failed to fetch KYC data' }, { status: 500 });
  }
}

// POST /api/guide/kyc â€” submit/update KYC details
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
    const validation = kycSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        error: validation.error.errors[0]?.message || 'Validation failed',
        errors: validation.error.errors,
      }, { status: 400 });
    }

    const {
      aadhaarLast4, aadhaarDocumentUrl,
      panNumber, panDocumentUrl,
      bankAccountNumber, bankIfsc, bankName, branchName,
    } = validation.data;

    // Encrypt bank details before storing
    let bankAccountEncrypted = undefined;
    if (bankAccountNumber || bankIfsc) {
      const bankData = JSON.stringify({
        accountNumber: bankAccountNumber || '',
        ifsc: bankIfsc || '',
        bankName: bankName || '',
        branchName: branchName || '',
      });
      bankAccountEncrypted = encrypt(bankData);
    }

    const kycData: any = {};

    if (aadhaarLast4 !== undefined) kycData.aadhaarLast4 = aadhaarLast4;
    if (aadhaarDocumentUrl !== undefined) kycData.aadhaarDocumentUrl = aadhaarDocumentUrl;
    if (panNumber !== undefined) kycData.panNumber = panNumber;
    if (panDocumentUrl !== undefined) kycData.panDocumentUrl = panDocumentUrl;
    if (bankAccountEncrypted !== undefined) kycData.bankAccountEncrypted = bankAccountEncrypted;

    // Guide CANNOT set kycStatus or payoutEligible (platform-owned)
    // Set kycStatus to PENDING when they submit documents
    kycData.kycStatus = 'PENDING';

    const kyc = await prisma.guideKyc.upsert({
      where: { guideId: guide.id },
      create: {
        guideId: guide.id,
        ...kycData,
      },
      update: kycData,
    });

    // Recalculate profile completeness
    await recalculateProfileCompleteness(guide.id);

    return NextResponse.json({ kyc: { kycStatus: kyc.kycStatus }, message: 'KYC details submitted' });
  } catch (error) {
    console.error('Error updating KYC:', error);
    return NextResponse.json({ error: 'Failed to submit KYC details' }, { status: 500 });
  }
}
