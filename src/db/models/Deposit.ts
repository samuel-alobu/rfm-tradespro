import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// Deposit Model Definition
// ============================================

export interface IDeposit extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  reference: string;
  method: string; // e.g., "BTC (Bitcoin)", "USDT (TRC20)", "Bank Transfer"
  token?: string;
  tokenIcon?: string;
  network?: string;
  walletAddress?: string;
  amount: number;
  amountUsd: number;
  type: 'regular' | 'subscribe' | 'signal';
  status: 'pending' | 'approved' | 'declined';
  paymentProof?: string;
  notes?: string;
  processedBy?: mongoose.Types.ObjectId;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface IDepositModel extends Model<IDeposit> {
  generateReference(): string;
}

// ============================================
// Deposit Schema
// ============================================

const DepositSchema = new Schema<IDeposit>(
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
    method: {
      type: String,
      required: true,
    },
    token: String,
    tokenIcon: String,
    network: String,
    walletAddress: String,
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
    type: {
      type: String,
      enum: ['regular', 'subscribe', 'signal'],
      default: 'regular',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'declined'],
      default: 'pending',
      index: true,
    },
    paymentProof: String,
    notes: String,
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    processedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
DepositSchema.index({ createdAt: -1 });
DepositSchema.index({ userId: 1, status: 1 });

// Static method to generate reference
DepositSchema.statics.generateReference = function (): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'DEP-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const Deposit: IDepositModel =
  (mongoose.models.Deposit as IDepositModel) ||
  mongoose.model<IDeposit, IDepositModel>('Deposit', DepositSchema);

export default Deposit;
