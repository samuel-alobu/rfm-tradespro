import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// Cold Storage Model
// Stores user's assets in cold storage
// ============================================

export interface IColdStorage extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  symbol: string;
  name: string;
  type: 'crypto' | 'stock';
  icon: string;
  quantity: number;
  purchasePrice: number; // Price at time of deposit
  currentPrice: number; // Current market price (can be edited by admin)
  currentValue: number; // quantity * currentPrice
  status: 'active' | 'withdrawn';
  createdAt: Date;
  updatedAt: Date;
}

const ColdStorageSchema = new Schema<IColdStorage>(
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
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['crypto', 'stock'],
      default: 'crypto',
    },
    icon: {
      type: String,
      default: '',
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    purchasePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    currentPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    currentValue: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['active', 'withdrawn'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
ColdStorageSchema.index({ userId: 1, symbol: 1, status: 1 });

// Pre-save hook to calculate current value
ColdStorageSchema.pre('save', function (next) {
  this.currentValue = this.quantity * this.currentPrice;
  next();
});

const ColdStorage: Model<IColdStorage> =
  mongoose.models.ColdStorage || mongoose.model<IColdStorage>('ColdStorage', ColdStorageSchema);

export default ColdStorage;
