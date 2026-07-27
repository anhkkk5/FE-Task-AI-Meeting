"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { getProjectDetail } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types/project.type";
import { getTasks } from "@/features/tasks/api/tasks.api";
import { Task } from "@/features/tasks/types/task.type";
import { getSprints } from "@/features/sprints/api/sprints.api";
import { Sprint } from "@/features/sprints/types/sprint.type";
import { useAuth } from "@/hooks/useAuth";

export default function ProjectDetailPage() {
  const params = useParams<{ workspaceId: string; projectId: string }>();
  const { user, isLoading: authLoading } = useAuth(true);

  // States
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadProjectData = useCallback(async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const [projectResponse, tasksResponse, sprintsResponse] = await Promise.all([
        getProjectDetail(params.workspaceId, params.projectId),
        getTasks(params.workspaceId, params.projectId, { page: 1, limit: 100 }),
        getSprints(params.workspaceId, params.projectId, { page: 1, limit: 100 }),
      ]);
      setProject(projectResponse.data.project);
      setTasks(tasksResponse.data.items);
      setSprints(sprintsResponse.data.items);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Tải thông tin dự án thất bại.");
    } finally {
      setIsLoading(false);
    }
  }, [params.projectId, params.workspaceId]);

  useEffect(() => {
    if (user && params.workspaceId && params.projectId) {
      void loadProjectData();
    }
  }, [user, params.workspaceId, params.projectId, loadProjectData]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-t-transparent"></div>
      </div>
    );
  }

  const status = project?.status || "ACTIVE";

  // Thống kê tiến độ
  const totalTasksCount = tasks.length;
  const doneTasksCount = tasks.filter((t) => t.status === "DONE").length;
  const inProgressTasksCount = tasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "REVIEW").length;
  const todoTasksCount = tasks.filter((t) => t.status === "TODO" || t.status === "BACKLOG").length;
  const progressPercent = totalTasksCount > 0 ? Math.round((doneTasksCount / totalTasksCount) * 100) : 0;

  const statusBadgeColor =
    status === "ACTIVE"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : status === "COMPLETED"
      ? "bg-indigo-50 text-indigo-700 border-indigo-100"
      : "bg-amber-50 text-amber-700 border-amber-100";

  return (
    <AppShell workspaceId={params.workspaceId} projectId={params.projectId} title={project?.name}>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {message && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
            {message}
          </div>
        )}

        {isLoading ? (
          <div className="flex h-48 items-center justify-center bg-white rounded-2xl border border-zinc-200">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent"></div>
          </div>
        ) : project ? (
          <div className="space-y-6">
            {/* Overview Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm flex flex-col justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Tổng số Sprint</span>
                <span className="text-2xl font-black text-zinc-900 mt-2">{sprints.length}</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm flex flex-col justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Tổng số Task</span>
                <span className="text-2xl font-black text-zinc-900 mt-2">{totalTasksCount}</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm flex flex-col justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Đang thực hiện</span>
                <span className="text-2xl font-black text-blue-600 mt-2">{inProgressTasksCount}</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm flex flex-col justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Hoàn thành</span>
                <span className="text-2xl font-black text-emerald-600 mt-2">
                  {doneTasksCount} <span className="text-xs font-semibold text-zinc-400">/ {totalTasksCount}</span>
                </span>
              </div>
            </div>

            {/* Main Progress Block */}
            <div className="border border-zinc-200/80 bg-white p-6 rounded-2xl shadow-sm space-y-6">
              <div>
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Tiến độ dự án</h3>
                <div className="flex items-center justify-between text-xs font-bold text-zinc-700 mb-2">
                  <span>Tỉ lệ hoàn thành task</span>
                  <span className="text-emerald-600">{progressPercent}%</span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-3 overflow-hidden border border-zinc-200/50">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                {/* Breakdown Progress items */}
                <div className="flex gap-4 mt-3 text-[10px] font-bold text-zinc-500">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-zinc-300"></span>
                    <span>Cần làm: {todoTasksCount} ({totalTasksCount > 0 ? Math.round((todoTasksCount / totalTasksCount) * 100) : 0}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-blue-500"></span>
                    <span>Đang làm: {inProgressTasksCount} ({totalTasksCount > 0 ? Math.round((inProgressTasksCount / totalTasksCount) * 100) : 0}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>
                    <span>Đã xong: {doneTasksCount} ({progressPercent}%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div className="border border-zinc-200/80 bg-white p-6 rounded-2xl shadow-sm space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-block rounded bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-600 font-mono mb-2">
                    Key Code: {project.keyCode}
                  </span>
                  <h1 className="text-xl font-bold text-zinc-900 leading-tight">{project.name}</h1>
                  {project.description ? null : (
                    <p className="mt-1 text-xs text-zinc-400">Chưa có mô tả cho dự án này.</p>
                  )}
                </div>
                <span className={`border px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${statusBadgeColor}`}>
                  {status}
                </span>
              </div>

              <div className="border-t border-zinc-100 pt-6">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Thông tin chung</h3>
                <dl className="grid gap-4 sm:grid-cols-3">
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Người quản trị
                    </dt>
                    <dd className="mt-1 text-xs font-semibold text-zinc-800">
                      {project.createdByUser?.fullName ??
                        project.createdByUser?.email ??
                        "-"}
                    </dd>
                    {project.createdByUser?.fullName && project.createdByUser.email ? (
                      <p className="mt-0.5 text-[10px] font-medium text-zinc-500 break-all">
                        {project.createdByUser.email}
                      </p>
                    ) : null}
                  </div>
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Ngày bắt đầu
                    </dt>
                    <dd className="mt-1 text-xs font-semibold text-zinc-800">
                      {project.startDate ? new Date(project.startDate).toLocaleDateString("vi-VN") : "-"}
                    </dd>
                  </div>
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Hạn hoàn thành
                    </dt>
                    <dd className="mt-1 text-xs font-semibold text-zinc-800">
                      {project.endDate ? new Date(project.endDate).toLocaleDateString("vi-VN") : "-"}
                    </dd>
                  </div>
                </dl>
              </div>

              {project.description ? (
                <div className="border-t border-zinc-100 pt-6">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Mô tả dự án</h3>
                  <p className="text-xs text-zinc-700 leading-relaxed bg-zinc-50/50 p-4 rounded-xl border border-zinc-100">
                    {project.description}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-zinc-200">
            <p className="text-sm text-zinc-500">Không tìm thấy thông tin chi tiết dự án.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
