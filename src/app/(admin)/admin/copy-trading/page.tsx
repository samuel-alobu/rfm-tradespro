"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  RefreshCw,
  Edit2,
  Save,
  X,
  TrendingUp,
  TrendingDown,
  BarChart3,
  DollarSign,
  Pause,
  Play,
  StopCircle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn, formatCurrency } from "@/utils";

// ============================================
// Admin Copy Trading Management Page
// ============================================

interface Toast {
  id: string;
  type: "success" | "error";
  message: string;
}

interface CopyTrade {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  traderId: {
    _id: string;
    name: string;
    avatar: string;
    winRate: number;
  };
  trader: {
    name: string;
    username: string;
    avatar: string;
    winRate: number;
  };
  amount: number;
  paymentToken: string;
  paymentTokenIcon: string;
  profitLoss: number;
  tradesCount: number;
  status: "active" | "paused" | "stopped" | "liquidated";
  startedAt: string;
  stoppedAt?: string;
  adminNote?: string;
  createdAt: string;
}

interface Stats {
  totalActive: number;
  totalStopped: number;
  totalInvested: number;
  totalPnL: number;
  totalTrades: number;
}

export default function AdminCopyTradingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copyTrades, setCopyTrades] = useState<CopyTrade[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    tradesCount: 0,
    profitLoss: 0,
  });
  const [toasts, setToasts] = useState<Toast[]>([]);

  const fetchData = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);

    try {
      const res = await fetch("/api/admin/copy-trades");
      const data = await res.json();

      if (res.ok) {
        setCopyTrades(data.copyTrades || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.log("Copy trades fetch error:", (error as Error).message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addToast = (type: "success" | "error", message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      4000,
    );
  };

  const handleEdit = (ct: CopyTrade) => {
    setEditingId(ct._id);
    setEditValues({
      tradesCount: ct.tradesCount || 0,
      profitLoss: ct.profitLoss || 0,
    });
  };

  const handleSave = async (copyTradeId: string) => {
    try {
      const res = await fetch("/api/admin/copy-trades", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          copyTradeId,
          tradesCount: editValues.tradesCount,
          profitLoss: editValues.profitLoss,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        addToast("success", "Copy trade updated");
        setCopyTrades((prev) =>
          prev.map((ct) =>
            ct._id === copyTradeId
              ? {
                  ...ct,
                  tradesCount: editValues.tradesCount,
                  profitLoss: editValues.profitLoss,
                }
              : ct,
          ),
        );
        setEditingId(null);
      } else {
        addToast("error", data.error || "Update failed");
      }
    } catch (error) {
      addToast("error", "Update failed");
    }
  };

  const handleStatusChange = async (copyTradeId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/copy-trades", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          copyTradeId,
          status: newStatus,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        addToast("success", `Copy trade ${newStatus}`);
        await fetchData();
      } else {
        addToast("error", data.error || "Status change failed");
      }
    } catch (error) {
      addToast("error", "Status change failed");
    }
  };

  const filteredTrades = copyTrades.filter((ct) => {
    const matchesSearch =
      ct.userId?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ct.userId?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ct.trader?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || ct.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getDaysSince = (dateStr: string) => {
    const start = new Date(dateStr);
    const now = new Date();
    return Math.floor(
      (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[#8b5cf6]/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-[#8b5cf6]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Copy Trading</h1>
            <p className="text-sm text-[#6b7a90]">
              Manage all copy trading operations
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-[#1e2733] text-white rounded-lg hover:bg-[#2a3441] transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={cn("h-4 w-4", isRefreshing && "animate-spin")}
          />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Play className="h-4 w-4 text-[#22c55e]" />
            <span className="text-xs text-[#6b7a90]">Active</span>
          </div>
          <p className="text-xl font-bold text-white">
            {isLoading ? (
              <span className="inline-block w-8 h-6 bg-[#1e2733] rounded animate-pulse" />
            ) : (
              stats?.totalActive || 0
            )}
          </p>
        </div>
        <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4">
          <div className="flex items-center gap-2 mb-2">
            <StopCircle className="h-4 w-4 text-[#ef4444]" />
            <span className="text-xs text-[#6b7a90]">Stopped</span>
          </div>
          <p className="text-xl font-bold text-white">
            {isLoading ? (
              <span className="inline-block w-8 h-6 bg-[#1e2733] rounded animate-pulse" />
            ) : (
              stats?.totalStopped || 0
            )}
          </p>
        </div>
        <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-[#3b82f6]" />
            <span className="text-xs text-[#6b7a90]">Total Invested</span>
          </div>
          <p className="text-xl font-bold text-white">
            {isLoading ? (
              <span className="inline-block w-16 h-6 bg-[#1e2733] rounded animate-pulse" />
            ) : (
              formatCurrency(stats?.totalInvested || 0)
            )}
          </p>
        </div>
        <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-[#22c55e]" />
            <span className="text-xs text-[#6b7a90]">Total P&L</span>
          </div>
          <p
            className={cn(
              "text-xl font-bold",
              (stats?.totalPnL || 0) >= 0 ? "text-[#22c55e]" : "text-[#ef4444]",
            )}
          >
            {isLoading ? (
              <span className="inline-block w-16 h-6 bg-[#1e2733] rounded animate-pulse" />
            ) : (
              <>
                {(stats?.totalPnL || 0) >= 0 ? "+" : ""}
                {formatCurrency(stats?.totalPnL || 0)}
              </>
            )}
          </p>
        </div>
        <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-[#f59e0b]" />
            <span className="text-xs text-[#6b7a90]">Total Trades</span>
          </div>
          <p className="text-xl font-bold text-white">
            {isLoading ? (
              <span className="inline-block w-12 h-6 bg-[#1e2733] rounded animate-pulse" />
            ) : (
              stats?.totalTrades || 0
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7a90]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by user or trader..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#0f1419] border border-[#1e2733] rounded-lg text-white placeholder:text-[#6b7a90] focus:outline-none focus:border-[#3b82f6]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-[#0f1419] border border-[#1e2733] rounded-lg text-white focus:outline-none focus:border-[#3b82f6]"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="stopped">Stopped</option>
          <option value="liquidated">Liquidated</option>
        </select>
      </div>

      {/* Copy Trades Table */}
      <div className="bg-[#0f1419] rounded-xl border border-[#1e2733] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e2733]">
                <th className="text-left py-4 px-5 text-sm font-medium text-[#6b7a90]">
                  User
                </th>
                <th className="text-left py-4 px-5 text-sm font-medium text-[#6b7a90]">
                  Trader
                </th>
                <th className="text-left py-4 px-5 text-sm font-medium text-[#6b7a90]">
                  Amount
                </th>
                <th className="text-left py-4 px-5 text-sm font-medium text-[#6b7a90]">
                  Token
                </th>
                <th className="text-left py-4 px-5 text-sm font-medium text-[#6b7a90]">
                  Trades
                </th>
                <th className="text-left py-4 px-5 text-sm font-medium text-[#6b7a90]">
                  P&L
                </th>
                <th className="text-left py-4 px-5 text-sm font-medium text-[#6b7a90]">
                  Duration
                </th>
                <th className="text-left py-4 px-5 text-sm font-medium text-[#6b7a90]">
                  Status
                </th>
                <th className="text-right py-4 px-5 text-sm font-medium text-[#6b7a90]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-[#1e2733]">
                    {[...Array(9)].map((_, j) => (
                      <td key={j} className="py-4 px-5">
                        <div className="h-5 w-20 bg-[#1e2733] rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredTrades.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="py-8 px-5 text-center text-[#6b7a90]"
                  >
                    No copy trades found
                  </td>
                </tr>
              ) : (
                filteredTrades.map((ct) => (
                  <tr
                    key={ct._id}
                    className="border-b border-[#1e2733] last:border-b-0 hover:bg-[#0c1320]"
                  >
                    {/* User */}
                    <td className="py-4 px-5">
                      <div>
                        <p className="font-medium text-white">
                          {ct.userId?.firstName} {ct.userId?.lastName}
                        </p>
                        <p className="text-xs text-[#6b7a90]">
                          {ct.userId?.email}
                        </p>
                      </div>
                    </td>
                    {/* Trader */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <div className="relative h-8 w-8 rounded-full overflow-hidden bg-[#1e2733]">
                          <Image
                            src={ct.trader?.avatar || "/api/placeholder/32/32"}
                            alt={ct.trader?.name || "Trader"}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <span className="text-white">{ct.trader?.name}</span>
                      </div>
                    </td>
                    {/* Amount */}
                    <td className="py-4 px-5 text-white font-medium">
                      {formatCurrency(ct.amount)}
                    </td>
                    {/* Token */}
                    <td className="py-4 px-5">
                      <span className="px-2 py-1 bg-[#1e2733] rounded text-xs text-white font-medium">
                        {ct.paymentToken || "USDT"}
                      </span>
                    </td>
                    {/* Trades */}
                    <td className="py-4 px-5">
                      {editingId === ct._id ? (
                        <input
                          type="number"
                          value={editValues.tradesCount}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              tradesCount: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-20 px-2 py-1 bg-[#1e2733] border border-[#3b82f6] rounded text-white text-sm"
                        />
                      ) : (
                        <span className="text-white">
                          {ct.tradesCount || 0}
                        </span>
                      )}
                    </td>
                    {/* P&L */}
                    <td className="py-4 px-5">
                      {editingId === ct._id ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editValues.profitLoss}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              profitLoss: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-24 px-2 py-1 bg-[#1e2733] border border-[#3b82f6] rounded text-white text-sm"
                        />
                      ) : (
                        <span
                          className={cn(
                            "font-medium",
                            ct.profitLoss >= 0
                              ? "text-[#22c55e]"
                              : "text-[#ef4444]",
                          )}
                        >
                          {ct.profitLoss >= 0 ? "+" : ""}
                          {formatCurrency(ct.profitLoss || 0)}
                        </span>
                      )}
                    </td>
                    {/* Duration */}
                    <td className="py-4 px-5 text-white">
                      {getDaysSince(ct.startedAt)} days
                    </td>
                    {/* Status */}
                    <td className="py-4 px-5">
                      <span
                        className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-medium",
                          ct.status === "active" &&
                            "bg-[#22c55e]/10 text-[#22c55e]",
                          ct.status === "paused" &&
                            "bg-[#f59e0b]/10 text-[#f59e0b]",
                          ct.status === "stopped" &&
                            "bg-[#6b7a90]/10 text-[#6b7a90]",
                          ct.status === "liquidated" &&
                            "bg-[#ef4444]/10 text-[#ef4444]",
                        )}
                      >
                        {ct.status}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {editingId === ct._id ? (
                          <>
                            <button
                              onClick={() => handleSave(ct._id)}
                              className="p-1.5 bg-[#22c55e]/10 text-[#22c55e] rounded hover:bg-[#22c55e]/20"
                              title="Save"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 bg-[#ef4444]/10 text-[#ef4444] rounded hover:bg-[#ef4444]/20"
                              title="Cancel"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            {(ct.status === "active" ||
                              ct.status === "paused") && (
                              <>
                                <button
                                  onClick={() => handleEdit(ct)}
                                  className="p-1.5 bg-[#3b82f6]/10 text-[#3b82f6] rounded hover:bg-[#3b82f6]/20"
                                  title="Edit"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleStatusChange(
                                      ct._id,
                                      ct.status === "active"
                                        ? "paused"
                                        : "active",
                                    )
                                  }
                                  className="p-1.5 bg-[#f59e0b]/10 text-[#f59e0b] rounded hover:bg-[#f59e0b]/20"
                                  title={
                                    ct.status === "active" ? "Pause" : "Resume"
                                  }
                                >
                                  {ct.status === "active" ? (
                                    <Pause className="h-4 w-4" />
                                  ) : (
                                    <Play className="h-4 w-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() =>
                                    handleStatusChange(ct._id, "stopped")
                                  }
                                  className="p-1.5 bg-[#ef4444]/10 text-[#ef4444] rounded hover:bg-[#ef4444]/20"
                                  title="Stop"
                                >
                                  <StopCircle className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl min-w-[280px]",
                toast.type === "success" && "bg-[#22c55e] text-white",
                toast.type === "error" && "bg-[#ef4444] text-white",
              )}
            >
              {toast.type === "success" ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <span className="text-sm font-medium flex-1">
                {toast.message}
              </span>
              <button
                onClick={() =>
                  setToasts((prev) => prev.filter((t) => t.id !== toast.id))
                }
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
