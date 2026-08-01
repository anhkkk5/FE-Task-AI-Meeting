"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  Boxes,
  Calendar,
  CheckCircle2,
  FolderKanban,
  Plus,
  RefreshCw,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { getWorkspaceMembers } from "@/features/members/api/members.api";
import { WorkspaceMember } from "@/features/members/types/member.type";
import { getProjects } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types/project.type";
import { getWorkspaceDetail } from "@/features/workspaces/api/workspaces.api";
import { Workspace } from "@/features/workspaces/types/workspace.type";
import { useAuth } from "@/hooks/useAuth";

export default function WorkspaceDetailPage() {
  const params = useParams<{ workspaceId: string }>();
  const { user, isLoading: authLoading } = useAuth(true);

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadWorkspaceData = useCallback(async () => {
    if (!params.workspaceId) return;

    setIsLoading(true);
    setMessage("");

    try {
      const [workspaceRes, projectsRes, membersRes] = await Promise.allSettled([
        getWorkspaceDetail(params.workspaceId),
        getProjects(params.workspaceId, { limit: 50 }),
        getWorkspaceMembers(params.workspaceId),
      ]);

      if (workspaceRes.status === "fulfilled") {
        setWorkspace(workspaceRes.value.data.workspace);
      } else {
        setMessage(
          workspaceRes.reason instanceof Error
            ? workspaceRes.reason.message
            : "Tải thông tin không gian thất bại.",
        );
      }

      if (projectsRes.status === "fulfilled") {
        setProjects(projectsRes.value.data.items);
      }

      if (membersRes.status === "fulfilled") {
        setMembers(membersRes.value.data.items);
      }
    } finally {
      setIsLoading(false);
    }
  }, [params.workspaceId]);

  useEffect(() => {
    if (user && params.workspaceId) {
      void loadWorkspaceData();
    }
  }, [user, params.workspaceId, loadWorkspaceData]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const initialLetter = workspace
    ? (workspace.name.trim()[0] || "W").toUpperCase()
    : "W";

  return (
    <AppShell workspaceId={params.workspaceId}>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Banner thông báo lỗi nếu có */}
        {message ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-xs font-bold text-amber-900 shadow-xs">
            {message}
          </div>
        ) : null}

        {/* 1. Workspace Header Banner (Thiết kế mới sang trọng, Xóa ID thô) */}
        {workspace ? (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8 space-y-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-6">
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-600 font-extrabold text-2xl text-white shadow-md shadow-blue-600/20">
                  {initialLetter}
                </div>

                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl">
                      {workspace.name}
                    </h1>
                    <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-bold text-slate-600 border border-slate-200/60">
                      @{workspace.slug}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-bold text-emerald-600 border border-emerald-200/60">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {workspace.status || "ACTIVE"}
                    </span>

                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-0.5 text-xs font-bold text-blue-600 border border-blue-200/60">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Vai trò: {workspace.myRole || "OWNER"}
                    </span>

                    <span className="inline-flex items-center rounded-full bg-purple-50 px-3 py-0.5 text-xs font-bold text-purple-700 border border-purple-200/60 uppercase">
                      Gói: {workspace.plan || "FREE"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void loadWorkspaceData()}
                  disabled={isLoading}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-95 disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-4 w-4 text-slate-500 ${
                      isLoading ? "animate-spin" : ""
                    }`}
                  />
                  Làm mới
                </button>

                <Link
                  href={`/workspaces/${params.workspaceId}/members`}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                >
                  <Users className="h-4 w-4 text-slate-500" />
                  Quản lý thành viên
                </Link>

                <Link
                  href={`/workspaces/${params.workspaceId}/projects/create`}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-5 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                  Tạo dự án mới
                </Link>
              </div>
            </div>

            {/* 4 Metric Cards cho Workspace */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 pt-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
                  <FolderKanban className="h-4 w-4 text-blue-600" />
                  <span>Dự án</span>
                </div>
                <span className="text-2xl font-extrabold text-slate-900">
                  {projects.length}
                </span>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
                  <Users className="h-4 w-4 text-purple-600" />
                  <span>Thành viên</span>
                </div>
                <span className="text-2xl font-extrabold text-slate-900">
                  {members.length}
                </span>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
                  <Calendar className="h-4 w-4 text-emerald-600" />
                  <span>Trạng thái</span>
                </div>
                <span className="text-2xl font-extrabold text-emerald-600">
                  Hoạt động
                </span>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
                  <span>Quyền truy cập</span>
                </div>
                <span className="text-2xl font-extrabold text-slate-900">
                  {workspace.myRole || "OWNER"}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {/* 2. Main Body Grid: Projects (Left 2/3) + Members & Info (Right 1/3) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column: Projects List */}
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Danh sách dự án ({projects.length})
                  </h2>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">
                    Các dự án thuộc không gian làm việc này
                  </p>
                </div>

                <Link
                  href={`/workspaces/${params.workspaceId}/projects`}
                  className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  <span>Xem tất cả</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* Projects Grid */}
              {isLoading && projects.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-xs font-semibold text-slate-400">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mr-2" />
                  Đang tải danh sách dự án...
                </div>
              ) : projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                  <FolderKanban className="h-10 w-10 text-slate-300 mb-2" />
                  <p className="text-sm font-extrabold text-slate-900">
                    Chưa có dự án nào
                  </p>
                  <p className="mt-1 text-xs text-slate-500 font-medium">
                    Tạo dự án đầu tiên để quản lý công việc và tiến độ Sprint.
                  </p>
                  <Link
                    href={`/workspaces/${params.workspaceId}/projects/create`}
                    className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    Tạo dự án mới
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {projects.map((project) => {
                    const tagColors = [
                      "bg-blue-600 text-white",
                      "bg-blue-700 text-white",
                      "bg-sky-600 text-white",
                    ];
                    const tagColor =
                      tagColors[
                        Math.abs(project.keyCode?.charCodeAt(0) || 0) %
                          tagColors.length
                      ];

                    return (
                      <Link
                        key={project.id}
                        href={`/workspaces/${params.workspaceId}/projects/${project.id}`}
                        className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-md flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span
                              className={`inline-flex items-center justify-center rounded-lg px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider ${tagColor}`}
                            >
                              {project.keyCode || "PRJ"}
                            </span>

                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                              Active
                            </span>
                          </div>

                          <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {project.name}
                          </h3>

                          <p className="line-clamp-2 text-xs font-medium text-slate-500 leading-relaxed">
                            {project.description || "Chưa có mô tả dự án."}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-semibold">
                            Chi tiết dự án
                          </span>
                          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 group-hover:text-blue-600 transition-all" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Mô tả Workspace */}
            {workspace?.description ? (
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-2">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                  Mô tả không gian làm việc
                </h3>
                <p className="text-xs font-medium text-slate-700 leading-relaxed bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                  {workspace.description}
                </p>
              </div>
            ) : null}
          </div>

          {/* Right Column: Members & Settings */}
          <div className="space-y-6">
            {/* Component Thành viên */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Thành viên ({members.length})
                  </h3>
                  <p className="text-xs font-medium text-slate-400 mt-0.5">
                    Thành viên nhóm trong Workspace
                  </p>
                </div>
                <Link
                  href={`/workspaces/${params.workspaceId}/members`}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Xem tất cả
                </Link>
              </div>

              {members.length === 0 ? (
                <div className="py-6 text-center text-xs font-medium text-slate-400">
                  Chưa có thành viên nào.
                </div>
              ) : (
                <ul className="space-y-3">
                  {members.slice(0, 5).map((m) => {
                    const initials = m.fullName
                      ? m.fullName
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()
                      : "U";

                    return (
                      <li
                        key={m.memberId}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {m.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={m.avatarUrl}
                              alt={m.fullName || "Member"}
                              className="h-9 w-9 rounded-full object-cover ring-2 ring-blue-500/20"
                            />
                          ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700 font-extrabold text-xs border border-blue-200/60">
                              {initials}
                            </div>
                          )}

                          <div className="min-w-0">
                            <p className="truncate text-xs font-extrabold text-slate-900">
                              {m.fullName || "Thành viên"}
                            </p>
                            <p className="truncate text-[11px] font-medium text-slate-400">
                              {m.email || ""}
                            </p>
                          </div>
                        </div>

                        <span className="rounded-full bg-slate-200/60 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-700 uppercase shrink-0">
                          {m.role}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Khung Quick Settings & Navigation */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-3">
              <h3 className="text-base font-extrabold text-slate-900">
                Quản trị Workspace
              </h3>
              <p className="text-xs font-medium text-slate-500">
                Thay đổi cấu hình tên, mô tả hoặc phân quyền thành viên.
              </p>

              <div className="pt-2">
                <Link
                  href={`/workspaces/${params.workspaceId}/settings`}
                  className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <Settings className="h-4 w-4 text-slate-500" />
                    <span>Cài đặt Workspace</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
