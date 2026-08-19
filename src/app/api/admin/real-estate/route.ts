import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { RealEstateProperty, User } from '@/db/models';

// Check admin middleware
async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  
  await connectToDatabase();
  const user = await User.findById(session.user.id);
  if (!user || !['admin', 'super_admin'].includes(user.role)) return null;
  
  return user;
}

// GET - Fetch all properties
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const strategy = searchParams.get('strategy');
    const status = searchParams.get('status');

    const query: Record<string, unknown> = {};
    if (strategy && strategy !== 'all') query.strategy = strategy;
    if (status && status !== 'all') query['breakdown.status'] = status;

    const properties = await RealEstateProperty.find(query)
      .sort({ sortOrder: 1 })
      .lean();

    const stats = {
      total: properties.length,
      active: properties.filter(p => p.isActive).length,
      totalRaised: properties.reduce((sum, p) => sum + (p.raisedAmount || 0), 0),
      totalInvestors: properties.reduce((sum, p) => sum + (p.investors || 0), 0),
    };

    return NextResponse.json({ properties, stats });
  } catch (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create property
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const property = await RealEstateProperty.create(body);
    return NextResponse.json({ property, message: 'Property created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating property:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update property
export async function PATCH(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { propertyId, ...updates } = body;

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID required' }, { status: 400 });
    }

    const property = await RealEstateProperty.findByIdAndUpdate(propertyId, updates, { new: true });
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json({ property, message: 'Property updated successfully' });
  } catch (error) {
    console.error('Error updating property:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete property
export async function DELETE(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('id');

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID required' }, { status: 400 });
    }

    const property = await RealEstateProperty.findByIdAndDelete(propertyId);
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Error deleting property:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
