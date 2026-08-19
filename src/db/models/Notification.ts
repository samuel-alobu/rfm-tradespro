import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// Notification Model
// ============================================

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: 'deposit_approved' | 'deposit_declined' | 'withdrawal_approved' | 'withdrawal_declined' | 'subscription_complete' | 'trade' | 'system' | 'info';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['deposit_approved', 'deposit_declined', 'withdrawal_approved', 'withdrawal_declined', 'subscription_complete', 'trade', 'system', 'info'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
