import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { StakeAsset, User } from '@/db/models';

// Check admin middleware
async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  
  await connectToDatabase();
  const user = await User.findById(session.user.id);
  if (!user || !['admin', 'super_admin'].includes(user.role)) return null;
  
  return user;
}

// GET - Fetch all stake assets
export async function GET() {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assets = await StakeAsset.find()
      .sort({ sortOrder: 1 })
      .lean();

    const stats = {
      total: assets.length,
      active: assets.filter(a => a.isActive).length,
      totalStakers: assets.reduce((sum, a) => sum + (a.totalStakers || 0), 0),
      featured: assets.filter(a => a.isFeatured).length,
    };

    return NextResponse.json({ assets, stats });
  } catch (error) {
    console.error('Error fetching stake assets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create stake asset
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Check for duplicate symbol
    const existing = await StakeAsset.findOne({ symbol: body.symbol });
    if (existing) {
      return NextResponse.json({ error: 'Asset with this symbol already exists' }, { status: 400 });
    }

    const asset = await StakeAsset.create(body);
    return NextResponse.json({ asset, message: 'Stake asset created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating stake asset:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update stake asset
export async function PATCH(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { assetId, ...updates } = body;

    if (!assetId) {
      return NextResponse.json({ error: 'Asset ID required' }, { status: 400 });
    }

    // Check symbol uniqueness if updating
    if (updates.symbol) {
      const existing = await StakeAsset.findOne({ 
        symbol: updates.symbol, 
        _id: { $ne: assetId } 
      });
      if (existing) {
        return NextResponse.json({ error: 'Asset with this symbol already exists' }, { status: 400 });
      }
    }

    const asset = await StakeAsset.findByIdAndUpdate(assetId, updates, { new: true });
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    return NextResponse.json({ asset, message: 'Stake asset updated successfully' });
  } catch (error) {
    console.error('Error updating stake asset:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete stake asset
export async function DELETE(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('id');

    if (!assetId) {
      return NextResponse.json({ error: 'Asset ID required' }, { status: 400 });
    }

    const asset = await StakeAsset.findByIdAndDelete(assetId);
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Stake asset deleted successfully' });
  } catch (error) {
    console.error('Error deleting stake asset:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
