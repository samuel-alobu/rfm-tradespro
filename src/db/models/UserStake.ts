import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// UserStake Model (User staking entries)
// ============================================

export interface IUserStake extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  stakeAssetId: mongoose.Types.ObjectId;
  // Stake details
  asset: {
    name: string;
    symbol: string;
    image: string;
  };
  amount: number;
  amountUsd: number;
  cycleDays: number;
  apy: number;
  expectedReward: number;
  // Dates
  startDate: Date;
  endDate: Date;
  // Status
  status: 'active' | 'completed' | 'withdrawn' | 'cancelled';
  // Rewards
  earnedReward: number;
  claimedReward: number;
  lastClaimDate?: Date;
  // Release tracking
  releasedAt?: Date;
  releasedBy?: mongoose.Types.ObjectId;
  releasedAmount?: number; // Principal + reward
  releaseNote?: string;
  // Admin
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserStakeSchema = new Schema<IUserStake>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    stakeAssetId: {
      type: Schema.Types.ObjectId,
      ref: 'StakeAsset',
      required: true,
    },
    asset: {
      name: {
        type: String,
        required: true,
      },
      symbol: {
        type: String,
        required: true,
      },
      image: {
        type: String,
        required: true,
      },
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    amountUsd: {
      type: Number,
      required: true,
      min: 0,
    },
    cycleDays: {
      type: Number,
      required: true,
    },
    apy: {
      type: Number,
      required: true,
    },
    expectedReward: {
      type: Number,
      required: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'withdrawn', 'cancelled'],
      default: 'active',
      index: true,
    },
    earnedReward: {
      type: Number,
      default: 0,
    },
    claimedReward: {
      type: Number,
      default: 0,
    },
    lastClaimDate: Date,
    releasedAt: Date,
    releasedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    releasedAmount: Number,
    releaseNote: String,
    adminNote: String,
  },
  { timestamps: true }
);

UserStakeSchema.index({ userId: 1, status: 1 });
UserStakeSchema.index({ endDate: 1, status: 1 });

const UserStake: Model<IUserStake> =
  mongoose.models.UserStake || mongoose.model<IUserStake>('UserStake', UserStakeSchema);

export default UserStake;
