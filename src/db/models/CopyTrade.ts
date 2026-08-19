import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// CopyTrade Model (User copying a trader)
// ============================================

export interface ICopyTrade extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  traderId: mongoose.Types.ObjectId;
  // Snapshot of trader at time of copy
  trader: {
    name: string;
    username: string;
    avatar: string;
    winRate: number;
    profitShare: number; // Percentage of profits shared with trader
  };
  amount: number;
  paymentToken: string;
  paymentTokenIcon: string;
  profitLoss: number;
  tradesCount: number;
  status: 'active' | 'paused' | 'stopped' | 'liquidated';
  stopLoss?: number;
  takeProfit?: number;
  startedAt: Date;
  stoppedAt?: Date;
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CopyTradeSchema = new Schema<ICopyTrade>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    traderId: {
      type: Schema.Types.ObjectId,
      ref: 'Trader',
      required: true,
      index: true,
    },
    trader: {
      name: {
        type: String,
        required: true,
      },
      username: {
        type: String,
        required: true,
      },
      avatar: {
        type: String,
        required: true,
      },
      winRate: {
        type: Number,
        required: true,
      },
      profitShare: {
        type: Number,
        default: 10,
      },
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentToken: {
      type: String,
      required: true,
      default: 'USDT',
    },
    paymentTokenIcon: {
      type: String,
      default: '',
    },
    profitLoss: {
      type: Number,
      default: 0,
    },
    tradesCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'stopped', 'liquidated'],
      default: 'active',
      index: true,
    },
    stopLoss: Number,
    takeProfit: Number,
    startedAt: {
      type: Date,
      default: Date.now,
    },
    stoppedAt: Date,
    adminNote: String,
  },
  { timestamps: true }
);

CopyTradeSchema.index({ userId: 1, traderId: 1 });
CopyTradeSchema.index({ status: 1, createdAt: -1 });

const CopyTrade: Model<ICopyTrade> =
  mongoose.models.CopyTrade || mongoose.model<ICopyTrade>('CopyTrade', CopyTradeSchema);

export default CopyTrade;
