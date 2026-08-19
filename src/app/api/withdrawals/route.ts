import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { Withdrawal, User, UserHolding, SiteSettings } from '@/db/models';
import { usdToTokenAsync, formatTokenAmount, fetchCryptoPrices } from '@/utils/cryptoPrices';
import { sendWithdrawalAlertEmail } from '@/lib/email';

// GET - Fetch user withdrawals (optimized)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userId = new mongoose.Types.ObjectId(session.user.id);

    // Single optimized query with field selection
    const withdrawals = await Withdrawal.find({ userId })
      .select('reference method token network amount amountUsd fee netAmount status createdAt')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ withdrawals });
  } catch (error) {
    console.error('Withdrawals error:', (error as Error).message);
    // Graceful degradation
    return NextResponse.json({ withdrawals: [] });
  }
}

// POST - Create new withdrawal (token-based validation)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { 
      method, amount, 
      // Token fields (required for both methods)
      token, tokenName, tokenAmount,
      // Crypto fields
      network, walletAddress,
      // Bank fields
      bankName, accountName, accountNumber, routingNumber, swiftCode, bankCountry
    } = body;

    const withdrawAmount = parseFloat(amount);

    // Validate basic fields
    if (!method || !withdrawAmount || withdrawAmount < 10) {
      return NextResponse.json({ error: 'Invalid withdrawal data. Minimum amount is $10.' }, { status: 400 });
    }

    // Token is required for both methods
    if (!token) {
      return NextResponse.json({ error: 'Token selection is required' }, { status: 400 });
    }

    // Validate method-specific fields
    if (method === 'crypto') {
      if (!network || !walletAddress) {
        return NextResponse.json({ error: 'Crypto withdrawals require network and wallet address' }, { status: 400 });
      }
    } else if (method === 'bank') {
      if (!bankName || !accountName || !accountNumber) {
        return NextResponse.json({ error: 'Bank withdrawals require bank name, account name, and account number' }, { status: 400 });
      }
    }

    const userId = new mongoose.Types.ObjectId(session.user.id);

    // Check user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get site settings
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({});
    }

    // Check KYC requirement
    if (settings.requireKycForWithdrawal && user.verificationStatus !== 'verified') {
      return NextResponse.json({ 
        error: 'KYC verification required',
        message: 'Please complete your KYC verification to withdraw funds. Go to Settings > Security to verify your identity.',
        requiresKyc: true,
      }, { status: 403 });
    }

    // Check withdrawal limits
    const isVerified = user.verificationStatus === 'verified';
    const dailyLimit = isVerified 
      ? settings.withdrawalDailyLimitVerified 
      : settings.withdrawalDailyLimitUnverified;
    const monthlyLimit = isVerified 
      ? settings.withdrawalMonthlyLimitVerified 
      : settings.withdrawalMonthlyLimitUnverified;

    // Calculate current usage
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [dailyWithdrawals, monthlyWithdrawals] = await Promise.all([
      Withdrawal.aggregate([
        {
          $match: {
            userId,
            status: { $in: ['pending', 'approved', 'completed'] },
            createdAt: { $gte: startOfDay },
          },
        },
        { $group: { _id: null, total: { $sum: '$amountUsd' } } },
      ]),
      Withdrawal.aggregate([
        {
          $match: {
            userId,
            status: { $in: ['pending', 'approved', 'completed'] },
            createdAt: { $gte: startOfMonth },
          },
        },
        { $group: { _id: null, total: { $sum: '$amountUsd' } } },
      ]),
    ]);

    const dailyUsed = dailyWithdrawals[0]?.total || 0;
    const monthlyUsed = monthlyWithdrawals[0]?.total || 0;

    // Check daily limit
    if (dailyUsed + withdrawAmount > dailyLimit) {
      const remaining = Math.max(0, dailyLimit - dailyUsed);
      return NextResponse.json({ 
        error: 'Daily withdrawal limit exceeded',
        message: `Your daily withdrawal limit is $${dailyLimit.toLocaleString()}. You have $${remaining.toLocaleString()} remaining today.`,
        dailyLimit,
        dailyUsed,
        dailyRemaining: remaining,
      }, { status: 400 });
    }

    // Check monthly limit
    if (monthlyUsed + withdrawAmount > monthlyLimit) {
      const remaining = Math.max(0, monthlyLimit - monthlyUsed);
      return NextResponse.json({ 
        error: 'Monthly withdrawal limit exceeded',
        message: `Your monthly withdrawal limit is $${monthlyLimit.toLocaleString()}. You have $${remaining.toLocaleString()} remaining this month.`,
        monthlyLimit,
        monthlyUsed,
        monthlyRemaining: remaining,
      }, { status: 400 });
    }

    // Validate user has the token they're trying to withdraw
    const userHolding = await UserHolding.findOne({ userId, symbol: token });
    if (!userHolding || userHolding.amount <= 0) {
      return NextResponse.json({ 
        error: `You don't have any ${token} holdings to withdraw`,
      }, { status: 400 });
    }

    // Check if withdrawal amount exceeds holding value
    if (withdrawAmount > userHolding.amountUsd) {
      return NextResponse.json({ 
        error: `Insufficient ${token} balance. Available: $${userHolding.amountUsd.toFixed(2)}`,
        availableAmount: userHolding.amountUsd,
        requestedAmount: withdrawAmount,
      }, { status: 400 });
    }

    // Generate unique reference
    let reference: string = '';
    let isUnique = false;
    while (!isUnique) {
      reference = Withdrawal.generateReference();
      const existing = await Withdrawal.findOne({ reference });
      if (!existing) isUnique = true;
    }

    // Calculate fee (1% for crypto, 2% for bank, minimum $1)
    const feePercent = method === 'crypto' ? 0.01 : 0.02;
    const fee = Math.max(withdrawAmount * feePercent, 1);
    const netAmount = withdrawAmount - fee;

    // Calculate token amount being withdrawn
    const calculatedTokenAmount = tokenAmount || (userHolding.amount * (withdrawAmount / userHolding.amountUsd));

    // Create withdrawal record
    const withdrawal = await Withdrawal.create({
      userId,
      reference,
      method: method === 'crypto' ? `${token} (${network})` : 'Bank Transfer',
      token,
      network: method === 'crypto' ? network : undefined,
      walletAddress: method === 'crypto' ? walletAddress : undefined,
      bankName: method === 'bank' ? bankName : undefined,
      accountName: method === 'bank' ? accountName : undefined,
      accountNumber: method === 'bank' ? accountNumber : undefined,
      routingNumber: method === 'bank' ? routingNumber : undefined,
      swiftCode: method === 'bank' ? swiftCode : undefined,
      amount: calculatedTokenAmount, // Store token amount
      amountUsd: withdrawAmount,
      fee,
      netAmount,
      status: 'pending',
      notes: method === 'bank' && bankCountry ? `Bank Country: ${bankCountry}` : undefined,
    });

    // Add notification to user
    const methodDisplay = method === 'crypto' 
      ? `${token} (${network})` 
      : `Bank Transfer to ${bankName}`;

    await User.findByIdAndUpdate(userId, {
      $push: {
        notifications: {
          $each: [{
            type: 'withdrawal_pending',
            title: 'Withdrawal Submitted',
            message: `Your withdrawal of $${withdrawAmount.toLocaleString()} (${token}) via ${methodDisplay} is pending approval.`,
            read: false,
            createdAt: new Date(),
          }],
          $position: 0,
        },
      },
    });

    console.log(`✅ Withdrawal request created: ${reference} for user ${user.email} - $${withdrawAmount} of ${token}`);

    // Send withdrawal alert email to admin (async, don't wait)
    if (settings.depositAlertEnabled && settings.depositAlertEmail) {
      sendWithdrawalAlertEmail(settings.depositAlertEmail, {
        userName: `${user.firstName} ${user.lastName}`,
        userEmail: user.email,
        amount: withdrawAmount,
        token,
        network: method === 'crypto' ? network : undefined,
        walletAddress: method === 'crypto' ? walletAddress : undefined,
        bankName: method === 'bank' ? bankName : undefined,
        accountNumber: method === 'bank' ? accountNumber : undefined,
        reference,
        status: 'pending',
        fee,
        netAmount,
        createdAt: new Date(),
      }).catch(err => console.error('Failed to send withdrawal alert:', err));
    }

    return NextResponse.json({ 
      withdrawal, 
      message: 'Withdrawal submitted successfully' 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating withdrawal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
