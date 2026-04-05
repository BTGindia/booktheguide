import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import slugify from 'slugify';

export const dynamic = 'force-dynamic';

// GET /api/admin/inspiration - List inspiration content
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const published = searchParams.get('published');

    const where: any = {};
    if (type) where.type = type;
    if (published === 'true') where.isPublished = true;
    if (published === 'false') where.isPublished = false;

    const content = await prisma.inspirationContent.findMany({
      where,
      include: {
        author: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error fetching inspiration content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/inspiration - Create inspiration content
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = (session.user as any).role;
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only Super Admin can create inspiration content' }, { status: 403 });
    }

    const body = await request.json();
    const { title, type, content, embedUrl, thumbnail, excerpt, tags, destinations, activityTypes, isPublished } = body;

    if (!title || !type) {
      return NextResponse.json({ error: 'Title and type are required' }, { status: 400 });
    }

    if (!['BLOG', 'VIDEO', 'PODCAST'].includes(type)) {
      return NextResponse.json({ error: 'Type must be BLOG, VIDEO, or PODCAST' }, { status: 400 });
    }

    const slug = slugify(title, { lower: true, strict: true }) + '-' + Date.now().toString(36);

    const inspiration = await prisma.inspirationContent.create({
      data: {
        title,
        slug,
        type,
        content: content || null,
        embedUrl: embedUrl || null,
        thumbnail: thumbnail || null,
        excerpt: excerpt || null,
        tags: tags || [],
        destinations: destinations || [],
        activityTypes: activityTypes || [],
        isPublished: isPublished || false,
        publishedAt: isPublished ? new Date() : null,
        authorId: (session.user as any).id,
      },
    });

    return NextResponse.json({ inspiration }, { status: 201 });
  } catch (error) {
    console.error('Error creating inspiration content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
