"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, Calendar, FolderKanban, Plus } from "lucide-react";
import { Sprint } from "@/features/sprints/types/sprint.type";
import { formatDate } from "@/lib/utils/relative-time";

type ProjectOption = {
  id: string;
  name: string;
  keyCode: string;
  workspaceId: string;
};

type DashboardSprintBannerProps = {
  projects: ProjectOption[];
  selectedProjectId: string;
  onSelectProject: (projectId: string) => void;
  sprints: Sprint[];
  isLoading: boolean;
};

const statusLabel: Record<Sprint["status"], string> = {
  ACTIVE: "Đang diễn ra",
  COMPLETED: "Đã hoàn thành",
  PLANNED: "Sắp tới",
  CANCELLED: "Đã hủy",
};

const statusClass: Record<Sprint["status"], string> = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  COMPLETED: "border-violet-200 bg-violet-50 text-violet-700",
  PLANNED: "border-blue-200 bg-blue-50 text-blue-700",
  CANCELLED: "border-slate-200 bg-slate-100 text-slate-600",
};

export function DashboardSprintBanner({
  projects,
  selectedProjectId,
  onSelectProject,
  sprints,
  isLoading,
}: DashboardSprintBannerProps) {
  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  return (
    <section className="space-y-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
              Sprint trong Dự án
            </h2>
            {selectedProject ? (
              <span className="rounded-full border border-blue-200/60 bg-blue-50 px-3 py-0.5 text-xs font-bold text-blue-700">
                [{selectedProject.keyCode}] {selectedProject.name}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Theo dõi các Sprint của dự án. Công việc chi tiết được quản lý tại Backlog.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex shrink-0 items-center gap-1 text-xs font-bold text-slate-500">
            <FolderKanban className="h-4 w-4 text-blue-600" />
            Chọn dự án:
          </label>
          <select
            value={selectedProjectId}
            onChange={(event) => onSelectProject(event.target.value)}
            className="h-10 max-w-[240px] cursor-pointer truncate rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-800 outline-none transition hover:border-blue-500 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
          >
            {projects.length === 0 ? (
              <option value="">Chưa có dự án nào</option>
            ) : (
              projects.map((project) => (
                <option key={project.id} value={project.id}>
                  [{project.keyCode}] {project.name}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-36 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50/60 p-6">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-400">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            Đang tải danh sách Sprint...
          </div>
        </div>
      ) : !selectedProject ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
          <FolderKanban className="mb-2 h-10 w-10 text-slate-300" />
          <p className="text-sm font-extrabold text-slate-900">Chưa chọn dự án</p>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Chọn dự án ở góc trên bên phải để xem danh sách Sprint.
          </p>
        </div>
      ) : sprints.length === 0 ? (
        <div className="flex flex-col items-center justify-center space-y-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
          <Calendar className="h-10 w-10 text-slate-300" />
          <div>
            <p className="text-sm font-extrabold text-slate-900">
              Dự án “{selectedProject.name}” chưa có Sprint nào
            </p>
            <p className="mt-1 max-w-sm text-xs font-medium text-slate-500">
              Khởi tạo Sprint đầu tiên để bắt đầu giao việc và theo dõi tiến độ hoàn thành.
            </p>
          </div>
          <Link
            href={`/workspaces/${selectedProject.workspaceId}/projects/${selectedProject.id}/sprints/create`}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Tạo Sprint mới
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sprints.map((sprint) => (
            <article
              key={sprint.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 shadow-2xs transition hover:border-blue-200 hover:bg-blue-50/30 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-600 shadow-2xs">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-extrabold text-slate-900">
                      {sprint.name}
                    </h3>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold ${statusClass[sprint.status]}`}>
                      {sprint.status === "ACTIVE" ? (
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                      ) : null}
                      {statusLabel[sprint.status]}
                    </span>
                  </div>
                  <p className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                    {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}
                  </p>
                  {sprint.goal ? (
                    <p className="line-clamp-1 text-xs text-slate-500">{sprint.goal}</p>
                  ) : null}
                </div>
              </div>
              <Link
                href={`/workspaces/${selectedProject.workspaceId}/projects/${selectedProject.id}/sprints`}
                className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
              >
                Mở Backlog
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
