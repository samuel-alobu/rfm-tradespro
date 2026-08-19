// ============================================
// ELITE PRO CAPITAL - TYPE DEFINITIONS
// ============================================

// ============================================
// User Types
// ============================================

export type UserRole = 'user' | 'admin' | 'super_admin';

export type UserStatus = 'pending' | 'active' | 'suspended' | 'banned' | 'deleted';

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface User {
  _id: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  phone?: string;
  country?: string;
  role: UserRole;
  status: UserStatus;
  verificationStatus: VerificationStatus;
  kycDocuments?: KYCDocument[];
  referralCode: string;
  referredBy?: string;
  totalBalance: number;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface KYCDocument {
  type: 'id_card' | 'passport' | 'drivers_license' | 'proof_of_address';
  url: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
}

// ============================================
// Authentication Types
// ============================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  country?: string;
  referralCode?: string;
}

export interface AuthSession {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    avatar?: string;
  };
  accessToken: string;
  expiresAt: number;
}

// ============================================
// Financial Types
// ============================================

export type TransactionType = 'deposit' | 'withdrawal' | 'trade' | 'transfer' | 'stake' | 'referral_bonus' | 'copy_trading';

export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'rejected';

export type PaymentMethod = 'bank_transfer' | 'card' | 'crypto' | 'wire';

export interface Transaction {
  _id: string;
  userId: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: string;
  fee?: number;
  reference: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
  processedBy?: string;
}

export interface Deposit {
  _id: string;
  userId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: TransactionStatus;
  reference: string;
  walletAddress?: string;
  transactionHash?: string;
  bankDetails?: BankDetails;
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
}

export interface Withdrawal {
  _id: string;
  userId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: TransactionStatus;
  reference: string;
  destinationAddress?: string;
  bankDetails?: BankDetails;
  fee: number;
  netAmount: number;
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
  processedBy?: string;
}

export interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingNumber?: string;
  swiftCode?: string;
  iban?: string;
}

// ============================================
// Portfolio & Assets Types
// ============================================

export interface Portfolio {
  _id: string;
  userId: string;
  totalValue: number;
  totalInvested: number;
  totalProfit: number;
  profitPercentage: number;
  assets: PortfolioAsset[];
  updatedAt: Date;
}

export interface PortfolioAsset {
  assetId: string;
  symbol: string;
  name: string;
  type: AssetType;
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  value: number;
  profit: number;
  profitPercentage: number;
}

export type AssetType = 'crypto' | 'stock' | 'forex' | 'commodity' | 'real_estate';

export interface Asset {
  _id: string;
  symbol: string;
  name: string;
  type: AssetType;
  icon?: string;
  price: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  marketCap?: number;
  volume24h?: number;
  high24h?: number;
  low24h?: number;
  circulatingSupply?: number;
  totalSupply?: number;
  rank?: number;
  isActive: boolean;
  lastUpdated: Date;
}

// ============================================
// Trading Types
// ============================================

export type TradeType = 'buy' | 'sell';
export type OrderType = 'market' | 'limit' | 'stop_loss' | 'take_profit';
export type TradeStatus = 'pending' | 'open' | 'filled' | 'partially_filled' | 'cancelled' | 'expired';

