import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/admin/manage/cities — Create a new city
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any).role;
    if (role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { name, stateId } = body;

    if (!name || !stateId) {
      return NextResponse.json({ error: 'Name and stateId are required' }, { status: 400 });
    }

    // Check for duplicate within same state
    const existing = await prisma.city.findUnique({
      where: { name_stateId: { name: name.trim(), stateId } },
    });
    if (existing) {
      return NextResponse.json({ error: 'A city with this name already exists in this state' }, { status: 409 });
    }

    const city = await prisma.city.create({
      data: {
        name: name.trim(),
        stateId,
      },
    });

    return NextResponse.json({ city, message: 'City created' });
  } catch (error) {
    console.error('Create city error:', error);
    return NextResponse.json({ error: 'Failed to create city' }, { status: 500 });
  }
}

// PUT /api/admin/manage/cities — Update a city
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any).role;
    if (role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { id, name, isActive } = body;

    if (!id) return NextResponse.json({ error: 'City ID is required' }, { status: 400 });

    const city = await prisma.city.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ city, message: 'City updated' });
  } catch (error) {
    console.error('Update city error:', error);
    return NextResponse.json({ error: 'Failed to update city' }, { status: 500 });
  }
}

// DELETE /api/admin/manage/cities — Delete a city (only if no children)
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any).role;
    if (role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'City ID is required' }, { status: 400 });

    const destCount = await prisma.destination.count({ where: { cityId: id } });
    if (destCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete city: ${destCount} destinations exist. Remove all destinations first.` },
        { status: 409 }
      );
    }

    await prisma.city.delete({ where: { id } });
    return NextResponse.json({ message: 'City deleted' });
  } catch (error) {
    console.error('Delete city error:', error);
    return NextResponse.json({ error: 'Failed to delete city' }, { status: 500 });
  }
}
