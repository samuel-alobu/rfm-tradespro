import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// SiteSettings Model
// Stores global platform configuration
// ============================================

export interface ISiteSettings extends Document {
  _id: mongoose.Types.ObjectId;
  
  // Maintenance
  maintenanceMode: boolean;
  maintenanceMessage: string;
  
  // Security
  requireKycForWithdrawal: boolean;
  sessionTimeoutMinutes: number;
  autoLogoutEnabled: boolean;
  
  // Withdrawal Limits
  withdrawalMinimum: number;
  withdrawalDailyLimitUnverified: number;
  withdrawalDailyLimitVerified: number;
  withdrawalMonthlyLimitUnverified: number;
  withdrawalMonthlyLimitVerified: number;
  
  // Deposit Settings
  depositMinimum: number;
  depositMaximum: number;
  
  // Notification Settings
  depositAlertEmail: string;
  depositAlertEnabled: boolean;
  
  updatedAt: Date;
  updatedBy: mongoose.Types.ObjectId;
}

const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    // Maintenance
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    maintenanceMessage: {
      type: String,
      default: 'We are currently performing scheduled maintenance. Please check back soon.',
    },
    
    // Security
    requireKycForWithdrawal: {
      type: Boolean,
      default: true,
    },
    sessionTimeoutMinutes: {
      type: Number,
      default: 30,
    },
    autoLogoutEnabled: {
      type: Boolean,
      default: true,
    },
    
    // Withdrawal Limits
    withdrawalMinimum: {
      type: Number,
      default: 10,
    },
    withdrawalDailyLimitUnverified: {
      type: Number,
      default: 1000,
    },
    withdrawalDailyLimitVerified: {
      type: Number,
      default: 100000,
    },
    withdrawalMonthlyLimitUnverified: {
      type: Number,
      default: 5000,
    },
    withdrawalMonthlyLimitVerified: {
      type: Number,
      default: 1000000,
    },
    
    // Deposit Settings
    depositMinimum: {
      type: Number,
      default: 100,
    },
    depositMaximum: {
      type: Number,
      default: 1000000,
    },
    
    // Notification Settings
    depositAlertEmail: {
      type: String,
      default: '',
    },
    depositAlertEnabled: {
      type: Boolean,
      default: true,
    },
    
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const SiteSettings: Model<ISiteSettings> =
  mongoose.models.SiteSettings || mongoose.model<ISiteSettings>('SiteSettings', SiteSettingsSchema);

export default SiteSettings;
