import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// StockPosition Model
// Tracks user's stock investments
// ============================================

export interface IStockPosition extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  symbol: string;
  name: string;
  icon: string;
  quantity: number;
  purchasePrice: number; // Average purchase price per share
  currentPrice: number; // Current market price (can be edited by admin)
  currentValue: number; // quantity * currentPrice
  totalInvested: number; // Total USD invested
  status: 'active' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

const StockPositionSchema = new Schema<IStockPosition>(
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
    icon: {
      type: String,
      default: '',
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    purchasePrice: {
      type: Number,
      required: true,
      default: 0,
    },
    currentPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    currentValue: {
      type: Number,
      required: true,
      default: 0,
    },
    totalInvested: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'closed'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index
StockPositionSchema.index({ userId: 1, symbol: 1, status: 1 });

// Pre-save hook to calculate current value
StockPositionSchema.pre('save', function (next) {
  this.currentValue = this.quantity * this.currentPrice;
  next();
});

const StockPosition: Model<IStockPosition> =
  mongoose.models.StockPosition || mongoose.model<IStockPosition>('StockPosition', StockPositionSchema);

export default StockPosition;
