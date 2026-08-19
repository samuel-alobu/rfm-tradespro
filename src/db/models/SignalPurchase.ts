import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// SignalPurchase Model (User signal purchases)
// ============================================

export interface ISignalPurchase extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  signalId: mongoose.Types.ObjectId;
  signalName: string;
  signalPrice: number;
  signalStrength: number;
  amount: number;
  status: 'active' | 'completed' | 'expired';
  purchasedAt: Date;
  expiresAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SignalPurchaseSchema = new Schema<ISignalPurchase>(
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
    signalName: {
      type: String,
      required: true,
    },
    signalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    signalStrength: {
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
    status: {
      type: String,
      enum: ['active', 'completed', 'expired'],
      default: 'active',
    },
    purchasedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

SignalPurchaseSchema.index({ userId: 1, status: 1 });
SignalPurchaseSchema.index({ signalId: 1 });

const SignalPurchase: Model<ISignalPurchase> =
  mongoose.models.SignalPurchase || mongoose.model<ISignalPurchase>('SignalPurchase', SignalPurchaseSchema);

export default SignalPurchase;
