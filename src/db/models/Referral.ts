import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// Referral Model - Tracks referral relationships and earnings
// ============================================

export interface IReferral extends Document {
  _id: mongoose.Types.ObjectId;
  referrerId: mongoose.Types.ObjectId; // The user who referred
  referredId: mongoose.Types.ObjectId; // The user who was referred
  // Referred user info snapshot
  referredUser: {
    firstName: string;
    lastName: string;
    email: string;
  };
  // Reward info
  rewardAmount: number;
  tier: string; // Bronze, Silver, Gold, etc.
  // Status: pending (waiting for admin), active (approved, not yet withdrawn), completed (paid out)
  status: 'pending' | 'active' | 'completed';
  // Admin actions
  approvedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  adminNote?: string;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const ReferralSchema = new Schema<IReferral>(
  {
    referrerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    referredId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // A user can only be referred once
    },
    referredUser: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true },
    },
    rewardAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    tier: {
      type: String,
      default: 'Bronze',
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'completed'],
      default: 'pending',
      index: true,
    },
    approvedAt: Date,
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    adminNote: String,
  },
  { timestamps: true }
);

// Compound index for efficient queries
ReferralSchema.index({ referrerId: 1, status: 1 });
ReferralSchema.index({ status: 1, createdAt: -1 });

const Referral: Model<IReferral> =
  mongoose.models.Referral || mongoose.model<IReferral>('Referral', ReferralSchema);

export default Referral;
