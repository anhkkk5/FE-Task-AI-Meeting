"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, BarChart3, CheckCircle2, CircleGauge, Clock3,
  FileSpreadsheet, ListTodo, Printer, Rocket, Sparkles, TrendingDown,
  Users, Zap,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { SprintBurndownChart } from "@/features/analytics/components/SprintBurndownChart";
import { getWorkspaceMembers } from "@/features/members/api/members.api";
import { WorkspaceMember } from "@/features/members/types/member.type";
import { getProjectDetail } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types/project.type";
import { getSprints } from "@/features/sprints/api/sprints.api";
import { Sprint } from "@/features/sprints/types/sprint.type";
import { exportSprintReportToPDF, exportTasksToExcel } from "@/features/sprints/utils/export-sprint-report";
import { getTasks } from "@/features/tasks/api/tasks.api";
import { Task, TaskStatus } from "@/features/tasks/types/task.type";
import { useAuth } from "@/hooks/useAuth";

const statusMeta: Array<{ key: TaskStatus; label: string; color: string }> = [
  { key: "BACKLOG", label: "Backlog", color: "#94a3b8" },
  { key: "TODO", label: "Cần làm", color: "#3b82f6" },
  { key: "IN_PROGRESS", label: "Đang xử lý", color: "#f59e0b" },
  { key: "REVIEW", label: "Đang duyệt", color: "#8b5cf6" },
  { key: "DONE", label: "Hoàn thành", color: "#22c55e" },
];

