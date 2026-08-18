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
import { getAdminAuditLogs, getObservability, getSystemStats, type AdminAuditItem, type ObservabilitySummary, SystemStats } from "@/features/admin/api/admin.api";
import { useAuth } from "@/hooks/useAuth";

export default function AdminDashboardPage() {
  const { user } = useAuth(true);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [observability, setObservability] = useState<ObservabilitySummary | null>(null);
  const [audits, setAudits] = useState<AdminAuditItem[]>([]);

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [res, telemetryRes, auditRes] = await Promise.all([getSystemStats(), getObservability(), getAdminAuditLogs()]);
      setStats(res.data); setObservability(telemetryRes.data); setAudits(auditRes.data.items);
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
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Tổng quan hệ thống
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Thống kê toàn bộ nền tảng AgileFlow AI theo thời gian thực
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
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
              icon={<Users className="h-5 w-5 text-blue-600" />}
              label="Tổng users"
              value={isLoading ? "..." : (stats?.users.total ?? 0)}
              bg="border-brand-200"
            />
            <StatCard
              icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
              label="Users hoạt động"
              value={isLoading ? "..." : (stats?.users.active ?? 0)}
              bg="bg-emerald-600/10 border-emerald-800/40"
              sub={`${stats ? Math.round((stats.users.active / Math.max(1, stats.users.total)) * 100) : 0}% tổng số`}
            />
            <StatCard
              icon={<XCircle className="h-5 w-5 text-rose-600" />}
              label="Users vô hiệu"
              value={isLoading ? "..." : (stats?.users.inactive ?? 0)}
              bg="bg-rose-600/10 border-rose-800/40"
            />
            <StatCard
              icon={<Activity className="h-5 w-5 text-amber-600" />}
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
              icon={<Building2 className="h-5 w-5 text-indigo-600" />}
              label="Tổng Workspaces"
              value={isLoading ? "..." : (stats?.workspaces.total ?? 0)}
              bg="bg-indigo-600/10 border-indigo-800/40"
            />
            <StatCard
              icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
              label="Workspaces đang chạy"
              value={isLoading ? "..." : (stats?.workspaces.active ?? 0)}
              bg="bg-emerald-600/10 border-emerald-800/40"
            />
            <StatCard
              icon={<FolderOpen className="h-5 w-5 text-sky-600" />}
              label="Tổng Dự án"
              value={isLoading ? "..." : (stats?.projects.total ?? 0)}
              bg="bg-sky-600/10 border-sky-800/40"
            />
            <StatCard
              icon={<BarChart3 className="h-5 w-5 text-violet-600" />}
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
              icon={<Video className="h-5 w-5 text-cyan-600" />}
              label="Tổng cuộc họp đã ghi nhận"
              value={isLoading ? "..." : (stats?.meetings.total ?? 0)}
              bg="bg-cyan-600/10 border-cyan-800/40"
            />
            <StatCard
              icon={<Users className="h-5 w-5 text-blue-600" />}
              label="Quản trị viên hệ thống"
              value={isLoading ? "..." : (stats?.users.admins ?? 0)}
              bg="border-brand-200"
            />
            <StatCard
              icon={<Building2 className="h-5 w-5 text-slate-400" />}
              label="Workspaces đã lưu trữ"
              value={isLoading ? "..." : (stats?.workspaces.archived ?? 0)}
              bg="border-slate-200"
            />
          </div>
        </div>
        <div>
          <p className="mb-3 text-[11px] font-extrabold uppercase tracking-widest text-slate-500">Vận hành 24 giờ</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={<XCircle className="h-5 w-5 text-rose-500" />} label="API / hệ thống lỗi" value={observability?.totals.failures ?? 0} bg="border-rose-200" />
            <StatCard icon={<Activity className="h-5 w-5 text-amber-500" />} label="API chậm" value={observability?.totals.slowApis ?? 0} bg="border-amber-200" />
            <StatCard icon={<XCircle className="h-5 w-5 text-orange-500" />} label="Job thất bại" value={observability?.totals.failedJobs ?? 0} bg="border-orange-200" />
            <StatCard icon={<BarChart3 className="h-5 w-5 text-violet-500" />} label="AI token / chi phí" value={`${(observability?.ai.inputTokens ?? 0) + (observability?.ai.outputTokens ?? 0)} / $${(observability?.ai.estimatedCostUsd ?? 0).toFixed(4)}`} bg="border-violet-200" sub={`Độ trễ TB ${observability?.ai.averageLatencyMs ?? 0} ms`} />
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"><h2 className="font-bold text-slate-800">Cảnh báo gần đây</h2><div className="mt-3 space-y-2 text-xs">{observability?.recentFailures.length ? observability.recentFailures.map((item) => <div key={item.id} className="rounded-lg border border-rose-100 bg-rose-50 p-3"><b>{item.kind} · {item.operation}</b><p className="mt-1 text-rose-700">{item.error}</p></div>) : <p className="text-slate-500">Không có lỗi trong cửa sổ theo dõi.</p>}</div></section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"><h2 className="font-bold text-slate-800">Nhật ký quản trị</h2><div className="mt-3 space-y-2 text-xs">{audits.slice(0, 10).map((item) => <div key={item.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3"><b>{item.action}</b><p className="text-slate-500">{item.targetType} · {item.targetId}</p></div>)}</div></section>
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
    <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md" data-tone={bg}>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 bg-slate-50">{icon}</div>
        <span className="text-xs font-bold text-slate-500">{label}</span>
      </div>
      <p className="text-3xl font-black text-slate-900">{value}</p>
      {sub ? <p className="text-xs font-medium text-slate-500">{sub}</p> : null}
    </div>
  );
}
