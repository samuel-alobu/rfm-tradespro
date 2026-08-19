// ============================================
// Database Models Index
// ============================================

// User & Auth
export { default as User, type IUser } from './User';

// Site Settings
export { default as SiteSettings, type ISiteSettings } from './SiteSettings';

// Financial Transactions
export { default as Deposit, type IDeposit } from './Deposit';
export { default as DepositToken, type IDepositToken } from './DepositToken';
export { default as Withdrawal, type IWithdrawal } from './Withdrawal';
export { default as Transaction, type ITransaction } from './Transaction';

// Copy Trading
export { default as Trader, type ITrader } from './Trader';
export { default as CopyTrade, type ICopyTrade } from './CopyTrade';

// Subscription Plans
export { default as SubscribePlan, type ISubscribePlan } from './SubscribePlan';
export { default as Subscription, type ISubscription } from './Subscription';

// Signals
export { default as Signal, type ISignal } from './Signal';
export { default as SignalSubscription, type ISignalSubscription } from './SignalSubscription';
export { default as SignalPurchase, type ISignalPurchase } from './SignalPurchase';

// Staking
export { default as StakeAsset, type IStakeAsset } from './StakeAsset';
export { default as UserStake, type IUserStake } from './UserStake';

// Real Estate
export { default as RealEstateProperty, type IRealEstateProperty } from './RealEstateProperty';
export { default as RealEstateInvestment, type IRealEstateInvestment } from './RealEstateInvestment';

// Cold Storage
export { default as ColdStoragePurchase, type IColdStoragePurchase } from './ColdStoragePurchase';
export { default as ColdStorage, type IColdStorage } from './ColdStorage';

// User Holdings & Stock Positions
export { default as UserHolding, type IUserHolding } from './UserHolding';
export { default as StockPosition, type IStockPosition } from './StockPosition';

// Wallets
export { default as Wallet, type IWallet, type IWalletToken } from './Wallet';

// Trading
export { default as Trade, type ITrade } from './Trade';
export { default as TradingAccount, type ITradingAccount } from './TradingAccount';
export { default as TradingPosition, type ITradingPosition } from './TradingPosition';

// Notifications
export { default as Notification, type INotification } from './Notification';

// Referrals
export { default as Referral, type IReferral } from './Referral';
