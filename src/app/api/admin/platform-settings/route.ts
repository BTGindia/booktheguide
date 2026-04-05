import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/admin/platform-settings — fetch platform settings (public-safe subset or all for admin)
export async function GET() {
  try {
    const settings = await prisma.platformSettings.findMany();
    const map: Record<string, string> = {};
    settings.forEach((s) => { map[s.key] = s.value; });
    return NextResponse.json({ settings: map });
  } catch (error) {
    console.error('Platform settings GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// PUT /api/admin/platform-settings — update a platform setting (SUPER_ADMIN only)
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if ((session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { key, value, description } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'key and value are required' }, { status: 400 });
    }

    const allowedKeys = ['logo_url', 'nav_config', 'site_name'];
    if (!allowedKeys.includes(key)) {
      return NextResponse.json({ error: `Key "${key}" is not an allowed setting` }, { status: 400 });
    }

    const setting = await prisma.platformSettings.upsert({
      where: { key },
      create: { key, value: String(value), description: description || null },
      update: { value: String(value), description: description || null },
    });

    return NextResponse.json({ message: 'Setting updated', setting });
  } catch (error) {
    console.error('Platform settings PUT error:', error);
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
  }
}
