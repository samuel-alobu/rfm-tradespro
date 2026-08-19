import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { Deposit, User, Transaction, UserHolding } from '@/db/models';

// Token info mapping
const tokenInfo: Record<string, { name: string; icon: string }> = {
  BTC: { name: 'Bitcoin', icon: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' },
  ETH: { name: 'Ethereum', icon: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
  USDT: { name: 'Tether', icon: 'https://assets.coingecko.com/coins/images/325/small/Tether.png' },
  USDC: { name: 'USD Coin', icon: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png' },
  BNB: { name: 'BNB', icon: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png' },
  SOL: { name: 'Solana', icon: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' },
  XRP: { name: 'Ripple', icon: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png' },
  DOGE: { name: 'Dogecoin', icon: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png' },
  ADA: { name: 'Cardano', icon: 'https://assets.coingecko.com/coins/images/975/small/cardano.png' },
  AVAX: { name: 'Avalanche', icon: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png' },
  DOT: { name: 'Polkadot', icon: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png' },
  MATIC: { name: 'Polygon', icon: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png' },
  LINK: { name: 'Chainlink', icon: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png' },
  UNI: { name: 'Uniswap', icon: 'https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png' },
  LTC: { name: 'Litecoin', icon: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png' },
  ATOM: { name: 'Cosmos', icon: 'https://assets.coingecko.com/coins/images/1481/small/cosmos_hub.png' },
};

// GET - Fetch all deposits (admin)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      console.log('❌ Admin deposits: No session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Check admin role (accept both 'admin', 'superadmin', and 'super_admin')
    const adminUserId = new mongoose.Types.ObjectId(session.user.id);
    const admin = await User.findById(adminUserId);
    
    console.log(`🔍 Admin check: ${admin?.email} (${admin?.role})`);
    
    const validAdminRoles = ['admin', 'superadmin', 'super_admin'];
    if (!admin || !validAdminRoles.includes(admin.role)) {
      console.log('❌ Admin deposits: User is not admin');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all deposits with user info
    const deposits = await Deposit.find({})
      .populate('userId', 'firstName lastName email avatar')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`✅ Admin deposits: Found ${deposits.length} deposits`);

    // Calculate stats
    const stats = {
      pending: deposits.filter((d: any) => d.status === 'pending').length,
      approved: deposits.filter((d: any) => d.status === 'approved').length,
      declined: deposits.filter((d: any) => d.status === 'declined').length,
      totalApproved: deposits
        .filter((d: any) => d.status === 'approved')
        .reduce((sum: number, d: any) => sum + (d.amountUsd || d.amount || 0), 0),
    };

    // Map deposits with user info
    const mappedDeposits = deposits.map((d: any) => ({
      _id: d._id.toString(),
      id: d._id.toString(),
      userId: d.userId?._id?.toString() || d.userId?.toString() || '',
      userName: d.userId ? `${d.userId.firstName || ''} ${d.userId.lastName || ''}`.trim() || 'Unknown' : 'Unknown',
      userEmail: d.userId?.email || 'N/A',
      reference: d.reference,
      method: d.method,
      token: d.token,
      network: d.network,
      walletAddress: d.walletAddress,
      amount: d.amount,
      amountUsd: d.amountUsd || d.amount,
      totalUsd: d.amountUsd || d.amount,
      type: d.type || 'regular',
      status: d.status,
      paymentProof: d.paymentProof,
      notes: d.notes,
      createdAt: d.createdAt,
      date: d.createdAt,
    }));

    return NextResponse.json({ deposits: mappedDeposits, stats });
  } catch (error) {
    console.error('Error fetching deposits:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Approve or decline deposit
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Check admin role
    const adminUserId = new mongoose.Types.ObjectId(session.user.id);
    const admin = await User.findById(adminUserId);
    const validAdminRoles = ['admin', 'superadmin', 'super_admin'];
    if (!admin || !validAdminRoles.includes(admin.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { depositId, action, declineReason } = body;

    if (!depositId || !['approve', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const deposit = await Deposit.findById(depositId);
    if (!deposit) {
      return NextResponse.json({ error: 'Deposit not found' }, { status: 404 });
    }

    if (deposit.status !== 'pending') {
      return NextResponse.json({ error: 'Deposit already processed' }, { status: 400 });
    }

    // Find user
    const user = await User.findById(deposit.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (action === 'approve') {
      const depositAmount = deposit.amountUsd || deposit.amount;
      const tokenAmount = deposit.amount || 0;
      const tokenSymbol = deposit.token || 'USDT';
      const balanceBefore = user.availableBalance || 0;
      
      // Credit both availableBalance and totalBalance
      await User.findByIdAndUpdate(deposit.userId, {
        $inc: {
          availableBalance: depositAmount,
          totalBalance: depositAmount,
          totalDeposits: depositAmount,
        },
        $push: {
          notifications: {
            $each: [{
              type: 'deposit_approved',
              title: 'Deposit Approved',
              message: `Your deposit of $${depositAmount.toLocaleString()} has been approved and credited to your account.`,
              read: false,
              createdAt: new Date(),
            }],
            $position: 0,
          },
        },
      });

      // Create or update UserHolding for this token
      const info = tokenInfo[tokenSymbol] || { name: tokenSymbol, icon: '' };
      const pricePerUnit = tokenAmount > 0 ? depositAmount / tokenAmount : depositAmount;
      
      const existingHolding = await UserHolding.findOne({ 
        userId: deposit.userId, 
        symbol: tokenSymbol 
      });

      if (existingHolding) {
        // Update existing holding - calculate new average price
        const totalAmount = existingHolding.amount + tokenAmount;
        const totalValue = existingHolding.amountUsd + depositAmount;
        const newAvgPrice = totalAmount > 0 ? totalValue / totalAmount : pricePerUnit;
        
        await UserHolding.findByIdAndUpdate(existingHolding._id, {
          $inc: { amount: tokenAmount, amountUsd: depositAmount },
          $set: { averagePrice: newAvgPrice },
        });
      } else {
        // Create new holding
        await UserHolding.create({
          userId: deposit.userId,
          symbol: tokenSymbol,
          name: info.name,
          type: 'crypto',
          icon: info.icon,
          amount: tokenAmount,
          amountUsd: depositAmount,
          averagePrice: pricePerUnit,
        });
      }

      // Update deposit
      deposit.status = 'approved';
      deposit.processedBy = adminUserId;
      deposit.processedAt = new Date();
      await deposit.save();

      // Create transaction record
      await Transaction.create({
        userId: deposit.userId,
        type: 'deposit',
        amount: depositAmount,
        balanceBefore,
        balanceAfter: user.availableBalance,
        status: 'completed',
        description: `Deposit approved - ${deposit.reference}`,
        reference: deposit.reference,
        relatedId: deposit._id,
        relatedModel: 'Deposit',
      });

      console.log(`✅ Deposit ${deposit.reference} approved. User ${user.email} credited $${depositAmount} (${tokenAmount} ${tokenSymbol})`);

      // Get updated user balance for response
      const updatedUser = await User.findById(deposit.userId);

      return NextResponse.json({ 
        message: 'Deposit approved successfully',
        deposit,
        newBalance: updatedUser?.availableBalance || 0,
      });
    } else {
      // Decline
      deposit.status = 'declined';
      deposit.notes = declineReason || 'Deposit declined by admin';
      deposit.processedBy = adminUserId;
      deposit.processedAt = new Date();
      await deposit.save();

      // Add notification using $push
      await User.findByIdAndUpdate(deposit.userId, {
        $push: {
          notifications: {
            $each: [{
              type: 'deposit_declined',
              title: 'Deposit Declined',
              message: `Your deposit of $${(deposit.amountUsd || deposit.amount).toLocaleString()} was declined. ${declineReason || ''}`,
              read: false,
              createdAt: new Date(),
            }],
            $position: 0,
          },
        },
      });

      console.log(`❌ Deposit ${deposit.reference} declined`);

      return NextResponse.json({ 
        message: 'Deposit declined',
        deposit,
      });
    }
  } catch (error) {
    console.error('Error processing deposit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