export interface Trade {
  _id: string;
  userId: string;
  assetId: string;
  symbol: string;
  type: TradeType;
  orderType: OrderType;
  status: TradeStatus;
  quantity: number;
  price: number;
  totalValue: number;
  fee: number;
  stopLoss?: number;
  takeProfit?: number;
  expiresAt?: Date;
  executedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Copy Trading Types
// ============================================

export interface CopyTradingExpert {
  _id: string;
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  isVerified: boolean;
  subscribers: number;
  winRate: number;
  profitShare: number;
  totalWins: number;
  totalLosses: number;
  totalTrades: number;
  minStartup: number;
  tags?: string[];
  performance: ExpertPerformance[];
  isActive: boolean;
  createdAt: Date;
}

export interface ExpertPerformance {
  month: string;
  profit: number;
  profitPercentage: number;
  trades: number;
  wins: number;
}

export interface CopyTradingSubscription {
  _id: string;
  userId: string;
  expertId: string;
  amount: number;
  profitShare: number;
  status: 'active' | 'paused' | 'stopped';
  totalProfit: number;
  totalTrades: number;
  startedAt: Date;
  stoppedAt?: Date;
}

// ============================================
// Wallet Types
// ============================================

export type WalletStatus = 'pending' | 'active' | 'rejected' | 'suspended';

export interface Wallet {
  _id: string;
  userId: string;
  address: string;
  type: 'ethereum' | 'bitcoin' | 'solana' | 'other';
  label?: string;
  status: WalletStatus;
  balance?: number;
  isDefault: boolean;
  createdAt: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
}

// ============================================
// Real Estate Types
// ============================================

export type ProjectStatus = 'open' | 'closed' | 'funded' | 'completed';
export type InvestmentStrategy = 'fixed_income' | 'growth_income' | 'opportunistic';

export interface RealEstateProject {
  _id: string;
  title: string;
  description: string;
  shortDescription: string;
  images: string[];
  location: string;
  type: string;
  strategy: InvestmentStrategy;
  minimumInvestment: number;
  targetRaise: number;
  currentRaise: number;
  roi: number;
  stories?: number;
  objective?: string;
  status: ProjectStatus;
  documents?: ProjectDocument[];
  timeline?: ProjectTimeline[];
  investors: number;
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectDocument {
  title: string;
  url: string;
  type: 'prospectus' | 'financial' | 'legal' | 'other';
}

export interface ProjectTimeline {
  date: Date;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming';
}

export interface RealEstateInvestment {
  _id: string;
  userId: string;
  projectId: string;
  amount: number;
  shares?: number;
  status: 'pending' | 'active' | 'matured' | 'withdrawn';
  expectedReturn: number;
  actualReturn?: number;
  investedAt: Date;
  maturityDate?: Date;
}

// ============================================
// Signals & Staking Types
// ============================================

export interface Signal {
  _id: string;
  assetId: string;
  symbol: string;
  type: 'buy' | 'sell' | 'hold';
  strength: 'weak' | 'moderate' | 'strong';
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  accuracy?: number;
  description?: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface StakePool {
  _id: string;
  assetId: string;
  symbol: string;
  name: string;
  apy: number;
  minStake: number;
  maxStake?: number;
  lockPeriod: number; // in days
  totalStaked: number;
  participants: number;
  isActive: boolean;
}

export interface Stake {
  _id: string;
  userId: string;
  poolId: string;
  amount: number;
  earnedRewards: number;
  status: 'active' | 'unstaking' | 'completed';
  stakedAt: Date;
  unlocksAt: Date;
  unstakedAt?: Date;
}

// ============================================
// Referral Types
// ============================================

export interface Referral {
  _id: string;
  referrerId: string;
  referredId: string;
  status: 'pending' | 'active' | 'rewarded';
  rewardAmount?: number;
  rewardPaid: boolean;
  createdAt: Date;
  activatedAt?: Date;
  rewardPaidAt?: Date;
}

export interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  pendingReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
}

// ============================================
// Subscription Types
// ============================================

export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'enterprise';

export interface Subscription {
  _id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: 'active' | 'cancelled' | 'expired';
  amount: number;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
}

// ============================================
// Notification Types
// ============================================

export type NotificationType = 
  | 'deposit_received'
  | 'withdrawal_approved'
  | 'withdrawal_rejected'
  | 'trade_executed'
  | 'price_alert'
  | 'copy_trade'
  | 'referral_bonus'
  | 'system'
  | 'kyc_update';

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
}

// ============================================
// Admin Types
// ============================================

export interface AdminLog {
  _id: string;
  adminId: string;
  action: string;
  targetType: 'user' | 'deposit' | 'withdrawal' | 'trade' | 'project' | 'expert' | 'system';
  targetId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalDeposits: number;
  totalWithdrawals: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  totalTrades: number;
  totalVolume: number;
  newUsersToday: number;
  revenueToday: number;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// ============================================
// CoinGecko API Types
// ============================================

export interface CoinGeckoPrice {
  [key: string]: {
    usd: number;
    usd_24h_change?: number;
    usd_24h_vol?: number;
    usd_market_cap?: number;
  };
}

export interface CoinGeckoMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  last_updated: string;
}

export interface CoinGeckoOHLC {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

// ============================================
// Chart Types
// ============================================

export interface CandlestickData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface LineChartData {
  time: number;
  value: number;
}

export interface ChartTimeframe {
  label: string;
  value: string;
  days: number;
}

// ============================================
// Form Types
// ============================================

export interface SelectOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  className?: string;
}
