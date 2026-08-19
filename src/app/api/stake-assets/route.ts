import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/db/connection';
import { StakeAsset } from '@/db/models';

// GET - Fetch active stake assets (public)
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured');
    const symbol = searchParams.get('symbol');

    // If fetching single asset by symbol
    if (symbol) {
      const asset = await StakeAsset.findOne({ 
        symbol: symbol.toUpperCase(), 
        isActive: true 
      }).lean();
      
      if (!asset) {
        return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
      }
      
      return NextResponse.json({ asset });
    }

    // Build query for listing
    const query: Record<string, unknown> = { isActive: true };
    if (featured === 'true') query.isFeatured = true;

    const assets = await StakeAsset.find(query)
      .select('-__v')
      .sort({ isFeatured: -1, sortOrder: 1 })
      .lean();

    return NextResponse.json({ assets });
  } catch (error) {
    console.error('Error fetching stake assets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
