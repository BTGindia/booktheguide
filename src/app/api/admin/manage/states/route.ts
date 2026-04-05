import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/admin/manage/states — Create a new state
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any).role;
    if (role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { name, code, isNorthIndia, commissionPercent } = body;

    if (!name || !code) {
      return NextResponse.json({ error: 'Name and code are required' }, { status: 400 });
    }
    if (code.length !== 2) {
      return NextResponse.json({ error: 'State code must be exactly 2 characters' }, { status: 400 });
    }

    const existing = await prisma.indianState.findFirst({
      where: { OR: [{ name: { equals: name, mode: 'insensitive' } }, { code: code.toUpperCase() }] },
    });
    if (existing) {
      return NextResponse.json({ error: 'A state with this name or code already exists' }, { status: 409 });
    }

    const state = await prisma.indianState.create({
      data: {
        name: name.trim(),
        code: code.toUpperCase().trim(),
        isNorthIndia: isNorthIndia ?? false,
        commissionPercent: commissionPercent ? Number(commissionPercent) : 15,
      },
    });

    return NextResponse.json({ state, message: 'State created' });
  } catch (error) {
    console.error('Create state error:', error);
    return NextResponse.json({ error: 'Failed to create state' }, { status: 500 });
  }
}

// PUT /api/admin/manage/states — Update a state
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any).role;
    if (role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { id, name, code, isNorthIndia, commissionPercent, isActive } = body;

    if (!id) return NextResponse.json({ error: 'State ID is required' }, { status: 400 });

    const state = await prisma.indianState.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(code !== undefined && { code: code.toUpperCase().trim() }),
        ...(isNorthIndia !== undefined && { isNorthIndia }),
        ...(commissionPercent !== undefined && { commissionPercent: Number(commissionPercent) }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ state, message: 'State updated' });
  } catch (error) {
    console.error('Update state error:', error);
    return NextResponse.json({ error: 'Failed to update state' }, { status: 500 });
  }
}

// DELETE /api/admin/manage/states — Delete a state (only if no children)
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any).role;
    if (role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'State ID is required' }, { status: 400 });

    // Check for children
    const cityCount = await prisma.city.count({ where: { stateId: id } });
    if (cityCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete state: ${cityCount} cities exist. Remove all cities first.` },
        { status: 409 }
      );
    }

    const regionCount = await prisma.region.count({ where: { stateId: id } });
    if (regionCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete state: ${regionCount} regions exist. Remove all regions first.` },
        { status: 409 }
      );
    }

    await prisma.indianState.delete({ where: { id } });
    return NextResponse.json({ message: 'State deleted' });
  } catch (error) {
    console.error('Delete state error:', error);
    return NextResponse.json({ error: 'Failed to delete state' }, { status: 500 });
  }
}
