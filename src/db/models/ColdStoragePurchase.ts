import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// ColdStoragePurchase Model (User cold storage purchases)
// ============================================

export interface IColdStoragePurchase extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  reference: string;
  // Asset info
  asset: {
    id: string;
    name: string;
    symbol: string;
    image: string;
  };
  // Purchase details
  type: 'buy' | 'sell';
  amount: number; // Amount in asset
  amountUsd: number; // USD value at time of purchase
  pricePerUnit: number;
  // Fees
  fee: number;
  feeUsd: number;
  // Status
  status: 'pending' | 'completed' | 'cancelled' | 'failed';
  // Admin
  adminNote?: string;
  processedBy?: mongoose.Types.ObjectId;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ColdStoragePurchaseSchema = new Schema<IColdStoragePurchase>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reference: {
      type: String,
      required: true,
      unique: true,
    },
    asset: {
      id: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      symbol: {
        type: String,
        required: true,
      },
      image: {
        type: String,
        required: true,
      },
    },
    type: {
      type: String,
      enum: ['buy', 'sell'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    amountUsd: {
      type: Number,
      required: true,
      min: 0,
    },
    pricePerUnit: {
      type: Number,
      required: true,
    },
    fee: {
      type: Number,
      default: 0,
    },
    feeUsd: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled', 'failed'],
      default: 'pending',
      index: true,
    },
    adminNote: String,
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    processedAt: Date,
  },
  { timestamps: true }
);

// Generate reference before save
ColdStoragePurchaseSchema.pre('save', function (next) {
  if (!this.reference) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.reference = `CS-${timestamp}-${random}`;
  }
  next();
});

ColdStoragePurchaseSchema.index({ userId: 1, status: 1 });
ColdStoragePurchaseSchema.index({ createdAt: -1 });

const ColdStoragePurchase: Model<IColdStoragePurchase> =
  mongoose.models.ColdStoragePurchase || mongoose.model<IColdStoragePurchase>('ColdStoragePurchase', ColdStoragePurchaseSchema);

export default ColdStoragePurchase;
