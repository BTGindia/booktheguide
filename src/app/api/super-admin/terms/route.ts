import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const terms = await prisma.guideTermsConditions.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ terms });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch terms' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, state, guideType } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const term = await prisma.guideTermsConditions.create({
      data: {
        title,
        content,
        state: state || null,
        guideType: guideType || null,
      },
    });

    return NextResponse.json({ term, message: 'Terms created successfully' });
  } catch (error) {
    console.error('Create terms error:', error);
    return NextResponse.json({ error: 'Failed to create terms' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, content, state, guideType, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const term = await prisma.guideTermsConditions.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(state !== undefined && { state: state || null }),
        ...(guideType !== undefined && { guideType: guideType || null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ term, message: 'Terms updated successfully' });
  } catch (error) {
    console.error('Update terms error:', error);
    return NextResponse.json({ error: 'Failed to update terms' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.guideTermsConditions.delete({ where: { id } });

    return NextResponse.json({ message: 'Terms deleted successfully' });
  } catch (error) {
    console.error('Delete terms error:', error);
    return NextResponse.json({ error: 'Failed to delete terms' }, { status: 500 });
  }
}
