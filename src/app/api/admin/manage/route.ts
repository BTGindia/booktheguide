import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only super admins can create admin accounts' }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, phone, managedStateIds, accountType } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Determine if creating a Guide Manager, UI Manager, or State Admin
    const isGuideManager = accountType === 'GUIDE_MANAGER';
    const isUIManager = accountType === 'UI_MANAGER';

    if (!isGuideManager && !isUIManager) {
      // Enforce: one admin per state max
      if (managedStateIds && managedStateIds.length > 1) {
        return NextResponse.json({ error: 'Each admin can manage only one state' }, { status: 400 });
      }

      if (managedStateIds && managedStateIds.length === 1) {
        const existingAdmin = await prisma.adminProfile.findFirst({
          where: {
            managedStates: { some: { id: managedStateIds[0] } },
          },
          include: { user: { select: { name: true } } },
        });
        if (existingAdmin) {
          const stateName = (await prisma.indianState.findUnique({ where: { id: managedStateIds[0] } }))?.name || 'that state';
          return NextResponse.json(
            { error: `${stateName} already has an admin: ${existingAdmin.user.name}. One admin per state only.` },
            { status: 409 }
          );
        }
      }
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    if (isGuideManager) {
      // Create Guide Manager
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          phone: phone || null,
          role: 'GUIDE_MANAGER',
          emailVerified: new Date(),
        },
      });

      await prisma.guideManagerProfile.create({
        data: {
          userId: user.id,
          designation: 'Guide Manager',
        },
      });

      return NextResponse.json({
        message: 'Guide Manager account created successfully',
        admin: { id: user.id, name: user.name, email: user.email, role: 'GUIDE_MANAGER' },
      });
    }

    if (isUIManager) {
      // Create UI Manager
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          phone: phone || null,
          role: 'UI_MANAGER',
          emailVerified: new Date(),
        },
      });

      return NextResponse.json({
        message: 'UI Manager account created successfully',
        admin: { id: user.id, name: user.name, email: user.email, role: 'UI_MANAGER' },
      });
    }

    // Create user with ADMIN role (State Admin)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        role: 'ADMIN',
        emailVerified: new Date(),
      },
    });

    // Create admin profile with managed states
    await prisma.adminProfile.create({
      data: {
        userId: user.id,
        managedStates: managedStateIds?.length
          ? { connect: managedStateIds.map((id: string) => ({ id })) }
          : undefined,
      },
    });

    return NextResponse.json({
      message: 'Admin account created successfully',
      admin: { id: user.id, name: user.name, email: user.email, role: 'ADMIN' },
    });
  } catch (error: any) {
    console.error('Create admin error:', error);
    return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'GUIDE_MANAGER', 'UI_MANAGER'] } },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        adminProfile: {
          select: {
            managedStates: { select: { id: true, name: true } },
          },
        },
        guideManagerProfile: {
          select: { designation: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ admins });
  } catch (error: any) {
    console.error('List admins error:', error);
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
  }
}

// DELETE /api/admin/manage — Delete an admin or guide manager (super admin only)
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only super admins can delete accounts' }, { status: 403 });
    }

    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role === 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Cannot delete the super admin account' }, { status: 403 });
    }

    // Delete associated profiles first
    if (user.role === 'ADMIN') {
      await prisma.adminProfile.deleteMany({ where: { userId } });
    }
    if (user.role === 'GUIDE_MANAGER') {
      await prisma.guideManagerProfile.deleteMany({ where: { userId } });
    }

    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ message: 'Account deleted successfully' });
  } catch (error: any) {
    console.error('Delete admin error:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}

// PATCH /api/admin/manage — Toggle active status (super admin only)
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only super admins can update accounts' }, { status: 403 });
    }

    const { userId, isActive } = await req.json();
    if (!userId || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'userId and isActive are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role === 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Cannot modify the super admin account' }, { status: 403 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });

    return NextResponse.json({ message: isActive ? 'Account activated' : 'Account deactivated' });
  } catch (error: any) {
    console.error('Update admin status error:', error);
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
  }
}
