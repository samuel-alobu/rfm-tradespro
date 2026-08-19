import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// UserHolding Model
// Tracks individual token/asset balances per user
// ============================================

export interface IUserHolding extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  symbol: string;
  name: string;
  type: 'crypto' | 'stock';
  icon: string;
  amount: number; // Token quantity
  amountUsd: number; // USD value (updated with price changes)
  averagePrice: number; // Average purchase price per unit
  coingeckoId: string; // CoinGecko API ID for price fetching
  createdAt: Date;
  updatedAt: Date;
}

const UserHoldingSchema = new Schema<IUserHolding>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['crypto', 'stock'],
      default: 'crypto',
    },
    icon: {
      type: String,
      default: '',
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    amountUsd: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    averagePrice: {
      type: Number,
      default: 0,
    },
    coingeckoId: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
UserHoldingSchema.index({ userId: 1, symbol: 1 }, { unique: true });

const UserHolding: Model<IUserHolding> =
  mongoose.models.UserHolding || mongoose.model<IUserHolding>('UserHolding', UserHoldingSchema);

export default UserHolding;
