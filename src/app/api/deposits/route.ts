import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { Deposit, User, SiteSettings } from '@/db/models';
import { usdToTokenAsync, formatTokenAmount, fetchCryptoPrices } from '@/utils/cryptoPrices';
import { sendDepositAlertEmail } from '@/lib/email';

// GET - Fetch user deposits (optimized)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userId = new mongoose.Types.ObjectId(session.user.id);

    // Single optimized query with field selection
    const deposits = await Deposit.find({ userId })
      .select('reference method token network amount amountUsd type status createdAt')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ deposits });
  } catch (error) {
    console.error('Deposits error:', (error as Error).message);
    // Graceful degradation - return empty instead of error
    return NextResponse.json({ deposits: [] });
  }
}

// POST - Create new deposit
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { method, token, network, walletAddress, amount, type = 'regular', paymentProof } = body;

    const amountUsd = parseFloat(amount);

    if (!method || !amountUsd || amountUsd < 10) {
      return NextResponse.json({ error: 'Invalid deposit data. Minimum amount is $10.' }, { status: 400 });
    }

    if (!paymentProof) {
      return NextResponse.json({ error: 'Payment proof is required' }, { status: 400 });
    }

    // Get site settings for limits
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({});
    }

    // Check deposit limits
    if (amountUsd < settings.depositMinimum) {
      return NextResponse.json({ 
        error: `Minimum deposit amount is $${settings.depositMinimum.toLocaleString()}`,
        minimum: settings.depositMinimum,
      }, { status: 400 });
    }

    if (amountUsd > settings.depositMaximum) {
      return NextResponse.json({ 
        error: `Maximum deposit amount is $${settings.depositMaximum.toLocaleString()}`,
        maximum: settings.depositMaximum,
      }, { status: 400 });
    }

    const userId = new mongoose.Types.ObjectId(session.user.id);

    // Get user info for alert email
    const user = await User.findById(userId).select('firstName lastName email');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate unique reference
    let reference: string = '';
    let isUnique = false;
    while (!isUnique) {
      reference = Deposit.generateReference();
      const existing = await Deposit.findOne({ reference });
      if (!existing) isUnique = true;
    }

    // Fetch real crypto prices and calculate token amount
    await fetchCryptoPrices(); // Pre-fetch to populate cache
    const tokenSymbol = token || 'USDT';
    const tokenAmount = await usdToTokenAsync(amountUsd, tokenSymbol);

    const deposit = await Deposit.create({
      userId,
      reference,
      method,
      token: tokenSymbol,
      network,
      walletAddress,
      amount: tokenAmount,
      amountUsd,
      type,
      paymentProof,
      status: 'pending',
    });

    // Add notification to user
    await User.findByIdAndUpdate(userId, {
      $push: {
        notifications: {
          $each: [{
            type: 'deposit_pending',
            title: 'Deposit Submitted',
            message: `Your deposit of $${amountUsd.toLocaleString()} (${formatTokenAmount(tokenAmount, tokenSymbol)} ${tokenSymbol}) is pending approval.`,
            read: false,
            createdAt: new Date(),
          }],
          $position: 0, // Add at the beginning
        },
      },
    });

    console.log(`✅ Deposit created: ${reference} - $${amountUsd} = ${formatTokenAmount(tokenAmount, tokenSymbol)} ${tokenSymbol}`);

    // Send deposit alert email to admin (async, don't wait)
    if (settings.depositAlertEnabled && settings.depositAlertEmail) {
      sendDepositAlertEmail(settings.depositAlertEmail, {
        userName: `${user.firstName} ${user.lastName}`,
        userEmail: user.email,
        amount: amountUsd,
        token: tokenSymbol,
        network: network || 'N/A',
        walletAddress: walletAddress || 'N/A',
        reference,
        status: 'pending',
        createdAt: new Date(),
      }).catch(err => console.error('Failed to send deposit alert:', err));
    }

    return NextResponse.json({ deposit, message: 'Deposit submitted successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating deposit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
