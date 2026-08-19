import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// TradingPosition Model
// Tracks individual trading positions
// ============================================

export type PositionType = 'buy' | 'sell';
export type PositionStatus = 'open' | 'closed' | 'cancelled';
export type CloseReason = 'manual' | 'stop_loss' | 'take_profit' | 'expired' | 'liquidated';
export type AssetType = 'Crypto' | 'Stocks';

export interface ITradingPosition extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  positionId: string; // Unique position ID for reference
  type: PositionType;
  assetType: AssetType;
  symbol: string;
  name: string;
  amount: number; // Position size in USD
  entryPrice: number;
  currentPrice: number;
  exitPrice?: number;
  leverage: number;
  stopLoss: number | null;
  takeProfit: number | null;
  duration: string;
  marginUsed: number; // Amount deducted from balance
  pnl: number;
  pnlPercent: number;
  status: PositionStatus;
  closeReason?: CloseReason;
  openedAt: Date;
  closedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface ITradingPositionModel extends Model<ITradingPosition> {
  generatePositionId(): string;
}

const TradingPositionSchema = new Schema<ITradingPosition>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    positionId: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ['buy', 'sell'],
      required: true,
    },
    assetType: {
      type: String,
      enum: ['Crypto', 'Stocks'],
      required: true,
    },
    symbol: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    entryPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    currentPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    exitPrice: {
      type: Number,
      min: 0,
    },
    leverage: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
      default: 1,
    },
    stopLoss: {
      type: Number,
      default: null,
    },
    takeProfit: {
      type: Number,
      default: null,
    },
    duration: {
      type: String,
      required: true,
    },
    marginUsed: {
      type: Number,
      required: true,
      min: 0,
    },
    pnl: {
      type: Number,
      default: 0,
    },
    pnlPercent: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['open', 'closed', 'cancelled'],
      default: 'open',
      index: true,
    },
    closeReason: {
      type: String,
      enum: ['manual', 'stop_loss', 'take_profit', 'expired', 'liquidated'],
    },
    openedAt: {
      type: Date,
      default: Date.now,
    },
    closedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
TradingPositionSchema.index({ userId: 1, status: 1 });
TradingPositionSchema.index({ userId: 1, createdAt: -1 });

// Generate unique position ID
TradingPositionSchema.statics.generatePositionId = function (): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'POS-';
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};

const TradingPosition: ITradingPositionModel =
  (mongoose.models.TradingPosition as ITradingPositionModel) ||
  mongoose.model<ITradingPosition, ITradingPositionModel>('TradingPosition', TradingPositionSchema);

export default TradingPosition;
