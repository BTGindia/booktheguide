import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only super admin can manage commission' }, { status: 403 });
    }

    const [states, categoryCommissions, categories] = await Promise.all([
      prisma.indianState.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, code: true, commissionPercent: true },
      }),
      prisma.categoryCommission.findMany({
        include: {
          state: { select: { id: true, name: true } },
          category: { select: { id: true, slug: true, label: true } },
          subCategory: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }).catch(() => []), // table might not exist yet
      prisma.experienceCategory.findMany({
        include: {
          subCategories: {
            orderBy: { sortOrder: 'asc' },
            select: { id: true, name: true, slug: true, isEnabled: true },
          },
        },
        orderBy: { sortOrder: 'asc' },
      }).catch(() => []),
    ]);

    return NextResponse.json({ states, categoryCommissions, categories });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch commission data' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only super admin can set commission' }, { status: 403 });
    }

    const body = await request.json();
    const { stateId, commissionPercent, categoryId, subCategoryId } = body;

    if (!stateId) {
      return NextResponse.json({ error: 'State ID required' }, { status: 400 });
    }

    const commission = Number(commissionPercent);
    if (isNaN(commission) || commission < 0 || commission > 50) {
      return NextResponse.json({ error: 'Commission must be between 0 and 50%' }, { status: 400 });
    }

    // If categoryId or subCategoryId provided, use CategoryCommission table
    if (categoryId || subCategoryId) {
      const result = await prisma.categoryCommission.upsert({
        where: {
          stateId_categoryId_subCategoryId: {
            stateId,
            categoryId: categoryId || null,
            subCategoryId: subCategoryId || null,
          },
        },
        create: {
          stateId,
          categoryId: categoryId || null,
          subCategoryId: subCategoryId || null,
          commissionPercent: commission,
        },
        update: {
          commissionPercent: commission,
        },
        include: {
          state: { select: { name: true } },
          category: { select: { label: true } },
          subCategory: { select: { name: true } },
        },
      });

      const label = [
        result.state.name,
        result.category?.label,
        result.subCategory?.name,
      ].filter(Boolean).join(' → ');

      return NextResponse.json({
        message: `Commission for ${label} updated to ${commission}%`,
        commission: result,
      });
    }

    // Default: update state-level commission
    const updated = await prisma.indianState.update({
      where: { id: stateId },
      data: { commissionPercent: commission },
    });

    return NextResponse.json({
      message: `Commission for ${updated.name} updated to ${commission}%`,
      state: updated,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update commission' }, { status: 500 });
  }
}

// DELETE /api/admin/commission — remove a category-level commission override
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if ((session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await prisma.categoryCommission.delete({ where: { id } });
    return NextResponse.json({ message: 'Commission override removed' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete commission' }, { status: 500 });
  }
}
