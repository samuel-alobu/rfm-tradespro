import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/db/connection';
import { Signal } from '@/db/models';

// GET - Fetch active signals for users
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const market = searchParams.get('market');

    // Only fetch active signals for users
    const query: Record<string, unknown> = { isActive: true };
    if (market && market !== 'all') query.market = market;

    const signals = await Signal.find(query)
      .select('_id title price strength amount durationDays isActive')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ signals });
  } catch (error) {
    console.error('Error fetching signals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
