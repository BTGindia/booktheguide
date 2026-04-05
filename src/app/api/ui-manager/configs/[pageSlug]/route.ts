import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

const VALID_SORT_OPTIONS = [
  'highest_booked',
  'best_rated',
  'newest',
  'price_low',
  'price_high',
  'most_reviewed',
  'default',
] as const;

interface SectionOrder {
  sectionKey: string;
  visible: boolean;
  sortBy: string;
  limit: number;
}

interface FeaturedItem {
  section: string;
  itemId: string;
  position: number;
}

interface DisplaySetting {
  settingKey: string;
  settingValue: string;
}

interface ContentBlock {
  id: string;
  type: string;
  label: string;
  visible: boolean;
  content: Record<string, any>;
}

interface PageConfigPayload {
  sectionOrder?: SectionOrder[];
  featuredItems?: FeaturedItem[];
  displaySettings?: DisplaySetting[];
  contentBlocks?: ContentBlock[];
}

function validateConfig(config: PageConfigPayload): string | null {
  if (config.sectionOrder) {
    if (!Array.isArray(config.sectionOrder)) return 'sectionOrder must be an array';
    for (const s of config.sectionOrder) {
      if (!s.sectionKey || typeof s.sectionKey !== 'string') return 'Each section must have a sectionKey';
      if (typeof s.visible !== 'boolean') return 'visible must be a boolean';
      if (s.sortBy && !VALID_SORT_OPTIONS.includes(s.sortBy as any)) {
        return `Invalid sortBy value: ${s.sortBy}. Valid options: ${VALID_SORT_OPTIONS.join(', ')}`;
      }
      if (s.limit !== undefined && (typeof s.limit !== 'number' || s.limit < 1 || s.limit > 100)) {
        return 'limit must be a number between 1 and 100';
      }
    }
  }

  if (config.featuredItems) {
    if (!Array.isArray(config.featuredItems)) return 'featuredItems must be an array';
    for (const f of config.featuredItems) {
      if (!f.section || !f.itemId) return 'Each featured item must have section and itemId';
      if (typeof f.position !== 'number' || f.position < 0) return 'position must be a non-negative number';
    }
  }

  if (config.displaySettings) {
    if (!Array.isArray(config.displaySettings)) return 'displaySettings must be an array';
    for (const d of config.displaySettings) {
      if (!d.settingKey || !d.settingValue) return 'Each display setting must have settingKey and settingValue';
    }
  }

  return null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { pageSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== 'UI_MANAGER' && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const config = await prisma.pageConfig.findUnique({
      where: { pageSlug: params.pageSlug },
    });

    return NextResponse.json({
      config: config
        ? { pageSlug: config.pageSlug, ...config.config as object, updatedAt: config.updatedAt }
        : { pageSlug: params.pageSlug, sectionOrder: [], featuredItems: [], displaySettings: [] },
    });
  } catch (error) {
    console.error('Get page config error:', error);
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { pageSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    if (role !== 'UI_MANAGER' && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body: PageConfigPayload = await request.json();
    const validationError = validateConfig(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const userId = (session.user as any).id;

    const config = await prisma.pageConfig.upsert({
      where: { pageSlug: params.pageSlug },
      create: {
        pageSlug: params.pageSlug,
        config: body as any,
        updatedById: userId,
      },
      update: {
        config: body as any,
        updatedById: userId,
      },
    });

    return NextResponse.json({
      config: { pageSlug: config.pageSlug, ...config.config as object, updatedAt: config.updatedAt },
    });
  } catch (error) {
    console.error('Update page config error:', error);
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}
