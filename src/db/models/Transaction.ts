import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// Transaction Model (Unified history)
// ============================================

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: 'deposit' | 'withdrawal' | 'trade_profit' | 'trade_loss' | 'subscription' | 'signal' | 'copy_trade' | 'referral' | 'bonus' | 'fee';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  reference?: string;
  relatedId?: mongoose.Types.ObjectId;
  relatedModel?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'trade_profit', 'trade_loss', 'subscription', 'signal', 'copy_trade', 'referral', 'bonus', 'fee'],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    balanceBefore: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'completed',
    },
    description: {
      type: String,
      required: true,
    },
    reference: String,
    relatedId: {
      type: Schema.Types.ObjectId,
    },
    relatedModel: String,
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ type: 1, createdAt: -1 });

const Transaction: Model<ITransaction> =
  mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;
