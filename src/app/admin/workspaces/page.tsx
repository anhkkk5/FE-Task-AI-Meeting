"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Archive,
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Zap,
} from "lucide-react";
import { AdminShell } from "@/components/layout/AdminShell";
import {
  AdminWorkspace,
  createAdminWorkspace,
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
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

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

  async function handleCreate() {
    if (!newName.trim()) return;
    setActionId("create");
    try {
      await createAdminWorkspace({ name: newName.trim(), description: newDescription.trim() || undefined });
      setNewName("");
      setNewDescription("");
      setShowCreate(false);
      await loadWorkspaces();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo workspace.");
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
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Quản lý Workspaces
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Tổng cộng <strong className="text-slate-900">{total}</strong> không gian làm việc trong hệ thống
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowCreate(true)} className="inline-flex h-9 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700"><Plus className="h-3.5 w-3.5" /> Tạo Workspace</button>
            <button onClick={() => void loadWorkspaces()} disabled={isLoading} className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50/40 hover:text-blue-700 disabled:opacity-50">
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} /> Làm mới
            </button>
          </div>
        </div>

        {showCreate ? (
          <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5">
            <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
              <input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="Tên Workspace" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500" />
              <input value={newDescription} onChange={(event) => setNewDescription(event.target.value)} placeholder="Mô tả (không bắt buộc)" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500" />
              <div className="flex gap-2"><button onClick={() => void handleCreate()} disabled={!newName.trim() || actionId === "create"} className="rounded-xl bg-blue-600 px-4 text-xs font-bold text-white disabled:opacity-50">Tạo</button><button onClick={() => setShowCreate(false)} className="rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600">Hủy</button></div>
            </div>
            <p className="mt-2 text-xs text-slate-500">Tài khoản tạo Workspace trở thành OWNER. Người dùng thường cũng có thể tự tạo Workspace và mời thành viên mà không cần quyền System Admin.</p>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
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
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-xs font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-10 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-500"
          >
            <option value="">Tất cả</option>
            <option value="active">Đang hoạt động</option>
            <option value="archived">Đã lưu trữ</option>
          </select>
        </div>

        {/* Workspaces Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
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
            <tbody className="divide-y divide-slate-100">
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
                  <tr key={ws.id} className="bg-white transition hover:bg-blue-50/30">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-sm font-black text-blue-700">
                          {ws.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900">{ws.name}</p>
                          <p className="text-slate-500">@{ws.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                        ws.plan === "ENTERPRISE"
                          ? "border border-amber-200 bg-amber-50 text-amber-700"
                          : ws.plan === "PRO"
                          ? "border border-violet-200 bg-violet-50 text-violet-700"
                          : "border border-slate-200 bg-slate-100 text-slate-600"
                      }`}>
                        {ws.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Building2 className="h-3.5 w-3.5 text-slate-500" />
                        <span className="font-bold">{ws.memberCount}</span>
                        <span className="text-slate-500">thành viên</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {ws.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700">
                          <Zap className="h-3 w-3" />
                          Đang chạy
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-600">
                          <Archive className="h-3 w-3" />
                          Đã lưu trữ
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 hidden lg:table-cell">
                      {new Date(ws.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/workspaces/${ws.id}`} title="Xem chi tiết workspace" className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 text-[11px] font-bold text-blue-700 hover:bg-blue-50">
                          <Eye className="h-3.5 w-3.5" /> Chi tiết
                        </Link>
                        <button
                          onClick={() => void handleToggleStatus(ws.id)}
                          disabled={actionId === ws.id}
                          title={ws.status === "ACTIVE" ? "Lưu trữ workspace" : "Kích hoạt workspace"}
                          className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-[11px] font-bold transition border disabled:opacity-50 ${
                            ws.status === "ACTIVE"
                              ? "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100"
                              : "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
                          }`}
                        >
                          {ws.status === "ACTIVE" ? (
                            <Archive className="h-3.5 w-3.5" />
                          ) : (
                            <Zap className="h-3.5 w-3.5" />
                          )}
                          {ws.status === "ACTIVE" ? "Lưu trữ" : "Kích hoạt"}
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
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-300 hover:text-blue-700 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-300 hover:text-blue-700 disabled:opacity-40"
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
