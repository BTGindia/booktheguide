import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pincode = searchParams.get('pincode');

    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return NextResponse.json({ error: 'Invalid pincode. Must be 6 digits.' }, { status: 400 });
    }

    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
      next: { revalidate: 86400 }, // Cache for 24 hours
    });
    const data = await res.json();

    if (!data?.[0]?.PostOffice?.length) {
      return NextResponse.json({ error: 'Pincode not found' }, { status: 404 });
    }

    const postOffice = data[0].PostOffice[0];

    return NextResponse.json({
      district: postOffice.District,
      state: postOffice.State,
      country: postOffice.Country,
      postOffices: data[0].PostOffice.map((po: any) => ({
        name: po.Name,
        block: po.Block,
        district: po.District,
        state: po.State,
      })),
    });
  } catch (error) {
    console.error('Pincode lookup error:', error);
    return NextResponse.json({ error: 'Failed to lookup pincode' }, { status: 500 });
  }
}
