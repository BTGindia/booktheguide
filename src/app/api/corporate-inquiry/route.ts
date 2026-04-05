import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    // Rate limit: 3 inquiries per minute per IP
    const ip = getClientIp(request);
    if (!rateLimit(ip, 3, 60_000)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      organizationType, organizationName, contactName,
      officialEmail, phone, groupSize, preferredStateId,
      approxDays, additionalNotes,
    } = body;

    if (!organizationName || !contactName || !officialEmail || !phone || !groupSize || !approxDays) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const inquiry = await prisma.corporateTripInquiry.create({
      data: {
        organizationType: organizationType || 'corporate',
        organizationName,
        contactName,
        officialEmail,
        phone,
        groupSize: Number(groupSize),
        preferredStateId: preferredStateId || null,
        approxDays: Number(approxDays),
        additionalNotes: additionalNotes || null,
      },
    });

    return NextResponse.json({ inquiry, message: 'Inquiry submitted successfully' });
  } catch (error) {
    console.error('Corporate inquiry error:', error);
    return NextResponse.json({ error: 'Failed to submit inquiry' }, { status: 500 });
  }
}
