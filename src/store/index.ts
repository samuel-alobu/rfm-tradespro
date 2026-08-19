import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types';

// ============================================
// UI Store - For global UI state
// ============================================

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  theme: 'dark' | 'light';
  currency: string;
  balanceVisible: boolean;
  settingsPanelOpen: boolean;
  
  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapse: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setCurrency: (currency: string) => void;
  toggleBalanceVisibility: () => void;
  setBalanceVisible: (visible: boolean) => void;
  openSettingsPanel: () => void;
  closeSettingsPanel: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      sidebarCollapsed: false,
      theme: 'dark',
      currency: 'USD',
      balanceVisible: true,
      settingsPanelOpen: false,

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebarCollapse: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setTheme: (theme) => set({ theme }),
      setCurrency: (currency) => set({ currency }),
      toggleBalanceVisibility: () => set((state) => ({ balanceVisible: !state.balanceVisible })),
      setBalanceVisible: (visible) => set({ balanceVisible: visible }),
      openSettingsPanel: () => set({ settingsPanelOpen: true }),
      closeSettingsPanel: () => set({ settingsPanelOpen: false }),
    }),
    {
      name: 'elite-ui-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        currency: state.currency,
        balanceVisible: state.balanceVisible,
      }),
    }
  )
);

// ============================================
// Auth Store - For authentication state
// ============================================

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),
  setLoading: (loading) => set({ isLoading: loading }),
  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    }),
}));

// ============================================
// Portfolio Store - For portfolio/trading state
// ============================================

interface AssetPrice {
  symbol: string;
  price: number;
  change24h: number;
  changePercentage24h: number;
  lastUpdated: Date;
}

interface PortfolioState {
  totalBalance: number;
  totalProfit: number;
  profitPercentage: number;
  assets: AssetPrice[];
  selectedAsset: string | null;
  chartTimeframe: string;
  
  // Actions
  setTotalBalance: (balance: number) => void;
  setTotalProfit: (profit: number, percentage: number) => void;
  setAssets: (assets: AssetPrice[]) => void;
  updateAssetPrice: (symbol: string, price: number, change: number) => void;
  setSelectedAsset: (symbol: string | null) => void;
  setChartTimeframe: (timeframe: string) => void;
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
  totalBalance: 0,
  totalProfit: 0,
  profitPercentage: 0,
  assets: [],
  selectedAsset: 'BTC',
  chartTimeframe: '1D',

  setTotalBalance: (balance) => set({ totalBalance: balance }),
  setTotalProfit: (profit, percentage) =>
    set({ totalProfit: profit, profitPercentage: percentage }),
  setAssets: (assets) => set({ assets }),
  updateAssetPrice: (symbol, price, change) =>
    set((state) => ({
      assets: state.assets.map((asset) =>
        asset.symbol === symbol
          ? { ...asset, price, change24h: change, lastUpdated: new Date() }
          : asset
      ),
    })),
  setSelectedAsset: (symbol) => set({ selectedAsset: symbol }),
  setChartTimeframe: (timeframe) => set({ chartTimeframe: timeframe }),
}));

// ============================================
// Trade Store - For trading form state
// ============================================

interface TradeFormState {
  type: 'buy' | 'sell' | 'convert';
  assetSymbol: string;
  amount: string;
  price: string;
  stopLoss: string;
  takeProfit: string;
  orderType: 'market' | 'limit';
  useTpSl: boolean;
  
  // Actions
  setTradeType: (type: 'buy' | 'sell' | 'convert') => void;
  setAssetSymbol: (symbol: string) => void;
  setAmount: (amount: string) => void;
  setPrice: (price: string) => void;
  setStopLoss: (stopLoss: string) => void;
  setTakeProfit: (takeProfit: string) => void;
  setOrderType: (orderType: 'market' | 'limit') => void;
  setUseTpSl: (use: boolean) => void;
  resetForm: () => void;
}

const initialTradeFormState = {
  type: 'buy' as const,
  assetSymbol: 'AAPL',
  amount: '',
  price: '',
  stopLoss: '',
  takeProfit: '',
  orderType: 'market' as const,
  useTpSl: false,
};

export const useTradeStore = create<TradeFormState>((set) => ({
  ...initialTradeFormState,

  setTradeType: (type) => set({ type }),
  setAssetSymbol: (assetSymbol) => set({ assetSymbol }),
  setAmount: (amount) => set({ amount }),
  setPrice: (price) => set({ price }),
  setStopLoss: (stopLoss) => set({ stopLoss }),
  setTakeProfit: (takeProfit) => set({ takeProfit }),
  setOrderType: (orderType) => set({ orderType }),
  setUseTpSl: (useTpSl) => set({ useTpSl }),
  resetForm: () => set(initialTradeFormState),
}));

// ============================================
// Notification Store - For in-app notifications
// ============================================

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  read: boolean;
  createdAt: Date;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notification) =>
    set((state) => {
      const newNotification: Notification = {
        ...notification,
        id: Math.random().toString(36).substring(2, 9),
        read: false,
        createdAt: new Date(),
      };
      return {
        notifications: [newNotification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    }),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
  removeNotification: (id) =>
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: notification && !notification.read
          ? state.unreadCount - 1
          : state.unreadCount,
      };
    }),
  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));
