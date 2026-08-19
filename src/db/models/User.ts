import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

// ============================================
// User Model Definition
// ============================================

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  phone?: string;
  country?: string;
  role: 'user' | 'admin' | 'super_admin';
  status: 'pending' | 'active' | 'suspended' | 'banned' | 'deleted';
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  accountLevel: 'starter' | 'bronze' | 'silver' | 'gold' | 'vip';
  accountLevelRequest?: {
    requestedLevel: 'bronze' | 'silver' | 'gold' | 'vip';
    status: 'pending' | 'approved' | 'rejected';
    requestedAt: Date;
    reviewedAt?: Date;
    reviewedBy?: mongoose.Types.ObjectId;
  };
  kycDocuments?: {
    type: 'id_card' | 'passport' | 'drivers_license' | 'proof_of_address';
    url: string;
    status: 'pending' | 'approved' | 'rejected';
    uploadedAt: Date;
    reviewedAt?: Date;
    reviewedBy?: mongoose.Types.ObjectId;
    rejectionReason?: string;
  }[];
  referralCode: string;
  referredBy?: mongoose.Types.ObjectId;
  totalBalance: number;
  availableBalance: number;
  lockedBalance: number;
  subscribeBalance: number;
  signalBalance: number;
  realEstateBalance: number;
  referralBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalProfit: number;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  twoFactorCode?: string;
  twoFactorExpires?: Date;
  deleteAccountCode?: string;
  deleteAccountExpires?: Date;
  deletedAt?: Date;
  deletedReason?: string;
  lastLoginAt?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
  notifications?: {
    type: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: Date;
  }[];
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateReferralCode(): string;
  isLocked(): boolean;
  fullName: string;
}

interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
  findByReferralCode(code: string): Promise<IUser | null>;
}

// ============================================
// KYC Document Schema
// ============================================

const KYCDocumentSchema = new Schema({
  type: {
    type: String,
    enum: ['id_card', 'passport', 'drivers_license', 'proof_of_address'],
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  reviewedAt: Date,
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  rejectionReason: String,
});

// ============================================
// User Schema
// ============================================

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      // index is created via schema.index() below
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't include password by default
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    avatar: {
      type: String,
      default: null,
    },
    phone: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'super_admin'],
      default: 'user',
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'suspended', 'banned', 'deleted'],
      default: 'pending',
    },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'],
      default: 'unverified',
    },
    accountLevel: {
      type: String,
      enum: ['starter', 'bronze', 'silver', 'gold', 'vip'],
      default: 'starter',
    },
    accountLevelRequest: {
      requestedLevel: {
        type: String,
        enum: ['bronze', 'silver', 'gold', 'vip'],
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
      },
      requestedAt: Date,
      reviewedAt: Date,
      reviewedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    kycDocuments: [KYCDocumentSchema],
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      // index is created via schema.index() below
    },
    referredBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    totalBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    availableBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    lockedBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    subscribeBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    signalBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    realEstateBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    referralBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDeposits: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalWithdrawals: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalProfit: {
      type: Number,
      default: 0,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: String,
    twoFactorCode: String,
    twoFactorExpires: Date,
    deleteAccountCode: String,
    deleteAccountExpires: Date,
    deletedAt: Date,
    deletedReason: String,
    lastLoginAt: Date,
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
    notifications: [{
      type: { type: String }, // "type" is reserved in Mongoose, must wrap it
      title: { type: String },
      message: { type: String },
      read: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now },
    }],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.password;
        delete ret.emailVerificationToken;
        delete ret.passwordResetToken;
        delete ret.twoFactorSecret;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

// ============================================
// Indexes (only compound/additional - unique fields already indexed)
// ============================================

UserSchema.index({ role: 1, status: 1 });
UserSchema.index({ createdAt: -1 });

// ============================================
// Virtual Fields
// ============================================

UserSchema.virtual('fullName').get(function (this: IUser) {
  return `${this.firstName} ${this.lastName}`;
});

// ============================================
// Pre-save Middleware
// ============================================

UserSchema.pre('save', async function () {
  // Generate referral code if not exists
  if (!this.referralCode) {
    this.referralCode = this.generateReferralCode();
  }
  
  // Hash password if modified
  if (!this.isModified('password')) {
    return;
  }
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ============================================
// Instance Methods
// ============================================

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch {
    return false;
  }
};

UserSchema.methods.generateReferralCode = function (): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

UserSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

// ============================================
// Static Methods
// ============================================

UserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

UserSchema.statics.findByReferralCode = function (code: string) {
  return this.findOne({ referralCode: code.toUpperCase() });
};

// ============================================
// Export Model
// ============================================

const User: IUserModel =
  (mongoose.models.User as IUserModel) ||
  mongoose.model<IUser, IUserModel>('User', UserSchema);

export default User;
