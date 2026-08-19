import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { User, ColdStorage } from '@/db/models';

// GET - Fetch all cold storage entries (admin only)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Verify admin role
    const adminUser = await User.findById(session.user.id).select('role').lean();
    if (!adminUser || !['admin', 'superadmin', 'super_admin'].includes(adminUser.role || '')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch all active cold storage entries with user info
    const coldStorageEntries = await ColdStorage.aggregate([
      { $match: { status: 'active' } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          userId: 1,
          symbol: 1,
          name: 1,
          type: 1,
          icon: 1,
          quantity: 1,
          purchasePrice: 1,
          currentPrice: 1,
          currentValue: 1,
          createdAt: 1,
          'user.email': 1,
          'user.firstName': 1,
          'user.lastName': 1,
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    // Calculate totals
    const totalValue = coldStorageEntries.reduce(
      (sum: number, entry: any) => sum + (entry.currentValue || 0),
      0
    );

    return NextResponse.json({
      entries: coldStorageEntries.map((entry: any) => ({
        id: entry._id.toString(),
        userId: entry.userId.toString(),
        userEmail: entry.user?.email || 'Unknown',
        userName: `${entry.user?.firstName || ''} ${entry.user?.lastName || ''}`.trim() || 'Unknown',
        symbol: entry.symbol,
        name: entry.name,
        type: entry.type,
        icon: entry.icon,
        quantity: entry.quantity,
        purchasePrice: entry.purchasePrice,
        currentPrice: entry.currentPrice,
        currentValue: entry.currentValue,
        createdAt: entry.createdAt,
      })),
      totalValue,
      totalEntries: coldStorageEntries.length,
    });
  } catch (error) {
    console.error('Admin cold storage fetch error:', (error as Error).message);
    return NextResponse.json({ entries: [], totalValue: 0, totalEntries: 0 });
  }
}

// PATCH - Update cold storage entry (admin edits current price/value)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Verify admin role
    const adminUser = await User.findById(session.user.id).select('role').lean();
    if (!adminUser || !['admin', 'superadmin', 'super_admin'].includes(adminUser.role || '')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { id, currentPrice, currentValue } = body;

    if (!id) {
      return NextResponse.json({ error: 'Asset ID required' }, { status: 400 });
    }

    const coldStorageAsset = await ColdStorage.findById(id);
    if (!coldStorageAsset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Update the values
    if (currentPrice !== undefined) {
      coldStorageAsset.currentPrice = currentPrice;
      coldStorageAsset.currentValue = coldStorageAsset.quantity * currentPrice;
    }
    
    if (currentValue !== undefined) {
      coldStorageAsset.currentValue = currentValue;
      // Also update current price based on new value
      if (coldStorageAsset.quantity > 0) {
        coldStorageAsset.currentPrice = currentValue / coldStorageAsset.quantity;
      }
    }

    await coldStorageAsset.save();

    return NextResponse.json({
      success: true,
      message: 'Cold storage asset updated',
      asset: {
        id: coldStorageAsset._id.toString(),
        symbol: coldStorageAsset.symbol,
        quantity: coldStorageAsset.quantity,
        currentPrice: coldStorageAsset.currentPrice,
        currentValue: coldStorageAsset.currentValue,
      },
    });
  } catch (error) {
    console.error('Admin cold storage update error:', (error as Error).message);
    return NextResponse.json({ error: 'Failed to update cold storage' }, { status: 500 });
  }
}
