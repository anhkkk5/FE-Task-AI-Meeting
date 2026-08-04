"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Calendar,
  FileSpreadsheet,
  Printer,
  TrendingUp,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { SprintBurndownChart } from "@/features/analytics/components/SprintBurndownChart";
import { getProjectDetail } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types/project.type";
import { getSprints } from "@/features/sprints/api/sprints.api";
import { Sprint } from "@/features/sprints/types/sprint.type";
import {
  exportSprintReportToPDF,
  exportTasksToExcel,
} from "@/features/sprints/utils/export-sprint-report";
import { getTasks } from "@/features/tasks/api/tasks.api";
import { Task } from "@/features/tasks/types/task.type";
import { useAuth } from "@/hooks/useAuth";

export default function ProjectAnalyticsPage() {
  const params = useParams<{ workspaceId: string; projectId: string }>();
  const { user, isLoading: authLoading } = useAuth(true);

  const [project, setProject] = useState<Project | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!params.workspaceId || !params.projectId) return;

    setIsLoading(true);

    try {
      const [projectRes, sprintsRes, tasksRes] = await Promise.allSettled([
        getProjectDetail(params.workspaceId, params.projectId),
        getSprints(params.workspaceId, params.projectId, { limit: 50 }),
        getTasks(params.workspaceId, params.projectId, { limit: 100 }),
      ]);

      if (projectRes.status === "fulfilled") {
        setProject(projectRes.value.data.project);
      }

      if (sprintsRes.status === "fulfilled") {
        const loadedSprints = sprintsRes.value.data.items;
        setSprints(loadedSprints);
        if (loadedSprints.length > 0 && !selectedSprintId) {
          const activeSprint =
            loadedSprints.find((s) => s.status === "ACTIVE") || loadedSprints[0];
          setSelectedSprintId(activeSprint.id);
        }
      }

      if (tasksRes.status === "fulfilled") {
        setTasks(tasksRes.value.data.items);
      }
    } finally {
      setIsLoading(false);
    }
  }, [params.workspaceId, params.projectId, selectedSprintId]);

  useEffect(() => {
    if (user && params.workspaceId && params.projectId) {
      void loadData();
    }
  }, [user, params.workspaceId, params.projectId, loadData]);

  const currentSprint = useMemo(
    () => sprints.find((s) => s.id === selectedSprintId) || sprints[0] || null,
    [sprints, selectedSprintId],
  );

  // Velocity data per sprint
  const velocityData = useMemo(() => {
    return sprints.map((sprint) => {
      const sprintTasks = tasks.filter((t) => t.sprintId === sprint.id);
      const completed = sprintTasks.filter((t) => t.status === "DONE").length;
      return {
        sprintName: sprint.name,
        total: sprintTasks.length,
        completed,
      };
    });
  }, [sprints, tasks]);

  const avgVelocity = useMemo(() => {
    if (velocityData.length === 0) return 0;
    const sum = velocityData.reduce((acc, curr) => acc + curr.completed, 0);
    return Math.round((sum / velocityData.length) * 10) / 10;
  }, [velocityData]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <AppShell
      workspaceId={params.workspaceId}
      projectId={params.projectId}
      title={project?.name}
    >
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header Bar */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700 border border-blue-200/60">
                <BarChart3 className="h-3.5 w-3.5" />
                Agile Analytics & Velocity
              </div>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Thống kê & Biểu đồ Tiến độ
              </h1>
              <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
                Theo dõi Burndown Chart và Tốc độ hoàn thành (Velocity) của đội nhóm trong dự án{" "}
                <strong className="text-slate-900 font-extrabold">
                  {project?.name || "Dự án"}
                </strong>
              </p>
            </div>

            {/* Export Toolbar */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() =>
                  exportTasksToExcel(
                    tasks,
                    `${project?.keyCode || "PRJ"}_Analytics_Report.csv`,
                  )
                }
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-95"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                Xuất Excel
              </button>

              <button
                type="button"
                onClick={() =>
                  exportSprintReportToPDF(
                    currentSprint,
                    tasks,
                    project?.name,
                    "Workspace",
                  )
                }
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 active:scale-95"
              >
                <Printer className="h-4 w-4" />
                Báo cáo PDF
              </button>
            </div>
          </div>
        </div>

        {/* Sprint Selector Toolbar for Burndown */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span>Chọn Sprint xem Burndown:</span>
          </div>

          <select
            value={selectedSprintId}
            onChange={(e) => setSelectedSprintId(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-800 outline-none hover:border-blue-500 focus:bg-white transition cursor-pointer"
          >
            {sprints.length === 0 ? (
              <option value="">Chưa có Sprint nào</option>
            ) : (
              sprints.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.status})
                </option>
              ))
            )}
          </select>
        </div>

        {/* 1. Burndown Chart */}
        <SprintBurndownChart
          sprint={currentSprint}
          tasks={tasks.filter((t) => t.sprintId === currentSprint?.id)}
          projectName={project?.name}
        />

        {/* 2. Velocity Graph (Biểu đồ Tốc độ hoàn thành giữa các Sprint) */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                Biểu đồ Tốc độ hoàn thành (Velocity Graph)
              </h3>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                So sánh số lượng task đã hoàn thành qua từng Sprint
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-3.5 py-1.5 text-xs font-extrabold text-emerald-700 border border-emerald-200/60">
              <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
              <span>Tốc độ trung bình: {avgVelocity} tasks/sprint</span>
            </div>
          </div>

          {velocityData.length === 0 ? (
            <div className="py-8 text-center text-xs font-medium text-slate-400">
              Chưa có dữ liệu Sprint để tính toán Velocity.
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {velocityData.map((item, idx) => {
                const maxVal = Math.max(1, item.total);
                const pct = Math.round((item.completed / maxVal) * 100);

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800">{item.sprintName}</span>
                      <span className="text-slate-500">
                        <strong className="text-emerald-600 font-extrabold">
                          {item.completed}
                        </strong>{" "}
                        / {item.total} tasks hoàn thành
                      </span>
                    </div>

                    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 flex">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
