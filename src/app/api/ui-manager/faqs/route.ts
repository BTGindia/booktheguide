import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/ui-manager/faqs — List FAQs with optional filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== 'UI_MANAGER' && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const entityId = searchParams.get('entityId');

    const where: any = {};
    if (category) where.category = category;
    if (entityId) where.entityId = entityId;

    const faqs = await prisma.fAQ.findMany({
      where,
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });

    return NextResponse.json({ faqs });
  } catch (error) {
    console.error('FAQ fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch FAQs' }, { status: 500 });
  }
}

// POST /api/ui-manager/faqs — Create a new FAQ
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== 'UI_MANAGER' && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { question, answer, category, entityId, entityName, sortOrder } = body;

    if (!question || !answer || !category) {
      return NextResponse.json({ error: 'question, answer, and category are required' }, { status: 400 });
    }

    const userId = (session.user as any).id;

    const faq = await prisma.fAQ.create({
      data: {
        question,
        answer,
        category,
        entityId: entityId || null,
        entityName: entityName || null,
        sortOrder: sortOrder || 0,
        createdById: userId,
      },
    });

    return NextResponse.json({ faq });
  } catch (error) {
    console.error('FAQ create error:', error);
    return NextResponse.json({ error: 'Failed to create FAQ' }, { status: 500 });
  }
}

// PUT /api/ui-manager/faqs — Update an existing FAQ
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== 'UI_MANAGER' && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, question, answer, category, entityId, entityName, sortOrder, isPublished } = body;

    if (!id) {
      return NextResponse.json({ error: 'FAQ id is required' }, { status: 400 });
    }

    const faq = await prisma.fAQ.update({
      where: { id },
      data: {
        ...(question !== undefined && { question }),
        ...(answer !== undefined && { answer }),
        ...(category !== undefined && { category }),
        ...(entityId !== undefined && { entityId }),
        ...(entityName !== undefined && { entityName }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isPublished !== undefined && { isPublished }),
      },
    });

    return NextResponse.json({ faq });
  } catch (error) {
    console.error('FAQ update error:', error);
    return NextResponse.json({ error: 'Failed to update FAQ' }, { status: 500 });
  }
}

// DELETE /api/ui-manager/faqs — Delete a FAQ
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
      return NextResponse.json({ error: 'FAQ id is required' }, { status: 400 });
    }

    await prisma.fAQ.delete({ where: { id } });

    return NextResponse.json({ message: 'FAQ deleted successfully' });
  } catch (error) {
    console.error('FAQ delete error:', error);
    return NextResponse.json({ error: 'Failed to delete FAQ' }, { status: 500 });
  }
}
