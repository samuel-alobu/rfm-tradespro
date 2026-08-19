import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// Trade Model (User trades)
// ============================================

export interface ITrade extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  // Asset info
  symbol: string;
  symbolIcon?: string;
  market: 'crypto' | 'forex' | 'stocks' | 'commodities';
  // Trade details
  type: 'buy' | 'sell';
  orderType: 'market' | 'limit' | 'stop';
  leverage: number;
  amount: number;
  entryPrice: number;
  currentPrice?: number;
  exitPrice?: number;
  // Risk management
  stopLoss?: number;
  takeProfit?: number;
  // Results
  profitLoss: number;
  profitLossPercent: number;
  fees: number;
  // Status
  status: 'open' | 'closed' | 'cancelled' | 'liquidated';
  closedAt?: Date;
  closeReason?: string;
  // Metadata
  notes?: string;
  signalId?: mongoose.Types.ObjectId;
  copyTradeId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TradeSchema = new Schema<ITrade>(
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
    symbolIcon: String,
    market: {
      type: String,
      enum: ['crypto', 'forex', 'stocks', 'commodities'],
      required: true,
    },
    type: {
      type: String,
      enum: ['buy', 'sell'],
      required: true,
    },
    orderType: {
      type: String,
      enum: ['market', 'limit', 'stop'],
      default: 'market',
    },
    leverage: {
      type: Number,
      default: 1,
      min: 1,
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
    currentPrice: Number,
    exitPrice: Number,
    stopLoss: Number,
    takeProfit: Number,
    profitLoss: {
      type: Number,
      default: 0,
    },
    profitLossPercent: {
      type: Number,
      default: 0,
    },
    fees: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['open', 'closed', 'cancelled', 'liquidated'],
      default: 'open',
      index: true,
    },
    closedAt: Date,
    closeReason: String,
    notes: String,
    signalId: {
      type: Schema.Types.ObjectId,
      ref: 'Signal',
    },
    copyTradeId: {
      type: Schema.Types.ObjectId,
      ref: 'CopyTrade',
    },
  },
  { timestamps: true }
);

TradeSchema.index({ userId: 1, status: 1 });
TradeSchema.index({ status: 1, createdAt: -1 });

const Trade: Model<ITrade> =
  mongoose.models.Trade || mongoose.model<ITrade>('Trade', TradeSchema);

export default Trade;
