import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// SubscribePlan Model (Admin-managed)
// ============================================

export interface ISubscribePlan extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  minAmount: number;
  maxAmount: number;
  durationDays: number;
  roiPercent: number;
  features: string[];
  color: string;
  icon: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  totalSubscribers: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SubscribePlanSchema = new Schema<ISubscribePlan>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    minAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    maxAmount: {
      type: Number,
      required: true,
    },
    durationDays: {
      type: Number,
      required: true,
      min: 1,
    },
    roiPercent: {
      type: Number,
      required: true,
    },
    features: [{
      type: String,
    }],
    color: {
      type: String,
      default: '#22c55e',
    },
    icon: {
      type: String,
      default: 'Zap',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    totalSubscribers: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

SubscribePlanSchema.index({ isActive: 1, sortOrder: 1 });

const SubscribePlan: Model<ISubscribePlan> =
  mongoose.models.SubscribePlan || mongoose.model<ISubscribePlan>('SubscribePlan', SubscribePlanSchema);

export default SubscribePlan;
