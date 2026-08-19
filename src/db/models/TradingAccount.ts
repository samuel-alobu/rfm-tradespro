import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// TradingAccount Model
// Tracks user's trading balance and statistics
// ============================================

export interface ITradingAccount extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  balance: number; // Available balance for trading
  totalDeposited: number; // Total amount funded into trading
  totalWithdrawn: number; // Total amount withdrawn from trading
  totalPnl: number; // Total profit/loss from all trades
  totalTrades: number; // Number of trades executed
  winningTrades: number; // Number of profitable trades
  losingTrades: number; // Number of losing trades
  createdAt: Date;
  updatedAt: Date;
}

const TradingAccountSchema = new Schema<ITradingAccount>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalDeposited: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalWithdrawn: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPnl: {
      type: Number,
      default: 0,
    },
    totalTrades: {
      type: Number,
      default: 0,
      min: 0,
    },
    winningTrades: {
      type: Number,
      default: 0,
      min: 0,
    },
    losingTrades: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const TradingAccount: Model<ITradingAccount> =
  mongoose.models.TradingAccount || mongoose.model<ITradingAccount>('TradingAccount', TradingAccountSchema);

export default TradingAccount;
