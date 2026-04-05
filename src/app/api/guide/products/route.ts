import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import slugify from 'slugify';

export const dynamic = 'force-dynamic';

// GET /api/guide/products - List guide's products
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const guide = await prisma.guideProfile.findUnique({
      where: { userId },
    });

    if (!guide) {
      return NextResponse.json({ error: 'Guide profile not found' }, { status: 404 });
    }

    const products = await prisma.product.findMany({
      where: { guideId: guide.id },
      include: {
        destination: { include: { city: { include: { state: true } } } },
        fixedDepartures: {
          where: { isActive: true },
          orderBy: { startDate: 'asc' },
        },
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST /api/guide/products - Create a new product
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const guide = await prisma.guideProfile.findUnique({
      where: { userId },
    });

    if (!guide) {
      return NextResponse.json({ error: 'Guide profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      title, description, destinationId,
      durationDays, durationNights,
      packageCategory, activityType, difficultyLevel,
      itinerary, inclusions, exclusions,
      highlights, coverImage, images,
      minAge, maxAge, isPetFriendly,
      cancellationPolicy, saveAsDraft,
    } = body;

    // Validate required fields (more lenient for drafts)
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    
    if (!saveAsDraft) {
      // Full validation for submission
      if (!description || !destinationId || !durationDays || !packageCategory) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      // Check if category is enabled
      if (packageCategory) {
        try {
          const dbCat = await prisma.experienceCategory.findUnique({
            where: { slug: packageCategory },
            select: { isEnabled: true },
          });
          if (dbCat && !dbCat.isEnabled) {
            return NextResponse.json({ error: 'This experience category is currently disabled by admin' }, { status: 400 });
          }
        } catch {
          // Table might not exist â€” allow
        }
      }
    }

    // Generate slug
    let slug = slugify(title, { lower: true, strict: true });
    const existing = await prisma.product.findFirst({
      where: { slug: { startsWith: slug } },
    });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const product = await prisma.product.create({
      data: {
        guideId: guide.id,
        title,
        slug,
        description,
        destinationId,
        durationDays,
        durationNights: durationNights || durationDays - 1,
        packageCategory: packageCategory || 'TOURIST_GUIDES',
        activityType: activityType || 'City Tour',
        difficultyLevel: difficultyLevel || 'MODERATE',
        isPetFriendly: isPetFriendly || false,
        itinerary: itinerary || [],
        inclusions: inclusions || [],
        exclusions: exclusions || [],
        highlights: highlights || [],
        cancellationPolicy: cancellationPolicy || [],
        minAge: minAge ? parseInt(minAge) : null,
        maxAge: maxAge ? parseInt(maxAge) : null,
        coverImage: coverImage || '',
        images: images || [],
        status: saveAsDraft ? 'DRAFT' : 'PENDING_REVIEW',
      },
    });

    return NextResponse.json({ 
      product, 
      message: saveAsDraft ? 'Draft saved' : 'Product submitted for review' 
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
