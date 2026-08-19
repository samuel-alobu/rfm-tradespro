import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// Withdrawal Model Definition
// ============================================

export interface IWithdrawal extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  reference: string;
  method: string;
  // Crypto fields
  token?: string;
  network?: string;
  walletAddress?: string;
  txHash?: string;
  // Bank fields
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  routingNumber?: string;
  swiftCode?: string;
  // Amount
  amount: number;
  amountUsd: number;
  fee: number;
  netAmount: number;
  // Status
  status: 'pending' | 'approved' | 'declined';
  declineReason?: string;
  notes?: string;
  processedBy?: mongoose.Types.ObjectId;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface IWithdrawalModel extends Model<IWithdrawal> {
  generateReference(): string;
}

const WithdrawalSchema = new Schema<IWithdrawal>(
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
    // Crypto
    token: String,
    network: String,
    walletAddress: String,
    txHash: String,
    // Bank
    bankName: String,
    accountName: String,
    accountNumber: String,
    routingNumber: String,
    swiftCode: String,
    // Amount
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
    fee: {
      type: Number,
      default: 0,
    },
    netAmount: {
      type: Number,
      required: true,
    },
    // Status
    status: {
      type: String,
      enum: ['pending', 'approved', 'declined'],
      default: 'pending',
      index: true,
    },
    declineReason: String,
    notes: String,
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    processedAt: Date,
  },
  { timestamps: true }
);

WithdrawalSchema.index({ createdAt: -1 });
WithdrawalSchema.index({ userId: 1, status: 1 });

WithdrawalSchema.statics.generateReference = function (): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'WTH-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const Withdrawal: IWithdrawalModel =
  (mongoose.models.Withdrawal as IWithdrawalModel) ||
  mongoose.model<IWithdrawal, IWithdrawalModel>('Withdrawal', WithdrawalSchema);

export default Withdrawal;
