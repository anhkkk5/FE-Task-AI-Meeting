"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  Building2,
  CheckCircle2,
  FolderOpen,
  Users,
  Video,
  XCircle,
} from "lucide-react";
import { AdminShell } from "@/components/layout/AdminShell";
import { getSystemStats, SystemStats } from "@/features/admin/api/admin.api";
import { useAuth } from "@/hooks/useAuth";

export default function AdminDashboardPage() {
  const { user } = useAuth(true);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await getSystemStats();
      setStats(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải thống kê hệ thống.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.isSystemAdmin) {
      void loadStats();
    }
  }, [user, loadStats]);

  return (
    <AdminShell title="Tổng quan hệ thống">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Tổng quan hệ thống
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-400">
            Thống kê toàn bộ nền tảng AgileFlow AI theo thời gian thực
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-800/60 bg-red-900/20 px-5 py-4 text-sm font-semibold text-red-300">
            {error}
          </div>
        ) : null}

        {/* Users KPIs */}
        <div>
          <p className="mb-3 text-[11px] font-extrabold uppercase tracking-widest text-slate-500">
            👥 Người dùng
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<Users className="h-5 w-5 text-blue-400" />}
              label="Tổng users"
              value={isLoading ? "..." : (stats?.users.total ?? 0)}
              bg="bg-blue-600/10 border-blue-800/40"
            />
            <StatCard
              icon={<CheckCircle2 className="h-5 w-5 text-emerald-400" />}
              label="Users hoạt động"
              value={isLoading ? "..." : (stats?.users.active ?? 0)}
              bg="bg-emerald-600/10 border-emerald-800/40"
              sub={`${stats ? Math.round((stats.users.active / Math.max(1, stats.users.total)) * 100) : 0}% tổng số`}
            />
            <StatCard
              icon={<XCircle className="h-5 w-5 text-rose-400" />}
              label="Users vô hiệu"
              value={isLoading ? "..." : (stats?.users.inactive ?? 0)}
              bg="bg-rose-600/10 border-rose-800/40"
            />
            <StatCard
              icon={<Activity className="h-5 w-5 text-amber-400" />}
              label="Đăng ký mới (30 ngày)"
              value={isLoading ? "..." : (stats?.users.newLast30Days ?? 0)}
              bg="bg-amber-600/10 border-amber-800/40"
            />
          </div>
        </div>

        {/* Workspaces KPIs */}
        <div>
          <p className="mb-3 text-[11px] font-extrabold uppercase tracking-widest text-slate-500">
            🏢 Workspaces
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<Building2 className="h-5 w-5 text-indigo-400" />}
              label="Tổng Workspaces"
              value={isLoading ? "..." : (stats?.workspaces.total ?? 0)}
              bg="bg-indigo-600/10 border-indigo-800/40"
            />
            <StatCard
              icon={<CheckCircle2 className="h-5 w-5 text-emerald-400" />}
              label="Workspaces đang chạy"
              value={isLoading ? "..." : (stats?.workspaces.active ?? 0)}
              bg="bg-emerald-600/10 border-emerald-800/40"
            />
            <StatCard
              icon={<FolderOpen className="h-5 w-5 text-sky-400" />}
              label="Tổng Dự án"
              value={isLoading ? "..." : (stats?.projects.total ?? 0)}
              bg="bg-sky-600/10 border-sky-800/40"
            />
            <StatCard
              icon={<BarChart3 className="h-5 w-5 text-purple-400" />}
              label="Tổng Tasks"
              value={isLoading ? "..." : (stats?.tasks.total ?? 0)}
              bg="bg-purple-600/10 border-purple-800/40"
            />
          </div>
        </div>

        {/* Meetings */}
        <div>
          <p className="mb-3 text-[11px] font-extrabold uppercase tracking-widest text-slate-500">
            📹 Cuộc họp AI
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              icon={<Video className="h-5 w-5 text-cyan-400" />}
              label="Tổng cuộc họp đã ghi nhận"
              value={isLoading ? "..." : (stats?.meetings.total ?? 0)}
              bg="bg-cyan-600/10 border-cyan-800/40"
            />
            <StatCard
              icon={<Users className="h-5 w-5 text-blue-400" />}
              label="Quản trị viên hệ thống"
              value={isLoading ? "..." : (stats?.users.admins ?? 0)}
              bg="bg-blue-600/10 border-blue-800/40"
            />
            <StatCard
              icon={<Building2 className="h-5 w-5 text-slate-400" />}
              label="Workspaces đã lưu trữ"
              value={isLoading ? "..." : (stats?.workspaces.archived ?? 0)}
              bg="bg-slate-600/10 border-slate-700/40"
            />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function StatCard({
  icon,
  label,
  value,
  bg,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  bg: string;
  sub?: string;
}) {
  return (
    <div className={`rounded-2xl border p-5 space-y-3 ${bg}`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-bold text-slate-400">{label}</span>
      </div>
      <p className="text-3xl font-black text-white">{value}</p>
      {sub ? <p className="text-xs font-medium text-slate-500">{sub}</p> : null}
    </div>
  );
}
