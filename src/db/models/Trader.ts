import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// Trader Model (Copy Trading)
// ============================================

export interface ITrader extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  username: string;
  avatar: string;
  country: string;
  countryFlag: string;
  bio?: string;
  // Performance
  winRate: number;
  totalReturn: number;
  monthlyReturn: number;
  profitShare: number;
  // Stats
  copiers: number;
  totalTrades: number;
  wins: number;
  losses: number;
  avgTradeTime: string;
  maxDrawdown: number;
  riskScore: number; // 1-10
  // Trading info
  tradingStyle: 'conservative' | 'moderate' | 'aggressive';
  markets: string[];
  minInvestment: number;
  // Status
  isActive: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  // Metadata
  joinedAt: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TraderSchema = new Schema<ITrader>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    avatar: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    countryFlag: {
      type: String,
      required: true,
    },
    bio: String,
    // Performance
    winRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    totalReturn: {
      type: Number,
      required: true,
    },
    monthlyReturn: {
      type: Number,
      required: true,
    },
    profitShare: {
      type: Number,
      required: true,
      min: 0,
      max: 50,
    },
    // Stats
    copiers: {
      type: Number,
      default: 0,
    },
    totalTrades: {
      type: Number,
      default: 0,
    },
    wins: {
      type: Number,
      default: 0,
    },
    losses: {
      type: Number,
      default: 0,
    },
    avgTradeTime: {
      type: String,
      default: '2h 30m',
    },
    maxDrawdown: {
      type: Number,
      default: 0,
    },
    riskScore: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },
    // Trading info
    tradingStyle: {
      type: String,
      enum: ['conservative', 'moderate', 'aggressive'],
      default: 'moderate',
    },
    markets: [{
      type: String,
    }],
    minInvestment: {
      type: Number,
      default: 100,
    },
    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

TraderSchema.index({ isActive: 1, isFeatured: -1 });
TraderSchema.index({ winRate: -1 });
TraderSchema.index({ totalReturn: -1 });

const Trader: Model<ITrader> =
  mongoose.models.Trader || mongoose.model<ITrader>('Trader', TraderSchema);

export default Trader;
