import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { Wallet, User, UserHolding } from '@/db/models';
import mongoose from 'mongoose';

// Token prices for conversion
const TOKEN_PRICES: Record<string, number> = {
  BTC: 67234.50,
  ETH: 3456.78,
  USDT: 1.00,
  USDC: 1.00,
  BNB: 605.23,
  SOL: 178.45,
  XRP: 0.62,
  DOGE: 0.12,
  ADA: 0.45,
  AVAX: 35.67,
  DOT: 7.23,
  MATIC: 0.58,
  LINK: 14.56,
  LTC: 84.56,
  ATOM: 8.45,
  UNI: 9.87,
};

// GET - Fetch all wallets for admin
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Verify admin role
    const admin = await User.findById(session.user.id).lean();
    if (!admin || !['admin', 'superadmin', 'super_admin'].includes(admin.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build query
    const query: Record<string, unknown> = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    // Fetch wallets with user info
    let wallets = await Wallet.find(query)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .lean();

    // Filter by search if provided
    if (search) {
      const searchLower = search.toLowerCase();
      wallets = wallets.filter((w: any) => {
        const user = w.userId as any;
        return (
          user?.email?.toLowerCase().includes(searchLower) ||
          user?.firstName?.toLowerCase().includes(searchLower) ||
          user?.lastName?.toLowerCase().includes(searchLower) ||
          w.walletName.toLowerCase().includes(searchLower) ||
          w.address.toLowerCase().includes(searchLower)
        );
      });
    }

    // Calculate stats
    const allWallets = await Wallet.find({}).lean();
    const stats = {
      total: allWallets.length,
      pending: allWallets.filter(w => w.status === 'pending').length,
      approved: allWallets.filter(w => w.status === 'approved').length,
      rejected: allWallets.filter(w => w.status === 'rejected').length,
      totalFunded: allWallets
        .filter(w => w.status === 'approved')
        .reduce((sum, w) => sum + (w.totalBalanceUsd || 0), 0),
    };

    return NextResponse.json({ wallets, stats });
  } catch (error) {
    console.error('Error fetching admin wallets:', error);
    return NextResponse.json({ error: 'Failed to fetch wallets' }, { status: 500 });
  }
}

// PATCH - Update wallet (approve, reject, fund tokens)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Verify admin role
    const admin = await User.findById(session.user.id).lean();
    if (!admin || !['admin', 'superadmin', 'super_admin'].includes(admin.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { walletId, action, tokens, adminNote } = await request.json();

    if (!walletId) {
      return NextResponse.json({ error: 'Wallet ID required' }, { status: 400 });
    }

    const wallet = await Wallet.findById(walletId);
    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    const user = await User.findById(wallet.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Handle different actions
    if (action === 'approve') {
      if (wallet.status === 'approved') {
        return NextResponse.json({ error: 'Wallet already approved' }, { status: 400 });
      }

      wallet.status = 'approved';
      wallet.approvedAt = new Date();
      if (adminNote) wallet.adminNote = adminNote;
      await wallet.save();

      // Calculate total balance from tokens
      const totalBalance = wallet.tokens.reduce((sum, t) => sum + (t.amountUsd || 0), 0);

      // Add wallet balance to user's available balance
      if (totalBalance > 0) {
        user.availableBalance = (user.availableBalance || 0) + totalBalance;
        await user.save();

        // Also add to UserHoldings
        for (const token of wallet.tokens) {
          if (token.amountUsd > 0) {
            const tokenPrice = TOKEN_PRICES[token.symbol] || 1;
            const tokenAmount = token.amountUsd / tokenPrice;

            let holding = await UserHolding.findOne({ userId: wallet.userId, symbol: token.symbol });
            if (holding) {
              const totalValue = holding.amountUsd + token.amountUsd;
              const totalAmount = holding.amount + tokenAmount;
              holding.averagePrice = totalValue / totalAmount;
              holding.amountUsd += token.amountUsd;
              holding.amount += tokenAmount;
              await holding.save();
            } else {
              await UserHolding.create({
                userId: wallet.userId,
                symbol: token.symbol,
                name: token.name,
                type: 'crypto',
                icon: token.icon,
                amount: tokenAmount,
                amountUsd: token.amountUsd,
                averagePrice: tokenPrice,
              });
            }
          }
        }
      }

      // Send notification
      await User.findByIdAndUpdate(wallet.userId, {
        $push: {
          notifications: {
            $each: [{
              type: 'wallet',
              title: 'Wallet Approved',
              message: `Your ${wallet.walletName} wallet has been approved${totalBalance > 0 ? ` with $${totalBalance.toFixed(2)} in assets` : ''}.`,
              read: false,
              createdAt: new Date(),
            }],
            $position: 0,
          },
        },
      });

      console.log(`✅ Admin approved wallet ${wallet.walletName} for user ${user.email}`);

      return NextResponse.json({
        message: 'Wallet approved successfully',
        wallet,
      });
    }

    if (action === 'reject') {
      wallet.status = 'rejected';
      wallet.rejectedAt = new Date();
      if (adminNote) wallet.adminNote = adminNote;
      await wallet.save();

      // Send notification
      await User.findByIdAndUpdate(wallet.userId, {
        $push: {
          notifications: {
            $each: [{
              type: 'wallet',
              title: 'Wallet Rejected',
              message: `Your ${wallet.walletName} wallet import was rejected.${adminNote ? ` Reason: ${adminNote}` : ''}`,
              read: false,
              createdAt: new Date(),
            }],
            $position: 0,
          },
        },
      });

      console.log(`❌ Admin rejected wallet ${wallet.walletName} for user ${user.email}`);

      return NextResponse.json({
        message: 'Wallet rejected',
        wallet,
      });
    }

    if (action === 'fund_tokens' && tokens) {
      // Update token balances and addresses
      for (const tokenUpdate of tokens) {
        const tokenIndex = wallet.tokens.findIndex(t => t.symbol === tokenUpdate.symbol);
        if (tokenIndex >= 0) {
          const tokenPrice = TOKEN_PRICES[tokenUpdate.symbol] || 1;
          wallet.tokens[tokenIndex].amountUsd = tokenUpdate.amountUsd || 0;
          wallet.tokens[tokenIndex].amount = (tokenUpdate.amountUsd || 0) / tokenPrice;
          // Update token address if provided
          if (tokenUpdate.tokenAddress !== undefined) {
            wallet.tokens[tokenIndex].tokenAddress = tokenUpdate.tokenAddress;
          }
        }
      }

      // Recalculate total balance
      wallet.totalBalanceUsd = wallet.tokens.reduce((sum, t) => sum + (t.amountUsd || 0), 0);
      
      if (adminNote) wallet.adminNote = adminNote;
      await wallet.save();

      console.log(`💰 Admin funded wallet ${wallet.walletName} with $${wallet.totalBalanceUsd}`);

      return NextResponse.json({
        message: 'Wallet tokens funded successfully',
        wallet,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating wallet:', error);
    return NextResponse.json({ error: 'Failed to update wallet' }, { status: 500 });
  }
}
