import mongoose, { Schema, Document } from 'mongoose';

// ============================================
// Deposit Token Model (Admin-managed)
// ============================================

export interface IDepositToken extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  symbol: string;
  image: string;
  networks: {
    name: string;
    address: string;
    isActive: boolean;
  }[];
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const NetworkSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: String,
    required: true,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

const DepositTokenSchema = new Schema<IDepositToken>(
  {
    name: {
      type: String,
      required: [true, 'Token name is required'],
      trim: true,
    },
    symbol: {
      type: String,
      required: [true, 'Token symbol is required'],
      uppercase: true,
      trim: true,
    },
    image: {
      type: String,
      required: [true, 'Token image is required'],
    },
    networks: [NetworkSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

DepositTokenSchema.index({ isActive: 1, order: 1 });

const DepositToken =
  mongoose.models.DepositToken ||
  mongoose.model<IDepositToken>('DepositToken', DepositTokenSchema);

export default DepositToken;
