import { z } from 'zod';

// ============================================
// Authentication Schemas
// ============================================

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(1, 'First name is required')
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name cannot exceed 50 characters')
      .regex(/^[a-zA-Z\s-]+$/, 'First name can only contain letters'),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name cannot exceed 50 characters')
      .regex(/^[a-zA-Z\s-]+$/, 'Last name can only contain letters'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    phone: z
      .string()
      .min(1, 'Phone number is required')
      .refine(
        (val) => /^\+?[1-9]\d{6,14}$/.test(val),
        'Please enter a valid phone number'
      ),
    country: z
      .string()
      .min(1, 'Country is required')
      .min(2, 'Please enter a valid country'),
    referralCode: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^[A-Z0-9]{6,10}$/.test(val.toUpperCase()),
        'Invalid referral code format'
      ),
    agreeToTerms: z
      .boolean()
      .refine((val) => val === true, {
        message: 'You must agree to the terms and conditions',
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    token: z.string().min(1, 'Reset token is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// ============================================
// Profile & Settings Schemas
// ============================================

export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters')
    .regex(/^[a-zA-Z\s-]+$/, 'First name can only contain letters')
    .optional(),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters')
    .regex(/^[a-zA-Z\s-]+$/, 'Last name can only contain letters')
    .optional(),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\+?[1-9]\d{6,14}$/.test(val),
      'Please enter a valid phone number'
    ),
  country: z.string().optional(),
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(1, 'New password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// ============================================
// Financial Schemas
// ============================================

const paymentMethodDeposit = ['bank_transfer', 'card', 'crypto', 'wire'] as const;
const paymentMethodWithdrawal = ['bank_transfer', 'crypto', 'wire'] as const;

export const depositSchema = z.object({
  amount: z
    .number()
    .min(10, 'Minimum deposit amount is $10')
    .max(1000000, 'Maximum deposit amount is $1,000,000'),
  method: z.enum(paymentMethodDeposit, {
    message: 'Please select a payment method',
  }),
  walletAddress: z.string().optional(),
});

export type DepositFormData = z.infer<typeof depositSchema>;

export const withdrawalSchema = z.object({
  amount: z
    .number()
    .min(50, 'Minimum withdrawal amount is $50')
    .max(500000, 'Maximum withdrawal amount is $500,000'),
  method: z.enum(paymentMethodWithdrawal, {
    message: 'Please select a withdrawal method',
  }),
  destinationAddress: z.string().optional(),
  bankName: z.string().optional(),
  accountName: z.string().optional(),
  accountNumber: z.string().optional(),
  routingNumber: z.string().optional(),
});

export type WithdrawalFormData = z.infer<typeof withdrawalSchema>;

// ============================================
// Trading Schemas
// ============================================

const tradeTypes = ['buy', 'sell'] as const;
const orderTypes = ['market', 'limit'] as const;

export const tradeSchema = z.object({
  assetSymbol: z.string().min(1, 'Please select an asset'),
  type: z.enum(tradeTypes, {
    message: 'Please select trade type',
  }),
  orderType: z.enum(orderTypes, {
    message: 'Please select order type',
  }),
  amount: z.number().min(0.00001, 'Amount is too small'),
  price: z.number().optional(),
  stopLoss: z.number().optional(),
  takeProfit: z.number().optional(),
});

export type TradeFormData = z.infer<typeof tradeSchema>;

// ============================================
// Wallet Schemas
// ============================================

const walletTypes = ['ethereum', 'bitcoin', 'solana'] as const;

export const importWalletSchema = z.object({
  type: z.enum(walletTypes, {
    message: 'Please select wallet type',
  }),
  seedPhrase: z
    .string()
    .min(1, 'Seed phrase is required')
    .refine(
      (val) => {
        const words = val.trim().split(/\s+/);
        return words.length === 12 || words.length === 24;
      },
      'Seed phrase must be 12 or 24 words'
    ),
  label: z.string().max(50, 'Label cannot exceed 50 characters').optional(),
});

export type ImportWalletFormData = z.infer<typeof importWalletSchema>;

// ============================================
// Real Estate Schemas
// ============================================

export const investmentSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  amount: z.number().min(1000, 'Minimum investment is $1,000'),
});

export type InvestmentFormData = z.infer<typeof investmentSchema>;

// ============================================
// Copy Trading Schemas
// ============================================

export const copyTradingSchema = z.object({
  expertId: z.string().min(1, 'Expert ID is required'),
  amount: z.number().min(100, 'Minimum copy amount is $100'),
});

export type CopyTradingFormData = z.infer<typeof copyTradingSchema>;

// ============================================
// Contact / Support Schemas
// ============================================

export const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z
    .string()
    .min(20, 'Message must be at least 20 characters')
    .max(2000, 'Message cannot exceed 2000 characters'),
});

export type ContactFormData = z.infer<typeof contactSchema>;