function KpiCard({ icon, label, value, hint, tone }: { icon: React.ReactNode; label: string; value: string; hint: string; tone: string }) {
  return <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,.04)]">
    <div className="flex items-center gap-3"><div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${tone}`}>{icon}</div><div className="min-w-0"><p className="truncate text-xs font-bold text-slate-600">{label}</p><p className="mt-0.5 text-2xl font-black tracking-tight text-slate-900">{value}</p></div></div>
    <p className="mt-2 truncate text-[11px] font-medium text-slate-500">{hint}</p>
  </div>;
}

export default function ProjectAnalyticsPage() {
  const params = useParams<{ workspaceId: string; projectId: string }>();
  const { user, isLoading: authLoading } = useAuth(true);
  const [project, setProject] = useState<Project | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState("");

  const loadData = useCallback(async () => {
    if (!params.workspaceId || !params.projectId) return;
    const [projectRes, sprintsRes, tasksRes, membersRes] = await Promise.allSettled([
      getProjectDetail(params.workspaceId, params.projectId),
      getSprints(params.workspaceId, params.projectId, { limit: 50 }),
      getTasks(params.workspaceId, params.projectId, { limit: 100 }),
      getWorkspaceMembers(params.workspaceId),
    ]);
    if (projectRes.status === "fulfilled") setProject(projectRes.value.data.project);
    if (tasksRes.status === "fulfilled") setTasks(tasksRes.value.data.items);
    if (membersRes.status === "fulfilled") setMembers(membersRes.value.data.items);
    if (sprintsRes.status === "fulfilled") {
      const items = sprintsRes.value.data.items;
      setSprints(items);
      setSelectedSprintId((current) => current || items.find((s) => s.status === "ACTIVE")?.id || items[0]?.id || "");
    }
  }, [params.workspaceId, params.projectId]);

  useEffect(() => { if (user) void loadData(); }, [user, loadData]);

  const currentSprint = useMemo(() => sprints.find((s) => s.id === selectedSprintId) || sprints[0] || null, [sprints, selectedSprintId]);
  const sprintTasks = useMemo(() => tasks.filter((t) => t.sprintId === currentSprint?.id), [tasks, currentSprint]);
  const stats = useMemo(() => {
    const now = Date.now();
    const total = sprintTasks.length;
    const done = sprintTasks.filter((t) => t.status === "DONE").length;
    const overdue = sprintTasks.filter((t) => t.status !== "DONE" && t.dueDate && new Date(t.dueDate).getTime() < now).length;
    const start = currentSprint ? new Date(currentSprint.startDate).getTime() : now;
    const end = currentSprint ? new Date(currentSprint.endDate).getTime() : now + 1;
    const elapsed = Math.round(Math.max(0, Math.min(1, (now - start) / Math.max(1, end - start))) * 100);
    const completion = total ? Math.round(done / total * 100) : 0;
    return { total, done, overdue, remaining: total - done, completion, elapsed, gap: Math.max(0, elapsed - completion) };
  }, [sprintTasks, currentSprint]);

  const velocity = useMemo(() => [...sprints]
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()).slice(-4)
    .map((s) => ({ name: s.name, points: tasks.filter((t) => t.sprintId === s.id && t.status === "DONE").reduce((n, t) => n + (t.storyPoints || 0), 0), dates: `${new Date(s.startDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })} - ${new Date(s.endDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}` })), [sprints, tasks]);
  const avgVelocity = velocity.length ? Math.round(velocity.reduce((n, v) => n + v.points, 0) / velocity.length) : 0;
  const maxVelocity = Math.max(1, ...velocity.map((v) => v.points));

  const distribution = useMemo(() => statusMeta.map((s) => ({ ...s, count: sprintTasks.filter((t) => t.status === s.key).length })), [sprintTasks]);
  const donut = useMemo(() => {
    let cursor = 0;
    const segments = distribution.filter((x) => x.count).map((x) => { const start = cursor; cursor += stats.total ? x.count / stats.total * 100 : 0; return `${x.color} ${start}% ${cursor}%`; });
    return segments.length ? `conic-gradient(${segments.join(",")})` : "#e2e8f0";
  }, [distribution, stats.total]);

  const performance = useMemo(() => members.filter((m) => m.status === "ACTIVE").map((member) => {
    const assigned = sprintTasks.filter((t) => t.assigneeId === member.userId);
    const done = assigned.filter((t) => t.status === "DONE");
    const assignedPoints = assigned.reduce((n, t) => n + (t.storyPoints || 0), 0);
    const donePoints = done.reduce((n, t) => n + (t.storyPoints || 0), 0);
    return { ...member, assigned: assignedPoints, done: donePoints, rate: assignedPoints ? Math.round(donePoints / assignedPoints * 100) : 0, wip: assigned.filter((t) => ["IN_PROGRESS", "REVIEW"].includes(t.status)).length };
  }).sort((a, b) => b.assigned - a.assigned), [members, sprintTasks]);

  if (authLoading) return <div className="grid min-h-screen place-items-center bg-slate-50"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;

  return <AppShell workspaceId={params.workspaceId} projectId={params.projectId} title={project?.name}>
    <div className="mx-auto max-w-[1480px] space-y-3 pb-8">
      <header className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-[0_8px_30px_rgba(15,23,42,.04)] md:flex-row md:items-center">
        <div><span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-extrabold text-blue-700"><BarChart3 className="h-3.5 w-3.5" /> Agile Analytics & Sprint Insights</span><h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Thống kê & Tiến độ dự án</h1><p className="mt-0.5 text-xs font-medium text-slate-500">Theo dõi sức khỏe Sprint, khối lượng công việc và tiến độ giao hàng của dự án <b className="text-slate-700">{project?.name || "hiện tại"}</b>.</p></div>
        <div className="flex flex-wrap items-center gap-2"><select aria-label="Chọn sprint" className="h-10 max-w-48 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500" value={selectedSprintId} onChange={(e) => setSelectedSprintId(e.target.value)}>{sprints.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select><button onClick={() => exportTasksToExcel(tasks, `${project?.keyCode || "PRJ"}_Analytics.csv`)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50"><FileSpreadsheet className="h-4 w-4 text-emerald-600" />Xuất Excel</button><button onClick={() => exportSprintReportToPDF(currentSprint, tasks, project?.name, "Workspace")} className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"><Printer className="h-4 w-4" />Báo cáo PDF</button></div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard icon={<Rocket className="h-5 w-5 text-blue-600" />} label="Tiến độ Sprint" value={`${stats.elapsed}%`} hint={stats.gap ? `Chậm ${stats.gap}% so với kế hoạch` : "Đang đúng tiến độ kế hoạch"} tone="bg-blue-50" />
        <KpiCard icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />} label="Hoàn thành" value={`${stats.completion}%`} hint={`${stats.done} / ${stats.total} task`} tone="bg-emerald-50" />
        <KpiCard icon={<ListTodo className="h-5 w-5 text-orange-600" />} label="Còn lại" value={`${stats.remaining}`} hint="Task chưa hoàn thành" tone="bg-orange-50" />
        <KpiCard icon={<TrendingDown className="h-5 w-5 text-violet-600" />} label="Velocity TB" value={`${avgVelocity} SP`} hint="Trung bình mỗi Sprint" tone="bg-violet-50" />
        <KpiCard icon={<AlertTriangle className="h-5 w-5 text-rose-600" />} label="Quá hạn" value={`${stats.overdue}`} hint="Task cần được ưu tiên" tone="bg-rose-50" />
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.8fr_1fr]">
        <div className="min-w-0 [&>div]:h-full [&>div]:rounded-2xl [&>div]:p-5 [&>div]:shadow-[0_8px_24px_rgba(15,23,42,.04)]"><SprintBurndownChart sprint={currentSprint} tasks={sprintTasks} projectName={project?.name} /></div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,.04)]"><h2 className="flex items-center gap-2 text-sm font-black text-slate-900"><Sparkles className="h-4 w-4 text-blue-600" />Hiểu nhanh</h2><div className="mt-4 space-y-4">
          {[{ icon: <Clock3 />, color: "text-orange-600 bg-orange-50", title: stats.gap ? `Sprint đang chậm ${stats.gap}% so với kế hoạch.` : "Sprint đang bám sát kế hoạch.", sub: `${stats.elapsed}% thời gian, ${stats.completion}% công việc hoàn thành.` }, { icon: <CheckCircle2 />, color: "text-emerald-600 bg-emerald-50", title: `Tỷ lệ hoàn thành ${stats.completion}%.`, sub: `Đã hoàn thành ${stats.done}/${stats.total} task của Sprint.` }, { icon: <Users />, color: "text-violet-600 bg-violet-50", title: `${performance.filter((x) => x.assigned > 0).length} thành viên đang tham gia.`, sub: "Dựa trên task được giao trong Sprint hiện tại." }, { icon: <AlertTriangle />, color: "text-rose-600 bg-rose-50", title: `${stats.overdue} task đang bị quá hạn.`, sub: stats.overdue ? "Ưu tiên xử lý để tránh rủi ro cao trước hạn chót." : "Chưa ghi nhận task quá hạn." }].map((x, i) => <div key={i} className="flex gap-3"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full [&>svg]:h-4 [&>svg]:w-4 ${x.color}`}>{x.icon}</span><div><p className="text-xs font-extrabold text-slate-800">{x.title}</p><p className="mt-0.5 text-[11px] leading-4 text-slate-500">{x.sub}</p></div></div>)}
        </div></div>
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.65fr_1fr]">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,.04)]"><h2 className="text-sm font-black text-slate-900">Velocity {velocity.length} Sprint gần nhất</h2><div className="mt-5 flex h-44 items-end justify-around gap-4 border-b border-slate-200 px-3">{velocity.length ? velocity.map((v) => <div key={v.name} className="flex h-full min-w-0 flex-1 flex-col justify-end text-center"><b className="mb-2 text-xs text-slate-700">{v.points} SP</b><div className="mx-auto w-3/5 max-w-16 rounded-t-md bg-gradient-to-t from-blue-600 to-blue-400" style={{ height: `${Math.max(5, v.points / maxVelocity * 115)}px` }} /><p className="mt-2 truncate text-[11px] font-bold text-slate-700">{v.name}</p><p className="truncate text-[9px] text-slate-400">{v.dates}</p></div>) : <div className="m-auto text-xs text-slate-400">Chưa có dữ liệu velocity</div>}</div></div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,.04)]"><h2 className="text-sm font-black text-slate-900">Phân bố công việc</h2><div className="mt-4 flex items-center justify-center gap-6"><div className="relative h-36 w-36 shrink-0 rounded-full" style={{ background: donut }}><div className="absolute inset-6 grid place-items-center rounded-full bg-white text-center"><div><b className="text-xl text-slate-900">{stats.total}</b><p className="text-[10px] text-slate-500">Tổng task</p></div></div></div><div className="space-y-2">{distribution.filter((x) => x.count).map((x) => <div key={x.key} className="flex min-w-36 items-center justify-between gap-4 text-[11px]"><span className="flex items-center gap-2 text-slate-600"><i className="h-2.5 w-2.5 rounded-full" style={{ background: x.color }} />{x.label}</span><b>{x.count} ({stats.total ? Math.round(x.count / stats.total * 100) : 0}%)</b></div>)}</div></div></div>
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.65fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,.04)]"><h2 className="px-5 pt-5 text-sm font-black text-slate-900">Hiệu suất thành viên</h2><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[650px] text-left text-[11px]"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-5 py-2.5">Thành viên</th><th>Đã giao</th><th>Hoàn thành</th><th className="w-40">Hoàn thành (%)</th><th>WIP hiện tại</th></tr></thead><tbody>{performance.map((m) => <tr key={m.userId} className="border-t border-slate-100"><td className="px-5 py-2.5 font-bold text-slate-700"><span className="mr-2 inline-grid h-6 w-6 place-items-center rounded-full bg-blue-600 text-[10px] text-white">{(m.fullName || m.email || "U")[0].toUpperCase()}</span>{m.fullName || m.email}</td><td>{m.assigned} SP</td><td>{m.done} SP</td><td><div className="flex items-center gap-2"><b className="w-8">{m.rate}%</b><div className="h-1.5 flex-1 rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${m.rate}%` }} /></div></div></td><td>{m.wip}</td></tr>)}</tbody></table></div></div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,.04)]"><h2 className="flex items-center gap-2 text-sm font-black text-slate-900"><AlertTriangle className="h-4 w-4 text-rose-500" />Rủi ro Sprint</h2><div className="mt-3 divide-y divide-slate-100">{[{ title: `${stats.overdue} task quá hạn`, sub: "Ảnh hưởng đến mục tiêu Sprint", level: stats.overdue ? "Cao" : "Thấp", color: stats.overdue ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600" }, { title: stats.gap ? `Tiến độ chậm ${stats.gap}%` : "Tiến độ đúng kế hoạch", sub: "So sánh thời gian và tỷ lệ hoàn thành", level: stats.gap > 15 ? "Trung bình" : "Thấp", color: stats.gap > 15 ? "bg-orange-50 text-orange-600" : "bg-emerald-50 text-emerald-600" }, { title: `${sprintTasks.filter((t) => !t.assigneeId).length} task chưa có người thực hiện`, sub: "Có thể bị chậm nếu không phân bổ kịp thời", level: "Thấp", color: "bg-amber-50 text-amber-600" }].map((r) => <div key={r.title} className="flex items-center justify-between gap-3 py-3"><div><p className="text-xs font-bold text-slate-700">{r.title}</p><p className="mt-0.5 text-[10px] text-slate-500">{r.sub}</p></div><span className={`rounded-full px-3 py-1 text-[10px] font-bold ${r.color}`}>{r.level}</span></div>)}</div></div>
      </section>
    </div>
  </AppShell>;
}
