import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';

    if (q.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    // Search states, cities, and destinations in parallel
    // Only return entities that have at least one active, approved package
    const activeProductFilter = {
      some: { status: 'APPROVED' as const, isActive: true },
    };

    const [states, cities, destinations] = await Promise.all([
      prisma.indianState.findMany({
        where: {
          isActive: true,
          name: { contains: q, mode: 'insensitive' },
          cities: {
            some: {
              destinations: {
                some: { products: activeProductFilter },
              },
            },
          },
        },
        take: 3,
        orderBy: { name: 'asc' },
      }),
      prisma.city.findMany({
        where: {
          isActive: true,
          name: { contains: q, mode: 'insensitive' },
          state: { isActive: true },
          destinations: {
            some: { products: activeProductFilter },
          },
        },
        include: { state: { select: { name: true } } },
        take: 3,
        orderBy: { name: 'asc' },
      }),
      prisma.destination.findMany({
        where: {
          isActive: true,
          products: activeProductFilter,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { city: { name: { contains: q, mode: 'insensitive' } } },
            { city: { state: { name: { contains: q, mode: 'insensitive' } } } },
          ],
        },
        include: {
          city: { include: { state: { select: { name: true } } } },
        },
        take: 6,
        orderBy: { name: 'asc' },
      }),
    ]);

    const suggestions: Array<{
      id: string;
      name: string;
      city: string;
      state: string;
      label: string;
      type: 'state' | 'city' | 'destination';
    }> = [];

    // 1. States first
    for (const s of states) {
      suggestions.push({
        id: s.id,
        name: s.name,
        city: '',
        state: s.name,
        label: s.name,
        type: 'state',
      });
    }

    // 2. Cities second
    for (const c of cities) {
      // Avoid duplicating if the city name matches a state already shown
      if (!suggestions.some((s) => s.name === c.name && s.type === 'state')) {
        suggestions.push({
          id: c.id,
          name: c.name,
          city: c.name,
          state: c.state.name,
          label: `${c.name}, ${c.state.name}`,
          type: 'city',
        });
      }
    }

    // 3. Destinations last
    for (const d of destinations) {
      // Avoid duplicating city/state entries
      if (!suggestions.some((s) => s.name === d.name)) {
        suggestions.push({
          id: d.id,
          name: d.name,
          city: d.city.name,
          state: d.city.state.name,
          label: `${d.name}, ${d.city.state.name}`,
          type: 'destination',
        });
      }
    }

    return NextResponse.json({ suggestions: suggestions.slice(0, 8) });
  } catch (error) {
    return NextResponse.json({ suggestions: [] });
  }
}
