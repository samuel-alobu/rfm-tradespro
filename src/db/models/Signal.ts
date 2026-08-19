import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// Signal Model (Admin-managed trading signals)
// ============================================

export interface ISignal extends Document {
  _id: mongoose.Types.ObjectId;
  // Signal details
  title: string;
  pair: string;
  pairIcon?: string;
  type: 'buy' | 'sell';
  price: number; // Signal price (what user pays)
  strength: number; // Signal strength in %
  amount: number; // Recommended trading amount
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2?: number;
  takeProfit3?: number;
  // Status
  status: 'active' | 'hit_tp1' | 'hit_tp2' | 'hit_tp3' | 'stopped' | 'expired';
  result?: 'profit' | 'loss';
  profitPercent?: number;
  // Metadata
  market: 'crypto' | 'forex' | 'stocks' | 'commodities';
  timeframe: string;
  confidence: 'low' | 'medium' | 'high';
  notes?: string;
  // Premium/Access
  isPremium: boolean;
  minTier: 'free' | 'starter' | 'pro' | 'premium';
  // Stats
  subscribers: number;
  durationDays: number; // How long the signal lasts after purchase
  // Admin
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  closedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SignalSchema = new Schema<ISignal>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    pair: {
      type: String,
      required: true,
      trim: true,
    },
    pairIcon: String,
    type: {
      type: String,
      enum: ['buy', 'sell'],
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    strength: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    entryPrice: {
      type: Number,
      required: true,
    },
    stopLoss: {
      type: Number,
      required: true,
    },
    takeProfit1: {
      type: Number,
      required: true,
    },
    takeProfit2: Number,
    takeProfit3: Number,
    status: {
      type: String,
      enum: ['active', 'hit_tp1', 'hit_tp2', 'hit_tp3', 'stopped', 'expired'],
      default: 'active',
      index: true,
    },
    result: {
      type: String,
      enum: ['profit', 'loss'],
    },
    profitPercent: Number,
    market: {
      type: String,
      enum: ['crypto', 'forex', 'stocks', 'commodities'],
      required: true,
    },
    timeframe: {
      type: String,
      default: '4H',
    },
    confidence: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    notes: String,
    isPremium: {
      type: Boolean,
      default: false,
    },
    minTier: {
      type: String,
      enum: ['free', 'starter', 'pro', 'premium'],
      default: 'free',
    },
    subscribers: {
      type: Number,
      default: 0,
    },
    durationDays: {
      type: Number,
      default: 30,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    closedAt: Date,
    expiresAt: Date,
  },
  { timestamps: true }
);

SignalSchema.index({ status: 1, createdAt: -1 });
SignalSchema.index({ market: 1, status: 1 });
SignalSchema.index({ isActive: 1 });

const Signal: Model<ISignal> =
  mongoose.models.Signal || mongoose.model<ISignal>('Signal', SignalSchema);

export default Signal;
