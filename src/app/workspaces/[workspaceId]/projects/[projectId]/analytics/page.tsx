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
  Activity,
  AlertTriangle,
  Users,
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
import { getWorkspaceMembers } from "@/features/members/api/members.api";
import { WorkspaceMember } from "@/features/members/types/member.type";

export default function ProjectAnalyticsPage() {
  const params = useParams<{ workspaceId: string; projectId: string }>();
  const { user, isLoading: authLoading } = useAuth(true);

  const [project, setProject] = useState<Project | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);

  const loadData = useCallback(async () => {
    if (!params.workspaceId || !params.projectId) return;

    setIsLoading(true);

    try {
      const [projectRes, sprintsRes, tasksRes, membersRes] = await Promise.allSettled([
        getProjectDetail(params.workspaceId, params.projectId),
        getSprints(params.workspaceId, params.projectId, { limit: 50 }),
        getTasks(params.workspaceId, params.projectId, { limit: 100 }),
        getWorkspaceMembers(params.workspaceId),
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
      if (membersRes.status === "fulfilled") setMembers(membersRes.value.data.items);
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
    return [...sprints].sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()).slice(-6).map((sprint) => {
      const sprintTasks = tasks.filter((t) => t.sprintId === sprint.id);
      const completed = sprintTasks.filter((t) => t.status === "DONE").length;
      return {
        sprintName: sprint.name,
        total: sprintTasks.length,
        completed,
        plannedPoints: sprintTasks.reduce((sum, task) => sum + (task.storyPoints ?? 0), 0),
        completedPoints: sprintTasks.filter((task) => task.status === "DONE").reduce((sum, task) => sum + (task.storyPoints ?? 0), 0),
      };
    });
  }, [sprints, tasks]);

  const avgVelocity = useMemo(() => {
    if (velocityData.length === 0) return 0;
    const sum = velocityData.reduce((acc, curr) => acc + curr.completedPoints, 0);
    return Math.round((sum / velocityData.length) * 10) / 10;
  }, [velocityData]);

  const sprintHealth = useMemo(() => {
    const sprintTasks = tasks.filter((task) => task.sprintId === currentSprint?.id);
    const now = Date.now();
    const overdue = sprintTasks.filter((task) => task.dueDate && new Date(task.dueDate).getTime() < now && task.status !== "DONE").length;
    const blocked = sprintTasks.filter((task) => task.isBlocked).length;
    const wip = sprintTasks.filter((task) => ["IN_PROGRESS", "REVIEW"].includes(task.status)).length;
    const remaining = sprintTasks.filter((task) => task.status !== "DONE").length;
    const start = currentSprint ? new Date(currentSprint.startDate).getTime() : now;
    const end = currentSprint ? new Date(currentSprint.endDate).getTime() : now + 1;
    const elapsed = Math.max(0, Math.min(1, (now - start) / Math.max(1, end - start)));
    const completion = sprintTasks.length ? (sprintTasks.length - remaining) / sprintTasks.length : 0;
    const scheduleGap = Math.max(0, elapsed - completion);
    const factors = [
      { label: "Chậm so với thời gian", points: Math.round(scheduleGap * 40), detail: `${Math.round(elapsed * 100)}% thời gian / ${Math.round(completion * 100)}% hoàn thành` },
      { label: "Task quá hạn", points: Math.min(25, overdue * 5), detail: `${overdue} Task` },
      { label: "Task bị chặn", points: Math.min(25, blocked * 7), detail: `${blocked} Task` },
      { label: "WIP cao", points: sprintTasks.length && wip / sprintTasks.length > 0.5 ? 10 : 0, detail: `${wip} Task đang xử lý` },
    ];
    const score = Math.min(100, factors.reduce((sum, factor) => sum + factor.points, 0));
    const level = score >= 55 ? "HIGH" : score >= 25 ? "MEDIUM" : "LOW";
    const cycleTimes = tasks.filter((task) => task.completedAt && task.startedAt).map((task) => (new Date(task.completedAt!).getTime() - new Date(task.startedAt!).getTime()) / 86400000).filter((days) => days >= 0);
    const avgLeadTime = cycleTimes.length ? cycleTimes.reduce((sum, days) => sum + days, 0) / cycleTimes.length : 0;
    const capacity = members.filter((member) => member.status === "ACTIVE").map((member) => {
      const assigned = sprintTasks.filter((task) => task.assigneeId === member.userId && task.status !== "DONE");
      return { id: member.userId, name: member.fullName || member.email || member.userId, wip: assigned.filter((task) => ["IN_PROGRESS", "REVIEW"].includes(task.status)).length, points: assigned.reduce((sum, task) => sum + (task.storyPoints ?? 0), 0) };
    }).sort((a, b) => b.points - a.points);
    return { score, level, factors, overdue, blocked, wip, avgLeadTime, capacity };
  }, [currentSprint, tasks, members]);

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
              <span>Velocity trung bình: {avgVelocity} SP/Sprint</span>
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
                          {item.completedPoints} SP
                        </strong>{" "}
                        / {item.plannedPoints} SP kế hoạch
                      </span>
                    </div>

                    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 flex">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${item.plannedPoints ? Math.round(item.completedPoints / item.plannedPoints * 100) : pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between"><h3 className="flex items-center gap-2 font-extrabold text-slate-900"><AlertTriangle className="h-5 w-5 text-amber-500" />Sprint Risk Score</h3><span className={`rounded-full px-3 py-1 text-xs font-black ${sprintHealth.level === "HIGH" ? "bg-rose-100 text-rose-700" : sprintHealth.level === "MEDIUM" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{sprintHealth.level} · {sprintHealth.score}/100</span></div>
            <div className="mt-4 space-y-3">{sprintHealth.factors.map((factor) => <div className="rounded-xl bg-slate-50 p-3" key={factor.label}><div className="flex justify-between text-xs font-bold text-slate-700"><span>{factor.label}</span><span>+{factor.points}</span></div><p className="mt-1 text-xs text-slate-500">{factor.detail}</p></div>)}</div>
            <p className="mt-4 text-xs text-slate-500">Điểm được tính từ dữ liệu nghiệp vụ, không phải con số AI tự suy đoán.</p>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
            <h3 className="flex items-center gap-2 font-extrabold text-slate-900"><Activity className="h-5 w-5 text-blue-600" />Flow metrics</h3>
            <div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-blue-50 p-4"><p className="text-xs font-bold text-blue-700">Lead/Cycle time hiện có</p><strong className="mt-1 block text-2xl text-blue-900">{sprintHealth.avgLeadTime.toFixed(1)} ngày</strong><span className="text-[10px] text-blue-600">Từ lúc tạo đến hoàn thành</span></div><div className="rounded-xl bg-violet-50 p-4"><p className="text-xs font-bold text-violet-700">Work in progress</p><strong className="mt-1 block text-2xl text-violet-900">{sprintHealth.wip}</strong><span className="text-[10px] text-violet-600">IN_PROGRESS + REVIEW</span></div><div className="rounded-xl bg-rose-50 p-4"><p className="text-xs font-bold text-rose-700">Quá hạn</p><strong className="mt-1 block text-2xl text-rose-900">{sprintHealth.overdue}</strong></div><div className="rounded-xl bg-amber-50 p-4"><p className="text-xs font-bold text-amber-700">Bị chặn</p><strong className="mt-1 block text-2xl text-amber-900">{sprintHealth.blocked}</strong></div></div>
          </section>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
          <h3 className="flex items-center gap-2 font-extrabold text-slate-900"><Users className="h-5 w-5 text-indigo-600" />Capacity & WIP theo thành viên</h3>
          <p className="mt-1 text-xs text-slate-500">Khối lượng còn lại theo Story Point; đây là load hiện tại, chưa phải giờ khả dụng đã khai báo.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{sprintHealth.capacity.map((member) => <div className="rounded-xl border border-slate-100 bg-slate-50 p-4" key={member.id}><div className="flex justify-between gap-2"><strong className="truncate text-sm text-slate-800">{member.name}</strong><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${member.wip > 2 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>{member.wip} WIP</span></div><p className="mt-2 text-xl font-black text-indigo-700">{member.points} SP</p></div>)}</div>
        </section>
      </div>
    </AppShell>
  );
}
