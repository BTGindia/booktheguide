import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// GET /api/ui-manager/blogs â€” List all blogs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== 'UI_MANAGER' && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const blogs = await prisma.inspirationContent.findMany({
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { name: true, email: true } } },
    });

    return NextResponse.json({ blogs });
  } catch (error) {
    console.error('Blog fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch blogs' }, { status: 500 });
  }
}

// POST /api/ui-manager/blogs â€” Create a new blog
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== 'UI_MANAGER' && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, type, content, embedUrl, thumbnail, excerpt, tags, destinations, activityTypes, isPublished } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const userId = (session.user as any).id;
    let slug = generateSlug(title);
    
    // Ensure unique slug
    const existing = await prisma.inspirationContent.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const blog = await prisma.inspirationContent.create({
      data: {
        title,
        slug,
        type: type || 'BLOG',
        content: content || '',
        embedUrl: embedUrl || null,
        thumbnail: thumbnail || null,
        excerpt: excerpt || null,
        tags: tags || [],
        destinations: destinations || [],
        activityTypes: activityTypes || [],
        isPublished: isPublished || false,
        publishedAt: isPublished ? new Date() : null,
        authorId: userId,
      },
    });

    return NextResponse.json({ blog });
  } catch (error) {
    console.error('Blog create error:', error);
    return NextResponse.json({ error: 'Failed to create blog' }, { status: 500 });
  }
}

// PUT /api/ui-manager/blogs â€” Update an existing blog
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== 'UI_MANAGER' && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, title, content, embedUrl, thumbnail, excerpt, tags, destinations, activityTypes, isPublished } = body;

    if (!id) {
      return NextResponse.json({ error: 'Blog id is required' }, { status: 400 });
    }

    const existingBlog = await prisma.inspirationContent.findUnique({ where: { id } });
    if (!existingBlog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    const blog = await prisma.inspirationContent.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(embedUrl !== undefined && { embedUrl }),
        ...(thumbnail !== undefined && { thumbnail }),
        ...(excerpt !== undefined && { excerpt }),
        ...(tags !== undefined && { tags }),
        ...(destinations !== undefined && { destinations }),
        ...(activityTypes !== undefined && { activityTypes }),
        ...(isPublished !== undefined && { 
          isPublished,
          publishedAt: isPublished && !existingBlog.publishedAt ? new Date() : existingBlog.publishedAt,
        }),
      },
    });

    return NextResponse.json({ blog });
  } catch (error) {
    console.error('Blog update error:', error);
    return NextResponse.json({ error: 'Failed to update blog' }, { status: 500 });
  }
}

// DELETE /api/ui-manager/blogs â€” Delete a blog
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== 'UI_MANAGER' && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Blog id is required' }, { status: 400 });
    }

    await prisma.inspirationContent.delete({ where: { id } });

    return NextResponse.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Blog delete error:', error);
    return NextResponse.json({ error: 'Failed to delete blog' }, { status: 500 });
  }
}
