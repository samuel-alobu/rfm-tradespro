import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// RealEstateProperty Model (Admin-managed)
// ============================================

export interface IRealEstateProperty extends Document {
  _id: mongoose.Types.ObjectId;
  // Basic info
  name: string;
  slug: string; // URL-friendly slug
  description: string;
  images: string[]; // Multiple Cloudinary URLs
  // Investment details
  minimum: number;
  roi: number;
  durationDays: number; // How long until ROI can be released
  strategy: 'fixed_income' | 'growth' | 'hybrid' | 'opportunistic';
  // Project overview
  projectOverview: string;
  // Project breakdown
  breakdown: {
    text: string;
    type: string;
    location: string;
    strategy: string;
    status: 'funding' | 'in_progress' | 'completed';
  };
  // Why sections (optional bullet points)
  whyThisProject?: string[];
  whyThisSponsor?: string[];
  // Documents (admin uploads PDFs)
  documents: {
    title: string;
    slug: string; // URL-friendly document name
    url: string;
    publicId?: string; // Cloudinary public ID
    order: number;
  }[];
  // Funding status
  targetAmount: number;
  raisedAmount: number;
  percentFunded: number;
  investors: number;
  // Dates
  fundingDeadline?: Date;
  projectStartDate?: Date;
  expectedCompletionDate?: Date;
  // Status
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  // Admin
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    trim: true,
  },
  url: {
    type: String,
    required: true,
  },
  publicId: {
    type: String,
  },
  order: {
    type: Number,
    default: 0,
  },
});

const BreakdownSchema = new Schema({
  text: {
    type: String,
    required: true,
  },
  type: {
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
  status: {
    type: String,
    enum: ['funding', 'in_progress', 'completed'],
    default: 'funding',
  },
});

const RealEstatePropertySchema = new Schema<IRealEstateProperty>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    images: [{
      type: String,
    }],
    minimum: {
      type: Number,
      required: true,
      min: 0,
    },
    roi: {
      type: Number,
      required: true,
    },
    durationDays: {
      type: Number,
      default: 365,
      min: 1,
    },
    strategy: {
      type: String,
      enum: ['fixed_income', 'growth', 'hybrid', 'opportunistic'],
      required: true,
    },
    projectOverview: {
      type: String,
      required: true,
    },
    breakdown: BreakdownSchema,
    whyThisProject: [{
      type: String,
      trim: true,
    }],
    whyThisSponsor: [{
      type: String,
      trim: true,
    }],
    documents: [DocumentSchema],
    targetAmount: {
      type: Number,
      required: true,
    },
    raisedAmount: {
      type: Number,
      default: 0,
    },
    percentFunded: {
      type: Number,
      default: 0,
    },
    investors: {
      type: Number,
      default: 0,
    },
    fundingDeadline: Date,
    projectStartDate: Date,
    expectedCompletionDate: Date,
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
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Generate slug from name and update percentFunded before save
RealEstatePropertySchema.pre('save', function (next) {
  // Generate slug if not set
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  
  // Calculate percent funded
  if (this.targetAmount > 0) {
    this.percentFunded = Math.round((this.raisedAmount / this.targetAmount) * 100);
  }
  next();
});

RealEstatePropertySchema.index({ isActive: 1, sortOrder: 1 });
RealEstatePropertySchema.index({ strategy: 1, isActive: 1 });

const RealEstateProperty: Model<IRealEstateProperty> =
  mongoose.models.RealEstateProperty || mongoose.model<IRealEstateProperty>('RealEstateProperty', RealEstatePropertySchema);

export default RealEstateProperty;
