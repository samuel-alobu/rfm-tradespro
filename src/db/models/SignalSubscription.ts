import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// SignalSubscription Model (User signal subscriptions)
// ============================================

export interface ISignalSubscription extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  signalId: mongoose.Types.ObjectId;
  // Signal snapshot
  signal: {
    title: string;
    pair: string;
    type: 'buy' | 'sell';
    price: number;
    strength: number;
  };
  // Investment
  amount: number;
  entryPrice: number;
  // Results
  profitLoss: number;
  profitLossPercent: number;
  // Status
  status: 'active' | 'closed' | 'expired';
  closedAt?: Date;
  closeReason?: string;
  // Admin
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SignalSubscriptionSchema = new Schema<ISignalSubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    signalId: {
      type: Schema.Types.ObjectId,
      ref: 'Signal',
      required: true,
    },
    signal: {
      title: {
        type: String,
        required: true,
      },
      pair: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ['buy', 'sell'],
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      strength: {
        type: Number,
        required: true,
      },
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
    profitLoss: {
      type: Number,
      default: 0,
    },
    profitLossPercent: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'closed', 'expired'],
      default: 'active',
      index: true,
    },
    closedAt: Date,
    closeReason: String,
    adminNote: String,
  },
  { timestamps: true }
);

SignalSubscriptionSchema.index({ userId: 1, status: 1 });
SignalSubscriptionSchema.index({ signalId: 1 });

const SignalSubscription: Model<ISignalSubscription> =
  mongoose.models.SignalSubscription || mongoose.model<ISignalSubscription>('SignalSubscription', SignalSubscriptionSchema);

export default SignalSubscription;
