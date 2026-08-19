import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// Subscription Model (User subscriptions)
// ============================================

export interface ISubscription extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  planName: string;
  amount: number;
  roiPercent: number;
  expectedReturn: number;
  currentReturn: number;
  status: 'active' | 'completed' | 'cancelled';
  startDate: Date;
  endDate: Date;
  completedAt?: Date;
  releasedAt?: Date;
  releasedBy?: mongoose.Types.ObjectId;
  releaseNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'SubscribePlan',
      required: true,
    },
    planName: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    roiPercent: {
      type: Number,
      required: true,
    },
    expectedReturn: {
      type: Number,
      required: true,
    },
    currentReturn: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
      index: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    completedAt: Date,
    releasedAt: Date,
    releasedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    releaseNote: String,
  },
  { timestamps: true }
);

SubscriptionSchema.index({ userId: 1, status: 1 });
SubscriptionSchema.index({ endDate: 1 });

const Subscription: Model<ISubscription> =
  mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema);

export default Subscription;
