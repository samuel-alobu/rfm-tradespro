import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/db/connection';
import { User, RealEstateInvestment, RealEstateProperty, Transaction } from '@/db/models';
import mongoose from 'mongoose';

// GET - Fetch user's real estate investments
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userId = new mongoose.Types.ObjectId(session.user.id);

    const investments = await RealEstateInvestment.find({ userId })
      .sort({ investedAt: -1 })
      .lean();

    // Map to frontend format
    const mappedInvestments = investments.map((inv: any) => ({
      _id: inv._id.toString(),
      propertyId: inv.propertyId.toString(),
      propertyName: inv.property?.name || 'Property',
      propertyImage: inv.property?.image || '',
      propertyLocation: inv.property?.location || '',
      amount: inv.amount,
      projectedReturn: inv.expectedReturn,
      roi: inv.property?.roi || 0,
      durationDays: inv.durationDays,
      status: inv.status,
      investedAt: inv.investedAt,
      expiresAt: inv.expiresAt,
      releasedAt: inv.releasedAt,
      releasedAmount: inv.releasedAmount,
    }));

    return NextResponse.json({ investments: mappedInvestments });
  } catch (error) {
    console.error('Error fetching investments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new investment
export async function POST(request: NextRequest) {
  const mongoSession = await mongoose.startSession();
  
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { propertyId, amount } = body;

    if (!propertyId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid investment details' }, { status: 400 });
    }

    const userId = new mongoose.Types.ObjectId(session.user.id);

    // Start transaction
    mongoSession.startTransaction();

    // Get property
    const property = await RealEstateProperty.findById(propertyId).session(mongoSession);
    if (!property) {
      await mongoSession.abortTransaction();
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    if (!property.isActive) {
      await mongoSession.abortTransaction();
      return NextResponse.json({ error: 'Property is not available for investment' }, { status: 400 });
    }

    if (amount < property.minimum) {
      await mongoSession.abortTransaction();
      return NextResponse.json({ 
        error: `Minimum investment is ${property.minimum}` 
      }, { status: 400 });
    }

    // Get user and check real estate balance
    const user = await User.findById(userId).session(mongoSession);
    if (!user) {
      await mongoSession.abortTransaction();
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if ((user.realEstateBalance || 0) < amount) {
      await mongoSession.abortTransaction();
      return NextResponse.json({ 
        error: 'Insufficient real estate balance. Please deposit funds first.',
        realEstateBalance: user.realEstateBalance || 0,
        requiredAmount: amount,
      }, { status: 400 });
    }

    // Calculate expected return and expiration
    const expectedReturn = amount * (property.roi / 100);
    const shares = property.targetAmount > 0 ? (amount / property.targetAmount) * 100 : 0;
    const durationDays = property.durationDays || 365;
    const investedAt = new Date();
    const expiresAt = new Date(investedAt.getTime() + durationDays * 24 * 60 * 60 * 1000);

    // Track balance before
    const realEstateBalanceBefore = user.realEstateBalance || 0;

    // Create investment
    const investment = await RealEstateInvestment.create([{
      userId: user._id,
      propertyId: property._id,
      property: {
        name: property.name,
        image: property.images?.[0] || '',
        location: property.breakdown?.location || 'Location TBD',
        strategy: property.strategy,
        roi: property.roi,
      },
      amount,
      shares,
      expectedReturn,
      currentReturn: 0,
      durationDays,
      investedAt,
      expiresAt,
      status: 'active',
    }], { session: mongoSession });

    // Deduct from real estate balance (NOT availableBalance)
    user.realEstateBalance = realEstateBalanceBefore - amount;
    await user.save({ session: mongoSession });

    // Update property stats
    property.raisedAmount = (property.raisedAmount || 0) + amount;
    property.investors = (property.investors || 0) + 1;
    property.percentFunded = property.targetAmount > 0 
      ? Math.round((property.raisedAmount / property.targetAmount) * 100)
      : 0;
    await property.save({ session: mongoSession });

    // Create transaction record
    await Transaction.create([{
      userId: user._id,
      type: 'fee',
      amount: -amount,
      balanceBefore: realEstateBalanceBefore,
      balanceAfter: user.realEstateBalance,
      status: 'completed',
      description: `Real Estate Investment - ${property.name}`,
      metadata: {
        propertyId: property._id,
        investmentId: investment[0]._id,
      },
    }], { session: mongoSession });

    // Add notification
    await User.findByIdAndUpdate(userId, {
      $push: {
        notifications: {
          $each: [{
            type: 'investment',
            title: 'Investment Successful',
            message: `You invested $${amount.toLocaleString()} in ${property.name}`,
            read: false,
            createdAt: new Date(),
          }],
          $position: 0,
        },
      },
    }, { session: mongoSession });

    // Commit transaction
    await mongoSession.commitTransaction();

    return NextResponse.json({
      success: true,
      message: 'Investment successful',
      investment: {
        _id: investment[0]._id.toString(),
        propertyName: property.name,
        amount,
        expectedReturn,
        durationDays,
        expiresAt,
      },
      realEstateBalance: user.realEstateBalance,
    });
  } catch (error) {
    await mongoSession.abortTransaction();
    console.error('Error creating investment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    mongoSession.endSession();
  }
}
