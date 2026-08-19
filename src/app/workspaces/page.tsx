"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  FolderKanban,
  Plus,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { ProductOutlined } from "@ant-design/icons";
import { AppShell } from "@/components/layout/AppShell";
import { getWorkspacesOverview } from "@/features/stats/api/stats.api";
import { WorkspacesOverview } from "@/features/stats/types/stats.type";
import { getMyWorkspaces } from "@/features/workspaces/api/workspaces.api";
import { getWorkspaceMembers } from "@/features/members/api/members.api";
import { WorkspaceMember } from "@/features/members/types/member.type";
import { WorkspaceCard } from "@/features/workspaces/components/WorkspaceCard";
import { Workspace, WorkspaceStatus } from "@/features/workspaces/types/workspace.type";
import { useAuth } from "@/hooks/useAuth";

const KPI_AVATAR_COLORS = [
  "bg-blue-100 text-blue-700 border-blue-200",
  "bg-purple-100 text-purple-700 border-purple-200",
  "bg-emerald-100 text-emerald-700 border-emerald-200",
  "bg-amber-100 text-amber-800 border-amber-200",
];

function getMemberInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    return email.slice(0, 2).toUpperCase();
  }
  return "U";
}

function KpiMemberAvatar({ member, index }: { member: WorkspaceMember; index: number }) {
  const [imgError, setImgError] = useState(false);
  const displayName = member.fullName?.trim() || member.email || "Thành viên";
  const initials = getMemberInitials(member.fullName, member.email);
  const colorClass = KPI_AVATAR_COLORS[index % KPI_AVATAR_COLORS.length];

  return (
    <div
      className="inline-block transition-transform duration-150 hover:z-20 hover:scale-110"
      title={displayName}
    >
      {member.avatarUrl && !imgError ? (
        <img
          src={member.avatarUrl}
          alt={displayName}
          onError={() => setImgError(true)}
          className="h-6 w-6 rounded-full object-cover border-2 border-white shadow-2xs"
        />
      ) : (
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[9px] font-black tracking-tight shadow-2xs ${colorClass}`}
        >
          {initials}
        </div>
      )}
    </div>
  );
}

export default function WorkspacesPage() {
  const { user, isLoading: authLoading } = useAuth(true);
  const [status, setStatus] = useState<WorkspaceStatus | "">("");
  const [items, setItems] = useState<Workspace[]>([]);
  const [overview, setOverview] = useState<WorkspacesOverview | null>(null);
  const [membersByWorkspace, setMembersByWorkspace] = useState<Record<string, WorkspaceMember[]>>({});
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadWorkspaces = useCallback(
    async () => {
      setIsLoading(true);
      setMessage("");

      try {
        const [workspacesResult, overviewResult] = await Promise.allSettled([
          getMyWorkspaces(status === "" ? undefined : status),
          getWorkspacesOverview(),
        ]);

        let loadedItems: Workspace[] = [];

        if (workspacesResult.status === "fulfilled") {
          loadedItems = workspacesResult.value.data.items;
          setItems(loadedItems);
        } else {
          setItems([]);
          setMessage(
            workspacesResult.reason instanceof Error
              ? workspacesResult.reason.message
              : "Tải danh sách không gian thất bại.",
          );
        }

        if (overviewResult.status === "fulfilled") {
          setOverview(overviewResult.value.data);
        } else {
          setOverview(null);
        }

        // Tải danh sách thành viên của từng workspace song song
        if (loadedItems.length > 0) {
          setIsLoadingMembers(true);
          try {
            const memberResults = await Promise.allSettled(
              loadedItems.map((ws) => getWorkspaceMembers(ws.id)),
            );
            const mapping: Record<string, WorkspaceMember[]> = {};
            memberResults.forEach((res, index) => {
              const wsId = loadedItems[index].id;
              if (res.status === "fulfilled") {
                mapping[wsId] = res.value.data.items;
              } else {
                mapping[wsId] = [];
              }
            });
            setMembersByWorkspace(mapping);
          } catch {
            // Không chặn giao diện nếu lỗi tải avatar
          } finally {
            setIsLoadingMembers(false);
          }
        }
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Tải danh sách không gian thất bại.");
      } finally {
        setIsLoading(false);
      }
    },
    [status],
  );

  useEffect(() => {
    if (user) {
      void loadWorkspaces();
    }
  }, [user, loadWorkspaces]);

  const statsByWorkspace = useMemo(() => {
    return new Map(
      (overview?.workspaces ?? []).map((item) => [item.workspaceId, item]),
    );
  }, [overview]);

  // Gom các thành viên duy nhất trên toàn bộ các workspace cho card Tổng thành viên
  const distinctGlobalMembers = useMemo(() => {
    const map = new Map<string, WorkspaceMember>();
    Object.values(membersByWorkspace).forEach((members) => {
      members.forEach((m) => {
        const key = m.userId || m.email || m.memberId;
        if (!map.has(key)) {
          map.set(key, m);
        }
      });
    });
    return Array.from(map.values());
  }, [membersByWorkspace]);

  const summaryValue = (value: number | undefined) =>
    value === undefined ? "—" : String(value);

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-5 pb-10">
        {/* Header Toolbar Card */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/40 sm:p-8">
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[43%] overflow-hidden lg:block">
            <div className="absolute -right-12 -top-28 h-80 w-80 rounded-[4rem] border border-blue-100/70 bg-gradient-to-br from-blue-50/70 to-transparent rotate-12" />
            <div className="absolute right-28 top-24 flex h-20 w-20 rotate-6 items-center justify-center rounded-3xl border border-blue-200/60 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-500/20">
              <ProductOutlined className="text-3xl" />
            </div>
            <div className="absolute right-4 top-40 h-28 w-28 rotate-12 rounded-3xl border border-blue-100/70 bg-blue-50/30" />
            <div className="absolute right-52 top-10 h-8 w-8 rotate-12 rounded-lg border border-blue-100 bg-blue-50/40" />
          </div>
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                <ProductOutlined className="text-sm text-blue-600" />
                Workspace Management
              </div>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                Không gian làm việc (Workspace)
              </h1>
              <p className="mt-2 text-sm font-medium text-slate-500 sm:text-base">
                Quản lý toàn bộ Workspace, dự án và thành viên thuộc quyền của bạn
              </p>
            </div>

            <div className="relative flex flex-wrap items-center gap-3">
              <button
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-md shadow-slate-200/50 transition hover:border-blue-200 hover:bg-blue-50/40 hover:text-blue-700 active:scale-95 disabled:opacity-60"
                type="button"
                onClick={() => void loadWorkspaces()}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 text-blue-600 ${isLoading ? "animate-spin" : ""}`} />
                Làm mới
              </button>
              <Link
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 active:scale-95"
                href="/workspaces/create"
              >
                <Plus className="h-4 w-4" />
                Tạo Workspace mới
              </Link>
            </div>
          </div>

          {/* Search bar inside header */}
          <div className="relative mt-7 flex items-center justify-between gap-4 border-t border-slate-100 pt-5">
            <div className="relative max-w-xl flex-1">
              <input
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 hover:bg-white focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                placeholder="Tìm kiếm workspace theo tên hoặc slug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            <div className="text-xs font-bold text-slate-500">
              Đang hiển thị <span className="font-extrabold text-blue-600">{filteredItems.length}</span> / {items.length} Workspace
            </div>
          </div>
        </div>

        {/* Top Stats KPI Cards với Font chữ rõ nét & Nhãn dễ đọc */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Workspaces */}
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:border-blue-200 hover:shadow-sm">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600">
              <ProductOutlined className="text-2xl" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">Không gian làm việc</p>
              <p className="mt-0.5 text-2xl font-black text-slate-900">{items.length}</p>
            </div>
          </div>

          {/* Projects */}
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:border-emerald-200 hover:shadow-sm">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200/80">
              <FolderKanban className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">Dự án đang chạy</p>
              <p className="mt-0.5 text-2xl font-black text-slate-900">{summaryValue(overview?.summary.projects)}</p>
            </div>
          </div>

          {/* Members */}
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:border-indigo-200 hover:shadow-sm">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-200/80">
              <Users className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-slate-500">Tổng thành viên</p>
                {distinctGlobalMembers.length > 0 && (
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {distinctGlobalMembers.slice(0, 3).map((m, idx) => (
                      <KpiMemberAvatar key={m.userId || m.email || idx} member={m} index={idx} />
                    ))}
                  </div>
                )}
              </div>
              <p className="mt-0.5 text-2xl font-black text-slate-900">{summaryValue(overview?.summary.members)}</p>
            </div>
          </div>

          {/* Meetings */}
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:border-amber-200 hover:shadow-sm">
            <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/80">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">Cuộc họp hàng ngày</p>
              <p className="mt-0.5 text-2xl font-black text-slate-900">{summaryValue(overview?.summary.meetings)}</p>
            </div>
          </div>
        </div>

        {/* Message Banner */}
        {message ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-xs font-bold text-rose-800 shadow-xs">
            {message}
          </div>
        ) : null}

        {/* Workspaces Grid */}
        {isLoading ? (
          <div className="flex h-48 items-center justify-center rounded-3xl border border-slate-200/80 bg-white shadow-xs">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((workspace) => (
              <WorkspaceCard
                key={workspace.id}
                workspace={workspace}
                stats={statsByWorkspace.get(workspace.id)}
                members={membersByWorkspace[workspace.id] || []}
                isLoadingMembers={isLoadingMembers}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
