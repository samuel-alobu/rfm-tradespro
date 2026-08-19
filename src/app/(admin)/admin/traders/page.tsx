"use client";

import { useState, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  BadgeCheck,
  TrendingUp,
  Loader2,
} from "lucide-react";

// Types
interface Trader {
  _id: string;
  name: string;
  username: string;
  avatar: string;
  country: string;
  countryFlag: string;
  bio?: string;
  winRate: number;
  totalReturn: number;
  monthlyReturn: number;
  profitShare: number;
  copiers: number;
  totalTrades: number;
  wins: number;
  losses: number;
  minInvestment: number;
  tradingStyle: "conservative" | "moderate" | "aggressive";
  markets: string[];
  isActive: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  createdAt: string;
}

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
              toast.type === "success"
                ? "bg-green-500/20 border border-green-500/30"
                : toast.type === "error"
                  ? "bg-red-500/20 border border-red-500/30"
                  : "bg-blue-500/20 border border-blue-500/30"
            }`}
          >
            {toast.type === "success" && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
            {toast.type === "error" && (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            {toast.type === "info" && (
              <AlertCircle className="w-5 h-5 text-blue-500" />
            )}
            <span className="text-white text-sm">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

const countries = [
  { name: "United States", flag: "🇺🇸" },
  { name: "United Kingdom", flag: "🇬🇧" },
  { name: "Singapore", flag: "🇸🇬" },
  { name: "Germany", flag: "🇩🇪" },
  { name: "Japan", flag: "🇯🇵" },
  { name: "Spain", flag: "🇪🇸" },
  { name: "France", flag: "🇫🇷" },
  { name: "Australia", flag: "🇦🇺" },
  { name: "Canada", flag: "🇨🇦" },
  { name: "Switzerland", flag: "🇨🇭" },
];

const marketOptions = ["Forex", "Crypto", "Stocks", "Commodities", "Indices"];

export default function AdminTradersPage() {
  const toastId = useId();
  const [traders, setTraders] = useState<Trader[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStyle, setFilterStyle] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrader, setEditingTrader] = useState<Trader | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [traderToDelete, setTraderToDelete] = useState<Trader | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    verified: 0,
    featured: 0,
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    avatar: "",
    country: "United States",
    countryFlag: "🇺🇸",
    bio: "",
    winRate: 70,
    totalReturn: 100,
    monthlyReturn: 10,
    profitShare: 15,
    copiers: 0,
    totalTrades: 0,
    wins: 0,
    losses: 0,
    minInvestment: 100,
    tradingStyle: "moderate" as "conservative" | "moderate" | "aggressive",
    markets: ["Forex"] as string[],
    isActive: true,
    isVerified: false,
    isFeatured: false,
  });

  const addToast = (type: Toast["type"], message: string) => {
    const id = `${toastId}-${Date.now()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      5000,
    );
  };

  const removeToast = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  const fetchTraders = async () => {
    try {
      const res = await fetch("/api/admin/traders");
      const data = await res.json();
      if (res.ok) {
        setTraders(data.traders || []);
        setStats(
          data.stats || { total: 0, active: 0, verified: 0, featured: 0 },
        );
      } else {
        addToast("error", data.error || "Failed to fetch traders");
      }
    } catch {
      addToast("error", "Failed to fetch traders");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchTraders();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      username: "",
      avatar: "",
      country: "United States",
      countryFlag: "🇺🇸",
      bio: "",
      winRate: 70,
      totalReturn: 100,
      monthlyReturn: 10,
      profitShare: 15,
      copiers: 0,
      totalTrades: 0,
      wins: 0,
      losses: 0,
      minInvestment: 100,
      tradingStyle: "moderate",
      markets: ["Forex"],
      isActive: true,
      isVerified: false,
      isFeatured: false,
    });
  };

  const openCreateModal = () => {
    resetForm();
    setEditingTrader(null);
    setIsModalOpen(true);
  };

  const openEditModal = (trader: Trader) => {
    setEditingTrader(trader);
    setFormData({
      name: trader.name,
      username: trader.username,
      avatar: trader.avatar,
      country: trader.country,
      countryFlag: trader.countryFlag,
      bio: trader.bio || "",
      winRate: trader.winRate,
      totalReturn: trader.totalReturn,
      monthlyReturn: trader.monthlyReturn,
      profitShare: trader.profitShare,
      copiers: trader.copiers,
      totalTrades: trader.totalTrades,
      wins: trader.wins,
      losses: trader.losses,
      minInvestment: trader.minInvestment,
      tradingStyle: trader.tradingStyle,
      markets: trader.markets,
      isActive: trader.isActive,
      isVerified: trader.isVerified,
      isFeatured: trader.isFeatured,
    });
    setIsModalOpen(true);
  };

  const handleCountryChange = (countryName: string) => {
    const country = countries.find((c) => c.name === countryName);
    if (country)
      setFormData({
        ...formData,
        country: country.name,
        countryFlag: country.flag,
      });
  };

  const toggleMarket = (market: string) => {
    if (formData.markets.includes(market)) {
      setFormData({
        ...formData,
        markets: formData.markets.filter((m) => m !== market),
      });
    } else {
      setFormData({ ...formData, markets: [...formData.markets, market] });
    }
  };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);

    const file = e.target.files?.[0];
    if (!file) return;

    // ✅ Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError("File size must not exceed 10MB.");
      return;
    }

    try {
      setUploading(true);

      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const data = await res.json();

      // ✅ Save uploaded file URL
      setFormData((prev) => ({
        ...prev,
        avatar: data.url,
      }));
    } catch (err) {
      setError("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.name || !formData.username || !formData.avatar) {
      addToast("error", "Please fill in all required fields");
      setIsLoading(false);
      return;
    }

    try {
      const payload = editingTrader
        ? { traderId: editingTrader._id, ...formData }
        : formData;
      const res = await fetch("/api/admin/traders", {
        method: editingTrader ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        addToast(
          "success",
          data.message ||
            `Trader ${editingTrader ? "updated" : "created"} successfully`,
        );
        setIsModalOpen(false);
        resetForm();
        fetchTraders();
      } else {
        addToast("error", data.error || "Operation failed");
      }
    } catch {
      addToast("error", "Operation failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!traderToDelete) return;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/admin/traders?id=${traderToDelete._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        addToast("success", "Trader deleted successfully");
        setIsDeleteModalOpen(false);
        setTraderToDelete(null);
        fetchTraders();
      } else {
        addToast("error", data.error || "Failed to delete");
      }
    } catch {
      addToast("error", "Failed to delete");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStatus = async (
    trader: Trader,
    field: "isActive" | "isVerified" | "isFeatured",
  ) => {
    try {
      const res = await fetch("/api/admin/traders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ traderId: trader._id, [field]: !trader[field] }),
      });
      if (res.ok) {
        addToast("success", `Trader ${field.replace("is", "")} status updated`);
        fetchTraders();
      }
    } catch {
      addToast("error", "Failed to update status");
    }
  };

  const filteredTraders = traders.filter((trader) => {
    const matchesSearch =
      trader.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trader.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStyle =
      filterStyle === "all" || trader.tradingStyle === filterStyle;
    return matchesSearch && matchesStyle;
  });

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Traders Management</h1>
          <p className="text-gray-400 mt-1">Manage copy trading traders</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Trader
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Traders",
            value: stats.total,
            icon: Users,
            color: "text-blue-500",
          },
          {
            label: "Active",
            value: stats.active,
            icon: CheckCircle,
            color: "text-green-500",
          },
          {
            label: "Verified",
            value: stats.verified,
            icon: BadgeCheck,
            color: "text-purple-500",
          },
          {
            label: "Featured",
            value: stats.featured,
            icon: TrendingUp,
            color: "text-yellow-500",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-[#0f1419] border border-[#1e2733] rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-[#151c24] ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">{stat.label}</p>
                <p className="text-white text-xl font-bold">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search traders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0f1419] border border-[#1e2733] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
          />
        </div>
        <select
          value={filterStyle}
          onChange={(e) => setFilterStyle(e.target.value)}
          className="px-4 py-2 bg-[#0f1419] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500"
        >
          <option value="all">All Styles</option>
          <option value="conservative">Conservative</option>
          <option value="moderate">Moderate</option>
          <option value="aggressive">Aggressive</option>
        </select>
      </div>

      {/* Traders Table */}
      <div className="bg-[#0f1419] border border-[#1e2733] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e2733]">
                <th className="text-left text-gray-400 font-medium px-6 py-4">
                  Trader
                </th>
                <th className="text-left text-gray-400 font-medium px-6 py-4">
                  Performance
                </th>
                <th className="text-left text-gray-400 font-medium px-6 py-4">
                  Stats
                </th>
                <th className="text-left text-gray-400 font-medium px-6 py-4">
                  Status
                </th>
                <th className="text-right text-gray-400 font-medium px-6 py-4">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTraders.map((trader) => (
                <tr
                  key={trader._id}
                  className="border-b border-[#1e2733] hover:bg-[#151c24]"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={trader.avatar}
                        alt={trader.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">
                            {trader.name}
                          </span>
                          {trader.isVerified && (
                            <BadgeCheck className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        <p className="text-gray-400 text-sm">
                          @{trader.username}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {trader.countryFlag} {trader.country}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm">Win Rate:</span>
                        <span className="text-green-500 font-medium">
                          {trader.winRate}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm">
                          Total Return:
                        </span>
                        <span className="text-green-500 font-medium">
                          +{trader.totalReturn}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm">
                          Profit Share:
                        </span>
                        <span className="text-white">
                          {trader.profitShare}%
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-400">
                        Copiers:{" "}
                        <span className="text-white">
                          {trader.copiers.toLocaleString()}
                        </span>
                      </p>
                      <p className="text-gray-400">
                        Trades:{" "}
                        <span className="text-white">
                          {trader.totalTrades.toLocaleString()}
                        </span>
                      </p>
                      <p className="text-gray-400">
                        W/L:{" "}
                        <span className="text-green-500">{trader.wins}</span>/
                        <span className="text-red-500">{trader.losses}</span>
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => toggleStatus(trader, "isActive")}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${trader.isActive ? "bg-green-500/20 text-green-500" : "bg-gray-500/20 text-gray-400"}`}
                      >
                        {trader.isActive ? "Active" : "Inactive"}
                      </button>
                      <button
                        onClick={() => toggleStatus(trader, "isVerified")}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${trader.isVerified ? "bg-blue-500/20 text-blue-500" : "bg-gray-500/20 text-gray-400"}`}
                      >
                        {trader.isVerified ? "Verified" : "Unverified"}
                      </button>
                      <button
                        onClick={() => toggleStatus(trader, "isFeatured")}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${trader.isFeatured ? "bg-yellow-500/20 text-yellow-500" : "bg-gray-500/20 text-gray-400"}`}
                      >
                        {trader.isFeatured ? "Featured" : "Not Featured"}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(trader)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-[#1e2733] rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setTraderToDelete(trader);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredTraders.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No traders found</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0f1419] border border-[#1e2733] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-6 border-b border-[#1e2733]">
                <h2 className="text-xl font-bold text-white">
                  {editingTrader ? "Edit Trader" : "Add New Trader"}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-[#1e2733] rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500"
                      placeholder="Marcus Chen"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Username *
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500"
                      placeholder="marcus_trades"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    Avatar Upload *
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500"
                  />

                  {uploading && (
                    <p className="text-sm text-gray-400 mt-1">Uploading...</p>
                  )}
                  {error && (
                    <p className="text-sm text-red-500 mt-1">{error}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Country
                    </label>
                    <select
                      value={formData.country}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="w-full px-4 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500"
                    >
                      {countries.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.flag} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Trading Style
                    </label>
                    <select
                      value={formData.tradingStyle}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tradingStyle: e.target.value as
                            | "conservative"
                            | "moderate"
                            | "aggressive",
                        })
                      }
                      className="w-full px-4 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500"
                    >
                      <option value="conservative">Conservative</option>
                      <option value="moderate">Moderate</option>
                      <option value="aggressive">Aggressive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    rows={2}
                    className="w-full px-4 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500 resize-none"
                    placeholder="Brief description..."
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    Markets *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {marketOptions.map((market) => (
                      <button
                        key={market}
                        type="button"
                        onClick={() => toggleMarket(market)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${formData.markets.includes(market) ? "bg-green-500 text-white" : "bg-[#151c24] text-gray-400 hover:bg-[#1e2733]"}`}
                      >
                        {market}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Win Rate %
                    </label>
                    <input
                      type="number"
                      value={formData.winRate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          winRate: parseFloat(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Total Return %
                    </label>
                    <input
                      type="number"
                      value={formData.totalReturn}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          totalReturn: parseFloat(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Monthly %
                    </label>
                    <input
                      type="number"
                      value={formData.monthlyReturn}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          monthlyReturn: parseFloat(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Profit Share %
                    </label>
                    <input
                      type="number"
                      value={formData.profitShare}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          profitShare: parseFloat(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Copiers
                    </label>
                    <input
                      type="number"
                      value={formData.copiers}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          copiers: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Total Trades
                    </label>
                    <input
                      type="number"
                      value={formData.totalTrades}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          totalTrades: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Wins
                    </label>
                    <input
                      type="number"
                      value={formData.wins}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          wins: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Losses
                    </label>
                    <input
                      type="number"
                      value={formData.losses}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          losses: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    Minimum Investment ($)
                  </label>
                  <input
                    type="number"
                    value={formData.minInvestment}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minInvestment: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 bg-[#151c24] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-green-500"
                  />
                </div>

                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-[#1e2733] bg-[#151c24] text-green-500 focus:ring-green-500"
                    />
                    <span className="text-white">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isVerified}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isVerified: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-[#1e2733] bg-[#151c24] text-green-500 focus:ring-green-500"
                    />
                    <span className="text-white">Verified</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isFeatured: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-[#1e2733] bg-[#151c24] text-green-500 focus:ring-green-500"
                    />
                    <span className="text-white">Featured</span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#1e2733]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isLoading
                      ? "Saving..."
                      : editingTrader
                        ? "Update Trader"
                        : "Create Trader"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && traderToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
            onClick={() => setIsDeleteModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0f1419] border border-[#1e2733] rounded-xl p-6 w-full max-w-md"
            >
              <h3 className="text-xl font-bold text-white mb-4">
                Delete Trader
              </h3>
              <p className="text-gray-400 mb-6">
                Are you sure you want to delete{" "}
                <span className="text-white font-medium">
                  {traderToDelete.name}
                </span>
                ?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isLoading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
