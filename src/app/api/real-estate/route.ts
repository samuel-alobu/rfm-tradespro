import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/db/connection';
import { RealEstateProperty } from '@/db/models';

// GET - Fetch real estate properties (public)
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const strategy = searchParams.get('strategy');
    const featured = searchParams.get('featured');
    const slug = searchParams.get('slug');
    const status = searchParams.get('status'); // 'all' | 'active' | 'inactive'

    // If fetching single property by slug
    if (slug) {
      const property = await RealEstateProperty.findOne({ slug }).lean();
      
      if (!property) {
        return NextResponse.json({ error: 'Property not found' }, { status: 404 });
      }
      
      return NextResponse.json({ property });
    }

    // Build query for listing
    const query: Record<string, unknown> = {};
    
    // Status filter: default to active only, but support 'all' or 'inactive'
    if (status === 'all') {
      // No filter - return all properties
    } else if (status === 'inactive') {
      query.isActive = false;
    } else {
      // Default: active only
      query.isActive = true;
    }
    
    if (strategy && strategy !== 'all') query.strategy = strategy;
    if (featured === 'true') query.isFeatured = true;

    const properties = await RealEstateProperty.find(query)
      .select('-__v')
      .sort({ isFeatured: -1, sortOrder: 1 })
      .lean();

    return NextResponse.json({ properties });
  } catch (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
