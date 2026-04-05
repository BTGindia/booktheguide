import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/admin/inspiration/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const content = await prisma.inspirationContent.findUnique({
      where: { id: params.id },
      include: {
        author: { select: { name: true, email: true } },
      },
    });

    if (!content) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error fetching inspiration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/inspiration/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any).role;
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only Super Admin can edit' }, { status: 403 });
    }

    const body = await request.json();
    const existing = await prisma.inspirationContent.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const wasPublished = existing.isPublished;
    const nowPublished = body.isPublished ?? existing.isPublished;

    const content = await prisma.inspirationContent.update({
      where: { id: params.id },
      data: {
        title: body.title ?? existing.title,
        type: body.type ?? existing.type,
        content: body.content !== undefined ? body.content : existing.content,
        embedUrl: body.embedUrl !== undefined ? body.embedUrl : existing.embedUrl,
        thumbnail: body.thumbnail !== undefined ? body.thumbnail : existing.thumbnail,
        excerpt: body.excerpt !== undefined ? body.excerpt : existing.excerpt,
        tags: body.tags ?? existing.tags,
        destinations: body.destinations ?? existing.destinations,
        activityTypes: body.activityTypes ?? existing.activityTypes,
        isPublished: nowPublished,
        publishedAt: !wasPublished && nowPublished ? new Date() : existing.publishedAt,
      },
    });

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error updating inspiration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/inspiration/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any).role;
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only Super Admin can delete' }, { status: 403 });
    }

    await prisma.inspirationContent.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting inspiration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
