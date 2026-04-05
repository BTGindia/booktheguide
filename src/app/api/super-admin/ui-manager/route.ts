import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const uiManager = await prisma.user.findFirst({
      where: { role: 'UI_MANAGER' },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    return NextResponse.json({ uiManager });
  } catch (error) {
    console.error('Get UI Manager error:', error);
    return NextResponse.json({ error: 'Failed to fetch UI Manager' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Check if a UI_MANAGER already exists
    const existing = await prisma.user.findFirst({
      where: { role: 'UI_MANAGER' },
    });

    if (existing) {
      return NextResponse.json({ error: 'A UI Manager already exists. Use PUT to update.' }, { status: 409 });
    }

    // Check if email is already in use
    const emailExists = await prisma.user.findUnique({ where: { email } });
    if (emailExists) {
      return NextResponse.json({ error: 'Email is already in use' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const uiManager = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'UI_MANAGER',
      },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    return NextResponse.json({ uiManager }, { status: 201 });
  } catch (error) {
    console.error('Create UI Manager error:', error);
    return NextResponse.json({ error: 'Failed to create UI Manager' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password } = body;

    const existing = await prisma.user.findFirst({
      where: { role: 'UI_MANAGER' },
    });

    if (!existing) {
      return NextResponse.json({ error: 'No UI Manager exists. Use POST to create.' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (email) {
      // Check email uniqueness (exclude current user)
      const emailExists = await prisma.user.findFirst({
        where: { email, id: { not: existing.id } },
      });
      if (emailExists) {
        return NextResponse.json({ error: 'Email is already in use' }, { status: 409 });
      }
      updateData.email = email;
    }
    if (password) {
      if (typeof password !== 'string' || password.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(password, 12);
    }

    const uiManager = await prisma.user.update({
      where: { id: existing.id },
      data: updateData,
      select: { id: true, name: true, email: true, createdAt: true },
    });

    return NextResponse.json({ uiManager });
  } catch (error) {
    console.error('Update UI Manager error:', error);
    return NextResponse.json({ error: 'Failed to update UI Manager' }, { status: 500 });
  }
}
