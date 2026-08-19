import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// RealEstateInvestment Model (User property investments)
// ============================================

export interface IRealEstateInvestment extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  // Property snapshot
  property: {
    name: string;
    image: string;
    location: string;
    strategy: string;
    roi: number;
  };
  // Investment details
  amount: number;
  shares: number; // Percentage of property owned
  expectedReturn: number;
  currentReturn: number;
  // Duration
  durationDays: number;
  // Dates
  investedAt: Date;
  expiresAt: Date;
  maturityDate?: Date;
  // Status
  status: 'active' | 'matured' | 'cashed_out' | 'withdrawn' | 'cancelled';
  // Release info (admin releases funds when duration is met)
  releasedAt?: Date;
  releasedBy?: mongoose.Types.ObjectId;
  releasedAmount?: number;
  releaseNote?: string;
  // Payouts
  totalPaid: number;
  lastPayoutDate?: Date;
  payoutHistory: {
    amount: number;
    date: Date;
    type: 'dividend' | 'capital_return' | 'final';
  }[];
  // Admin
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PayoutSchema = new Schema({
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  type: {
    type: String,
    enum: ['dividend', 'capital_return', 'final'],
    required: true,
  },
});

const RealEstateInvestmentSchema = new Schema<IRealEstateInvestment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: 'RealEstateProperty',
      required: true,
    },
    property: {
      name: {
        type: String,
        required: true,
      },
      image: {
        type: String,
        required: true,
      },
      location: {
        type: String,
        required: true,
      },
      strategy: {
        type: String,
        required: true,
      },
      roi: {
        type: Number,
        required: true,
      },
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    shares: {
      type: Number,
      required: true,
      min: 0,
    },
    expectedReturn: {
      type: Number,
      required: true,
    },
    currentReturn: {
      type: Number,
      default: 0,
    },
    durationDays: {
      type: Number,
      required: true,
      default: 365,
    },
    investedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    maturityDate: Date,
    status: {
      type: String,
      enum: ['active', 'matured', 'cashed_out', 'withdrawn', 'cancelled'],
      default: 'active',
      index: true,
    },
    releasedAt: Date,
    releasedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    releasedAmount: Number,
    releaseNote: String,
    totalPaid: {
      type: Number,
      default: 0,
    },
    lastPayoutDate: Date,
    payoutHistory: [PayoutSchema],
    adminNote: String,
  },
  { timestamps: true }
);

RealEstateInvestmentSchema.index({ userId: 1, status: 1 });
RealEstateInvestmentSchema.index({ propertyId: 1 });

const RealEstateInvestment: Model<IRealEstateInvestment> =
  mongoose.models.RealEstateInvestment || mongoose.model<IRealEstateInvestment>('RealEstateInvestment', RealEstateInvestmentSchema);

export default RealEstateInvestment;
