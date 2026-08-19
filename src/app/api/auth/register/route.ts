import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/db/connection';
import User from '@/db/models/User';
import Referral from '@/db/models/Referral';
import { registerSchema } from '@/lib/validations';
import { sendVerificationEmail } from '@/lib/email';

// Reward tiers based on total referrals
const REWARD_TIERS = [
  { minReferrals: 1, reward: 50, tier: 'Bronze' },
  { minReferrals: 5, reward: 75, tier: 'Silver' },
  { minReferrals: 10, reward: 100, tier: 'Gold' },
  { minReferrals: 25, reward: 150, tier: 'Platinum' },
  { minReferrals: 50, reward: 250, tier: 'Diamond' },
];

function getRewardForReferrer(totalReferrals: number) {
  let currentTier = REWARD_TIERS[0];
  for (const tier of REWARD_TIERS) {
    if (totalReferrals >= tier.minReferrals) {
      currentTier = tier;
    }
  }
  return currentTier;
}

// ============================================
// POST /api/auth/register - User Registration
// ============================================

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, password, phone, country, referralCode } = result.data;

    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Check referral code if provided
    let referrer = null;
    if (referralCode) {
      referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
      if (!referrer) {
        return NextResponse.json(
          { success: false, error: 'Invalid referral code' },
          { status: 400 }
        );
      }
    }

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      phone,
      country,
      referredBy: referrer?._id,
      emailVerificationToken,
      emailVerificationExpires,
      status: 'pending',
      role: 'user',
    });

    await user.save();

    // If user was referred, create a referral record
    if (referrer) {
      // Count existing referrals to determine tier and reward
      const existingReferrals = await Referral.countDocuments({ referrerId: referrer._id });
      const tierInfo = getRewardForReferrer(existingReferrals + 1);

      // Create referral record with pending status
      await Referral.create({
        referrerId: referrer._id,
        referredId: user._id,
        referredUser: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
        rewardAmount: tierInfo.reward,
        tier: tierInfo.tier,
        status: 'pending', // Pending admin approval
      });

      // Add notification to referrer about pending referral
      await User.findByIdAndUpdate(referrer._id, {
        $push: {
          notifications: {
            $each: [{
              type: 'referral',
              title: 'New Referral',
              message: `${firstName} ${lastName} signed up using your referral code! Your reward is pending admin approval.`,
              read: false,
              createdAt: new Date(),
            }],
            $position: 0,
          },
        },
      });
    }

    // Send verification email
    const emailResult = await sendVerificationEmail(
      user.email,
      user.firstName,
      emailVerificationToken
    );

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      // Don't fail registration if email fails, user can request resend
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully. Please check your email to verify your account.',
        data: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
