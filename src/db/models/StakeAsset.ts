import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// StakeAsset Model (Admin-managed staking assets)
// ============================================

export interface IStakeAsset extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  symbol: string;
  image: string;
  description?: string;
  // Staking parameters
  minAmount: number;
  maxAmount: number;
  cycles: {
    days: number;
    apy: number;
    isActive: boolean;
  }[];
  // Status
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  // Stats
  totalStaked: number;
  totalStakers: number;
  // Admin
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CycleSchema = new Schema({
  days: {
    type: Number,
    required: true,
  },
  apy: {
    type: Number,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

const StakeAssetSchema = new Schema<IStakeAsset>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
    description: String,
    minAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    maxAmount: {
      type: Number,
      required: true,
    },
    cycles: [CycleSchema],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    totalStaked: {
      type: Number,
      default: 0,
    },
    totalStakers: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

StakeAssetSchema.index({ isActive: 1, sortOrder: 1 });
StakeAssetSchema.index({ symbol: 1 });

const StakeAsset: Model<IStakeAsset> =
  mongoose.models.StakeAsset || mongoose.model<IStakeAsset>('StakeAsset', StakeAssetSchema);

export default StakeAsset;
