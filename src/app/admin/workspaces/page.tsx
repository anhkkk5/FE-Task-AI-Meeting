"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Archive,
  Building2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  Zap,
} from "lucide-react";
import { AdminShell } from "@/components/layout/AdminShell";
import {
  AdminWorkspace,
  getAdminWorkspaces,
  toggleWorkspaceStatus,
} from "@/features/admin/api/admin.api";
import { useAuth } from "@/hooks/useAuth";

export default function AdminWorkspacesPage() {
  const { user } = useAuth(true);
  const [items, setItems] = useState<AdminWorkspace[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  const loadWorkspaces = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await getAdminWorkspaces({ page, limit: 20, search, status: statusFilter || undefined });
      setItems(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải workspaces.");
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    if (user?.isSystemAdmin) {
      void loadWorkspaces();
    }
  }, [user, loadWorkspaces]);

  async function handleToggleStatus(workspaceId: string) {
    setActionId(workspaceId);
    try {
      await toggleWorkspaceStatus(workspaceId);
      void loadWorkspaces();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Thao tác thất bại.");
    } finally {
      setActionId(null);
    }
  }

  return (
    <AdminShell title="Quản lý Workspaces">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Quản lý Workspaces
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Tổng cộng <strong className="text-white">{total}</strong> không gian làm việc trong hệ thống
            </p>
          </div>
          <button
            onClick={() => void loadWorkspaces()}
            disabled={isLoading}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 text-xs font-bold text-slate-300 hover:bg-slate-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-800/60 bg-red-900/20 px-5 py-4 text-sm font-semibold text-red-300">
            {error}
          </div>
        ) : null}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Tìm theo tên hoặc slug..."
              className="h-10 w-full pl-9 pr-4 rounded-xl border border-slate-700 bg-slate-800 text-xs font-medium text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500 focus:bg-slate-900 transition"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-10 rounded-xl border border-slate-700 bg-slate-800 px-3 text-xs font-bold text-slate-300 outline-none focus:border-blue-500 transition cursor-pointer"
          >
            <option value="">Tất cả</option>
            <option value="active">Đang hoạt động</option>
            <option value="archived">Đã lưu trữ</option>
          </select>
        </div>

        {/* Workspaces Table */}
        <div className="rounded-2xl border border-slate-800 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900">
                <th className="px-5 py-3.5 text-left font-extrabold text-slate-500 uppercase tracking-wider">
                  Workspace
                </th>
                <th className="px-4 py-3.5 text-left font-extrabold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                  Gói dịch vụ
                </th>
                <th className="px-4 py-3.5 text-left font-extrabold text-slate-500 uppercase tracking-wider">
                  Thành viên
                </th>
                <th className="px-4 py-3.5 text-left font-extrabold text-slate-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-4 py-3.5 text-left font-extrabold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                  Ngày tạo
                </th>
                <th className="px-4 py-3.5 text-right font-extrabold text-slate-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500 font-medium">
                    <div className="flex justify-center">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500 font-medium">
                    Không tìm thấy workspace nào.
                  </td>
                </tr>
              ) : (
                items.map((ws) => (
                  <tr key={ws.id} className="bg-slate-950/50 hover:bg-slate-900/60 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-600/80 text-white font-black text-sm flex items-center justify-center shrink-0 border border-indigo-700/40">
                          {ws.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-100">{ws.name}</p>
                          <p className="text-slate-500">@{ws.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                        ws.plan === "ENTERPRISE"
                          ? "bg-amber-600/20 text-amber-300 border border-amber-700/40"
                          : ws.plan === "PRO"
                          ? "bg-purple-600/20 text-purple-300 border border-purple-700/40"
                          : "bg-slate-600/20 text-slate-400 border border-slate-700/40"
                      }`}>
                        {ws.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Building2 className="h-3.5 w-3.5 text-slate-500" />
                        <span className="font-bold">{ws.memberCount}</span>
                        <span className="text-slate-500">thành viên</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {ws.status === "active" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/20 border border-emerald-700/40 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-300">
                          <Zap className="h-3 w-3" />
                          Đang chạy
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-600/20 border border-slate-700/40 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-400">
                          <Archive className="h-3 w-3" />
                          Đã lưu trữ
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 hidden lg:table-cell">
                      {new Date(ws.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => void handleToggleStatus(ws.id)}
                          disabled={actionId === ws.id}
                          title={ws.status === "active" ? "Lưu trữ workspace" : "Kích hoạt workspace"}
                          className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-[11px] font-bold transition border disabled:opacity-50 ${
                            ws.status === "active"
                              ? "border-slate-700/50 bg-slate-800/60 text-slate-400 hover:text-white hover:border-slate-600"
                              : "border-emerald-800/50 bg-emerald-900/20 text-emerald-400 hover:bg-emerald-900/40"
                          }`}
                        >
                          {ws.status === "active" ? (
                            <Archive className="h-3.5 w-3.5" />
                          ) : (
                            <Zap className="h-3.5 w-3.5" />
                          )}
                          {ws.status === "active" ? "Lưu trữ" : "Kích hoạt"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 ? (
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">
              Trang {page} / {totalPages} · Tổng {total} workspaces
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-400 hover:text-white disabled:opacity-40 transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-400 hover:text-white disabled:opacity-40 transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}
