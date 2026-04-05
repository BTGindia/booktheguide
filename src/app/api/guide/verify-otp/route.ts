import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// STUB: Send OTP to phone number
// Replace this with your actual OTP API integration later
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'GUIDE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, phone, otp } = body;

    if (action === 'send') {
      // STUB: In production, call your OTP API here
      // e.g., await sendOtp(phone);
      if (!phone || !/^\d{10}$/.test(phone)) {
        return NextResponse.json({ error: 'Invalid phone number. Must be 10 digits.' }, { status: 400 });
      }

      // TODO: Replace with real OTP sending logic
      console.log(`[OTP STUB] Sending OTP to ${phone}`);

      return NextResponse.json({ message: 'OTP sent successfully', sent: true });
    }

    if (action === 'verify') {
      if (!otp || !phone) {
        return NextResponse.json({ error: 'Phone and OTP are required' }, { status: 400 });
      }

      // STUB: In production, verify OTP with your API
      // For now, accept "123456" as valid OTP for testing
      const isValid = otp === '123456';

      if (!isValid) {
        return NextResponse.json({ error: 'Invalid OTP. Please try again.' }, { status: 400 });
      }

      // Mark phone as verified
      const userId = (session.user as any).id;
      await prisma.guideProfile.update({
        where: { userId },
        data: { phoneVerified: true, phone },
      });

      return NextResponse.json({ message: 'Phone verified successfully', verified: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('OTP error:', error);
    return NextResponse.json({ error: 'OTP verification failed' }, { status: 500 });
  }
}
