"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Clock,
  FolderKanban,
  ListChecks,
  PlayCircle,
  Plus,
} from "lucide-react";
import { Sprint } from "@/features/sprints/types/sprint.type";
import { Task } from "@/features/tasks/types/task.type";
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
  tasks: Task[];
  isLoading: boolean;
};

export function DashboardSprintBanner({
  projects,
  selectedProjectId,
  onSelectProject,
  sprints,
  tasks,
  isLoading,
}: DashboardSprintBannerProps) {
  // Track open/collapsed state for sprint accordion rows
  const [openSprintIds, setOpenSprintIds] = useState<Record<string, boolean>>({});

  const toggleSprint = (sprintId: string) => {
    setOpenSprintIds((prev) => ({
      ...prev,
      [sprintId]: !prev[sprintId],
    }));
  };

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || null,
    [projects, selectedProjectId],
  );

  // Group tasks by sprintId
  const tasksBySprint = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach((t) => {
      const sId = t.sprintId || "backlog";
      if (!map.has(sId)) map.set(sId, []);
      map.get(sId)!.push(t);
    });
    return map;
  }, [tasks]);

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-5">
      {/* Top Header Row with Project Selector Dropdown */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Sprint & Công việc trong Dự án
            </h2>
            {selectedProject ? (
              <span className="rounded-full bg-blue-50 px-3 py-0.5 text-xs font-bold text-blue-700 border border-blue-200/60">
                [{selectedProject.keyCode}] {selectedProject.name}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Xem tiến độ từng Sprint và danh sách các công việc bên trong (Đóng / Mở)
          </p>
        </div>

        {/* Project Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0">
            <FolderKanban className="h-4 w-4 text-blue-600" />
            <span>Chọn dự án:</span>
          </label>

          <select
            value={selectedProjectId}
            onChange={(e) => onSelectProject(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-800 outline-none hover:border-blue-500 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition cursor-pointer max-w-[240px] truncate"
          >
            {projects.length === 0 ? (
              <option value="">Chưa có dự án nào</option>
            ) : (
              projects.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.keyCode}] {p.name}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Sprints Accordion List */}
      {isLoading ? (
        <div className="flex h-36 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50/60 p-6">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-400">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mr-1" />
            Đang tải dữ liệu Sprint & Tasks...
          </div>
        </div>
      ) : !selectedProject ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
          <FolderKanban className="h-10 w-10 text-slate-300 mb-2" />
          <p className="text-sm font-extrabold text-slate-900">
            Chưa chọn dự án
          </p>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            Chọn dự án ở góc trên bên phải để xem tiến độ Sprint và các công việc.
          </p>
        </div>
      ) : sprints.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center space-y-3">
          <Calendar className="h-10 w-10 text-slate-300" />
          <div>
            <p className="text-sm font-extrabold text-slate-900">
              Dự án “{selectedProject.name}” chưa có Sprint nào
            </p>
            <p className="mt-1 text-xs text-slate-500 font-medium max-w-sm">
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
          {sprints.map((sprint, index) => {
            const sprintTasks = tasksBySprint.get(sprint.id) || [];
            const doneCount = sprintTasks.filter((t) => t.status === "DONE").length;
            const totalCount = sprintTasks.length;
            const progressPct =
              totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

            // Default first active sprint to open
            const isOpen =
              openSprintIds[sprint.id] ?? (sprint.status === "ACTIVE" || index === 0);

            const isCurrentActive = sprint.status === "ACTIVE";

            return (
              <div
                key={sprint.id}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-all shadow-2xs"
              >
                {/* Sprint Accordion Header (Bấm để Đóng / Mở) */}
                <div
                  onClick={() => toggleSprint(sprint.id)}
                  className="flex flex-col gap-3 p-4 bg-slate-50/70 hover:bg-slate-100/80 cursor-pointer transition sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-slate-500 shadow-2xs border border-slate-200 shrink-0"
                    >
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-extrabold text-slate-900 truncate">
                          {sprint.name}
                        </h3>

                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border ${
                            isCurrentActive
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200/60"
                              : sprint.status === "COMPLETED"
                              ? "bg-purple-50 text-purple-700 border-purple-200/60"
                              : "bg-blue-50 text-blue-700 border-blue-200/60"
                          }`}
                        >
                          {isCurrentActive ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          ) : null}
                          {isCurrentActive
                            ? "Đang diễn ra"
                            : sprint.status === "COMPLETED"
                            ? "Đã hoàn thành"
                            : "Sắp tới"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress & Task Counter */}
                  <div className="flex items-center gap-4 shrink-0 sm:justify-end">
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-slate-500">
                          <strong className="text-slate-900 font-extrabold">
                            {doneCount}
                          </strong>{" "}
                          / {totalCount} tasks
                        </span>
                        <span className="font-extrabold text-blue-600">
                          {progressPct}%
                        </span>
                      </div>

                      {/* Micro Progress Bar */}
                      <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full bg-blue-600 transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Collapsible Nested Tasks List (Mở ra là các Task) */}
                {isOpen && (
                  <div className="border-t border-slate-100 bg-white p-4 space-y-2">
                    {sprintTasks.length === 0 ? (
                      <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50/60 text-xs font-semibold text-slate-400">
                        <span>Chưa có công việc nào được gán vào Sprint này.</span>
                        <Link
                          href={`/workspaces/${selectedProject.workspaceId}/projects/${selectedProject.id}/tasks`}
                          className="text-blue-600 hover:underline font-bold"
                        >
                          + Thêm Task
                        </Link>
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {sprintTasks.map((task) => {
                          const isDone = task.status === "DONE";
                          const isInProgress = task.status === "IN_PROGRESS";

                          const statusStyle = isDone
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                            : isInProgress
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200/60"
                            : "bg-slate-100 text-slate-700 border-slate-200/60";

                          return (
                            <li key={task.id}>
                              <Link
                                href={`/workspaces/${selectedProject.workspaceId}/projects/${selectedProject.id}/tasks`}
                                className="group flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition hover:border-blue-500/50 hover:bg-blue-50/20 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="shrink-0">
                                    {isDone ? (
                                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                    ) : isInProgress ? (
                                      <PlayCircle className="h-4 w-4 text-indigo-600" />
                                    ) : (
                                      <Clock className="h-4 w-4 text-slate-400" />
                                    )}
                                  </div>

                                  <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-extrabold text-slate-600 border border-slate-200 shadow-2xs font-mono shrink-0">
                                    {task.taskCode}
                                  </span>

                                  <p className="truncate text-xs font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                                    {task.title}
                                  </p>
                                </div>

                                <div className="flex items-center justify-between gap-4 sm:justify-end shrink-0">
                                  {task.assignee ? (
                                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[9px] font-extrabold text-blue-700">
                                        {task.assignee.fullName.slice(0, 1)}
                                      </div>
                                      <span className="truncate max-w-[100px]">
                                        {task.assignee.fullName}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-[11px] font-medium text-slate-400 italic">
                                      Chưa phân công
                                    </span>
                                  )}

                                  <span
                                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase border ${statusStyle}`}
                                  >
                                    {task.status}
                                  </span>
                                </div>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
