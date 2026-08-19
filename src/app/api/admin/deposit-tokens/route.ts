import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { DepositToken, User } from '@/db/models';

// Check admin middleware
async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  
  await connectToDatabase();
  const user = await User.findById(session.user.id);
  if (!user || !['admin', 'super_admin'].includes(user.role)) return null;
  
  return user;
}

// GET - Fetch all deposit tokens
export async function GET() {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tokens = await DepositToken.find()
      .sort({ order: 1 })
      .lean();

    const stats = {
      total: tokens.length,
      active: tokens.filter(t => t.isActive).length,
      totalNetworks: tokens.reduce((sum, t) => sum + (t.networks?.length || 0), 0),
    };

    return NextResponse.json({ tokens, stats });
  } catch (error) {
    console.error('Error fetching deposit tokens:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create deposit token
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Check for duplicate symbol
    const existing = await DepositToken.findOne({ symbol: body.symbol });
    if (existing) {
      return NextResponse.json({ error: 'Token with this symbol already exists' }, { status: 400 });
    }

    const token = await DepositToken.create(body);
    return NextResponse.json({ token, message: 'Deposit token created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating deposit token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update deposit token
export async function PATCH(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tokenId, ...updates } = body;

    if (!tokenId) {
      return NextResponse.json({ error: 'Token ID required' }, { status: 400 });
    }

    // Check symbol uniqueness if updating
    if (updates.symbol) {
      const existing = await DepositToken.findOne({ 
        symbol: updates.symbol, 
        _id: { $ne: tokenId } 
      });
      if (existing) {
        return NextResponse.json({ error: 'Token with this symbol already exists' }, { status: 400 });
      }
    }

    const token = await DepositToken.findByIdAndUpdate(tokenId, updates, { new: true });
    if (!token) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    return NextResponse.json({ token, message: 'Deposit token updated successfully' });
  } catch (error) {
    console.error('Error updating deposit token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete deposit token
export async function DELETE(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('id');

    if (!tokenId) {
      return NextResponse.json({ error: 'Token ID required' }, { status: 400 });
    }

    const token = await DepositToken.findByIdAndDelete(tokenId);
    if (!token) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Deposit token deleted successfully' });
  } catch (error) {
    console.error('Error deleting deposit token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
