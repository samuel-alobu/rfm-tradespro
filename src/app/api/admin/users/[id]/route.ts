import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { User, UserHolding, Deposit, Withdrawal } from '@/db/models';

// ============================================
// Admin User Detail API - GET, PATCH, DELETE
// ============================================

// GET - Get single user with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Verify admin role
    const adminUser = await User.findById(session.user.id);
    if (!adminUser || !['admin', 'super_admin'].includes(adminUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    
    // Get user
    const user = await User.findById(id)
      .select('-password -emailVerificationToken -passwordResetToken -twoFactorSecret -twoFactorCode -deleteAccountCode')
      .lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user holdings
    const holdings = await UserHolding.find({ userId: id }).lean();

    // Get recent deposits
    const deposits = await Deposit.find({ userId: id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Get recent withdrawals
    const withdrawals = await Withdrawal.find({ userId: id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Calculate totals
    const totalHoldingsValue = holdings.reduce((sum, h) => sum + h.amountUsd, 0);

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        holdings,
        totalHoldingsValue,
        recentDeposits: deposits,
        recentWithdrawals: withdrawals,
      },
    });
  } catch (error) {
    console.error('Admin user fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PATCH - Update user (status, role, balance, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Verify admin role
    const adminUser = await User.findById(session.user.id);
    if (!adminUser || !['admin', 'super_admin'].includes(adminUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, ...data } = body;

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let updateData: Record<string, unknown> = {};
    let message = '';

    switch (action) {
      case 'suspend':
        // Toggle suspend status
        updateData.status = user.status === 'suspended' ? 'active' : 'suspended';
        message = updateData.status === 'suspended' ? 'User suspended' : 'User activated';
        break;

      case 'activate':
        updateData.status = 'active';
        message = 'User activated';
        break;

      case 'ban':
        updateData.status = 'banned';
        message = 'User banned';
        break;

      case 'change_role':
        // Only super_admin can promote to admin
        if (data.role === 'admin' || data.role === 'super_admin') {
          if (adminUser.role !== 'super_admin') {
            return NextResponse.json(
              { error: 'Only super admin can promote users to admin' },
              { status: 403 }
            );
          }
        }
        updateData.role = data.role;
        message = `User role changed to ${data.role}`;
        break;

      case 'fund_balance':
        // Add or set balance
        const fundAmount = parseFloat(data.amount);
        if (isNaN(fundAmount)) {
          return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }
        
        if (data.mode === 'set') {
          updateData.availableBalance = fundAmount;
          updateData.totalBalance = fundAmount + (user.lockedBalance || 0);
        } else {
          // Add mode
          updateData.availableBalance = (user.availableBalance || 0) + fundAmount;
          updateData.totalBalance = (user.totalBalance || 0) + fundAmount;
          if (fundAmount > 0) {
            updateData.totalDeposits = (user.totalDeposits || 0) + fundAmount;
          }
        }
        message = data.mode === 'set' 
          ? `Balance set to $${fundAmount.toFixed(2)}` 
          : `$${Math.abs(fundAmount).toFixed(2)} ${fundAmount > 0 ? 'added to' : 'deducted from'} balance`;
        break;

      case 'update_verification':
        updateData.verificationStatus = data.verificationStatus;
        message = `Verification status updated to ${data.verificationStatus}`;
        break;

      case 'update_account_level':
        updateData.accountLevel = data.accountLevel;
        message = `Account level updated to ${data.accountLevel}`;
        break;

      case 'update_profile':
        // Update basic profile fields
        if (data.firstName) updateData.firstName = data.firstName;
        if (data.lastName) updateData.lastName = data.lastName;
        if (data.phone) updateData.phone = data.phone;
        if (data.country) updateData.country = data.country;
        message = 'Profile updated';
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).select('-password -emailVerificationToken -passwordResetToken -twoFactorSecret -twoFactorCode -deleteAccountCode');

    return NextResponse.json({
      success: true,
      message,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Admin user update error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Verify super_admin role for deletion
    const adminUser = await User.findById(session.user.id);
    if (!adminUser || adminUser.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only super admin can delete users' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Soft delete - set status to deleted
    await User.findByIdAndUpdate(id, {
      $set: {
        status: 'deleted',
        deletedAt: new Date(),
        deletedReason: 'Deleted by admin',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted',
    });
  } catch (error) {
    console.error('Admin user delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
