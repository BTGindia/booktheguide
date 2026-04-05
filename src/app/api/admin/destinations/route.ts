import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const stateId = searchParams.get('stateId') || '';

    const where: any = { isActive: true };
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { city: { name: { contains: query, mode: 'insensitive' } } },
        { city: { state: { name: { contains: query, mode: 'insensitive' } } } },
      ];
    }
    if (stateId) {
      where.city = { stateId };
    }

    const destinations = await prisma.destination.findMany({
      where,
      include: {
        city: { include: { state: { select: { id: true, name: true } } } },
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
      take: 100,
    });

    return NextResponse.json({ destinations });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch destinations' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only super admin can add destinations' }, { status: 403 });
    }

    const body = await request.json();
    const { name, cityId, description, altitude, bestMonths, openMonths, avoidMonths } = body;

    if (!name || !cityId) {
      return NextResponse.json({ error: 'Name and city are required' }, { status: 400 });
    }

    const destination = await prisma.destination.create({
      data: {
        name,
        cityId,
        description: description || null,
        altitude: altitude ? Number(altitude) : null,
        bestMonths: bestMonths || [],
        openMonths: openMonths || [],
        avoidMonths: avoidMonths || [],
      },
    });

    return NextResponse.json({ destination, message: 'Destination created' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create destination' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any).role;
    if (role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { id, name, cityId, description, altitude, bestMonths, openMonths, avoidMonths, coverImage, images, isActive } = body;

    if (!id) return NextResponse.json({ error: 'Destination ID is required' }, { status: 400 });

    const destination = await prisma.destination.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(cityId !== undefined && { cityId }),
        ...(description !== undefined && { description: description || null }),
        ...(altitude !== undefined && { altitude: altitude ? Number(altitude) : null }),
        ...(bestMonths !== undefined && { bestMonths }),
        ...(openMonths !== undefined && { openMonths }),
        ...(avoidMonths !== undefined && { avoidMonths }),
        ...(coverImage !== undefined && { coverImage: coverImage || null }),
        ...(images !== undefined && { images }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ destination, message: 'Destination updated' });
  } catch (error) {
    console.error('Update destination error:', error);
    return NextResponse.json({ error: 'Failed to update destination' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any).role;
    if (role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Destination ID is required' }, { status: 400 });

    const productCount = await prisma.product.count({ where: { destinationId: id } });
    if (productCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete destination: ${productCount} packages exist. Remove all packages first.` },
        { status: 409 }
      );
    }

    await prisma.destination.delete({ where: { id } });
    return NextResponse.json({ message: 'Destination deleted' });
  } catch (error) {
    console.error('Delete destination error:', error);
    return NextResponse.json({ error: 'Failed to delete destination' }, { status: 500 });
  }
}
