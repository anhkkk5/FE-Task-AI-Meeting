"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  Shield,
  ShieldOff,
  UserCheck,
  UserX,
} from "lucide-react";
import { AdminShell } from "@/components/layout/AdminShell";
import {
  AdminUser,
  getAdminUsers,
  toggleAdminRole,
  toggleAdminUserStatus,
} from "@/features/admin/api/admin.api";
import { useAuth } from "@/hooks/useAuth";

export default function AdminUsersPage() {
  const { user } = useAuth(true);
  const [items, setItems] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await getAdminUsers({ page, limit: 20, search, status: statusFilter || undefined });
      setItems(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách users.");
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    if (user?.isSystemAdmin) {
      void loadUsers();
    }
  }, [user, loadUsers]);

  async function handleToggleStatus(userId: string) {
    setActionUserId(userId);
    try {
      await toggleAdminUserStatus(userId);
      void loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Thao tác thất bại.");
    } finally {
      setActionUserId(null);
    }
  }

  async function handleToggleAdmin(userId: string) {
    setActionUserId(userId);
    try {
      await toggleAdminRole(userId);
      void loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Thao tác thất bại.");
    } finally {
      setActionUserId(null);
    }
  }

  return (
    <AdminShell title="Quản lý Users">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Quản lý Users
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Tổng cộng <strong className="text-slate-900">{total}</strong> người dùng trong hệ thống
            </p>
          </div>
          <button
            onClick={() => void loadUsers()}
            disabled={isLoading}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50/40 hover:text-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
        </div>

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
              placeholder="Tìm theo tên hoặc email..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-xs font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-10 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-500"
          >
            <option value="">Tất cả users</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Đã vô hiệu hóa</option>
            <option value="admin">Quản trị viên</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-5 py-3.5 text-left font-extrabold text-slate-500 uppercase tracking-wider">
                  Người dùng
                </th>
                <th className="px-4 py-3.5 text-left font-extrabold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                  Vai trò
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
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-500 font-medium">
                    <div className="flex justify-center">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-500 font-medium">
                    Không tìm thấy người dùng nào.
                  </td>
                </tr>
              ) : (
                items.map((u) => (
                  <tr key={u.id} className="bg-white transition hover:bg-blue-50/30">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">
                          {(u.fullName || u.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900">{u.fullName || "(Chưa đặt tên)"}</p>
                          <p className="text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      {u.isSystemAdmin ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-[10px] font-extrabold text-blue-700">
                          <Shield className="h-3 w-3" />
                          SYSTEM ADMIN
                        </span>
                      ) : (
                        <span className="text-slate-500 font-medium">User thường</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {u.status === "active" ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" />
                          Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-600">
                          Vô hiệu hóa
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 hidden lg:table-cell">
                      {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        {/* Toggle Status */}
                        {u.id !== user?.id ? (
                          <button
                            onClick={() => void handleToggleStatus(u.id)}
                            disabled={actionUserId === u.id}
                            title={u.status === "active" ? "Vô hiệu hóa tài khoản" : "Kích hoạt tài khoản"}
                            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-[11px] font-bold transition border disabled:opacity-50 ${
                              u.status === "active"
                                ? "border-rose-200 bg-white text-rose-600 hover:bg-rose-50"
                                : "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
                            }`}
                          >
                            {u.status === "active" ? (
                              <UserX className="h-3.5 w-3.5" />
                            ) : (
                              <UserCheck className="h-3.5 w-3.5" />
                            )}
                            {u.status === "active" ? "Vô hiệu" : "Kích hoạt"}
                          </button>
                        ) : null}

                        {/* Toggle Admin Role */}
                        {u.id !== user?.id ? (
                          <button
                            onClick={() => void handleToggleAdmin(u.id)}
                            disabled={actionUserId === u.id}
                            title={u.isSystemAdmin ? "Thu hồi quyền Admin" : "Cấp quyền Admin"}
                            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-[11px] font-bold transition border disabled:opacity-50 ${
                              u.isSystemAdmin
                                ? "border-amber-200 bg-white text-amber-700 hover:bg-amber-50"
                                : "border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100"
                            }`}
                          >
                            {u.isSystemAdmin ? (
                              <ShieldOff className="h-3.5 w-3.5" />
                            ) : (
                              <Shield className="h-3.5 w-3.5" />
                            )}
                            {u.isSystemAdmin ? "Thu hồi Admin" : "Cấp Admin"}
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-600 font-medium">Tài khoản của bạn</span>
                        )}
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
              Trang {page} / {totalPages} · Tổng {total} users
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
