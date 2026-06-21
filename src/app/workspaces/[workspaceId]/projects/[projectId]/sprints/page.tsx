"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { getMyWorkspaceRole, getWorkspaceMembers } from "@/features/members/api/members.api";
import { WorkspaceMember } from "@/features/members/types/member.type";
import { getProjectDetail } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types/project.type";
import { getSprints, startSprint, completeSprint } from "@/features/sprints/api/sprints.api";
import { Sprint } from "@/features/sprints/types/sprint.type";
import { getTasks, updateTaskStatus, moveTaskToSprint } from "@/features/tasks/api/tasks.api";
import { Task, TaskPriority, TaskStatus } from "@/features/tasks/types/task.type";
import { useAuth } from "@/hooks/useAuth";

const writeRoles = ["OWNER", "SCRUM_MASTER", "PROJECT_MANAGER"];

export default function BacklogPage() {
  const params = useParams<{ workspaceId: string; projectId: string }>();
  const { user, isLoading: authLoading } = useAuth(true);

  // States
  const [project, setProject] = useState<Project | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [myRole, setMyRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Filters
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(null);

  // Accordion collapsed state (sprintId -> boolean)
  const [collapsedSprints, setCollapsedSprints] = useState<Record<string, boolean>>({});

  const canWrite = writeRoles.includes(myRole) && project?.status === "ACTIVE";

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const [projectRes, sprintsRes, tasksRes, roleRes, membersRes] = await Promise.all([
        getProjectDetail(params.workspaceId, params.projectId),
        getSprints(params.workspaceId, params.projectId, { page: 1, limit: 100 }),
        getTasks(params.workspaceId, params.projectId, { page: 1, limit: 1000 }), // Lấy tối đa task
        getMyWorkspaceRole(params.workspaceId),
        getWorkspaceMembers(params.workspaceId),
      ]);

      setProject(projectRes.data.project);
      setSprints(sprintsRes.data.items);
      setTasks(tasksRes.data.items);
      setMyRole(roleRes.data.role);
      setMembers(membersRes.data.items);

      // Mặc định mở tất cả các sprint
      const initialCollapsed: Record<string, boolean> = {};
      sprintsRes.data.items.forEach((s) => {
        initialCollapsed[s.id] = false;
      });
      initialCollapsed["backlog"] = false; // Mở cả backlog
      setCollapsedSprints((prev) => ({ ...initialCollapsed, ...prev }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Tải dữ liệu thất bại.");
    } finally {
      setIsLoading(false);
    }
  }, [params.projectId, params.workspaceId]);

  useEffect(() => {
    if (user && params.workspaceId && params.projectId) {
      void loadData();
    }
  }, [user, params.workspaceId, params.projectId, loadData]);

  // Hành động thay đổi status task nhanh (Checkbox)
  const handleToggleTaskStatus = async (task: Task) => {
    const newStatus: TaskStatus = task.status === "DONE" ? "TODO" : "DONE";
    try {
      await updateTaskStatus(params.workspaceId, params.projectId, task.id, {
        status: newStatus,
      });
      // Update local state
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : "Không thể cập nhật trạng thái task");
    }
  };

  // Di chuyển task sang Sprint khác
  const handleMoveTask = async (taskId: string, targetSprintId: string | null) => {
    try {
      await moveTaskToSprint(params.workspaceId, params.projectId, taskId, {
        sprintId: targetSprintId,
      });
      // Update local state
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                sprintId: targetSprintId,
                sprint: targetSprintId
                  ? {
                      id: targetSprintId,
                      name: sprints.find((s) => s.id === targetSprintId)?.name || "Sprint",
                      status: sprints.find((s) => s.id === targetSprintId)?.status || "PLANNED",
                    }
                  : null,
              }
            : t
        )
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : "Không thể di chuyển task");
    }
  };

  // Bắt đầu Sprint
  const handleStartSprint = async (sprintId: string) => {
    if (!confirm("Bạn có chắc chắn muốn Bắt đầu Sprint này không?")) return;
    try {
      await startSprint(params.workspaceId, params.projectId, sprintId);
      // Reload data
      await loadData();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Bắt đầu sprint thất bại");
    }
  };

  // Hoàn thành Sprint
  const handleCompleteSprint = async (sprintId: string) => {
    if (!confirm("Bạn có chắc chắn muốn Hoàn thành Sprint này không? Các task chưa hoàn thành sẽ được trả về Backlog.")) return;
    try {
      await completeSprint(params.workspaceId, params.projectId, sprintId);
      // Reload data
      await loadData();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Hoàn thành sprint thất bại");
    }
  };

  // Toggle Collapse/Expand
  const toggleCollapse = (id: string) => {
    setCollapsedSprints((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filters logic
  const filteredTasks = tasks.filter((task) => {
    const matchesKeyword =
      task.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      task.taskCode.toLowerCase().includes(searchKeyword.toLowerCase());
    const matchesAssignee = selectedAssigneeId ? task.assigneeId === selectedAssigneeId : true;
    return matchesKeyword && matchesAssignee;
  });

  const getTasksBySprint = (sprintId: string | null) => {
    return filteredTasks.filter((t) => t.sprintId === sprintId);
  };

  // Thống kê task cho Sprint
  const getSprintTaskCounts = (sprintId: string | null) => {
    const sprintTasks = tasks.filter((t) => t.sprintId === sprintId);
    const todo = sprintTasks.filter((t) => t.status === "TODO" || t.status === "BACKLOG").length;
    const inProgress = sprintTasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "REVIEW").length;
    const done = sprintTasks.filter((t) => t.status === "DONE").length;
    return { todo, inProgress, done };
  };

  // Helper render priority icon
  const renderPriorityIcon = (priority: TaskPriority) => {
    switch (priority) {
      case "URGENT":
      case "HIGH":
        return <span className="text-red-500 font-bold" title="Cao">⇡</span>;
      case "MEDIUM":
        return <span className="text-amber-500 font-bold" title="Trung bình">=</span>;
      case "LOW":
      default:
        return <span className="text-sky-500 font-bold" title="Thấp">⇣</span>;
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <AppShell projectId={params.projectId} title={project?.name} workspaceId={params.workspaceId}>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* BANNER FILTER & ACTIONS */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative w-64">
              <input
                type="text"
                placeholder="Tìm kiếm backlog..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full h-9 pl-9 pr-4 rounded-xl border border-zinc-300 bg-zinc-50/50 text-xs outline-none focus:bg-white focus:border-blue-500 transition-all font-medium"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Avatars filter */}
            <div className="flex items-center gap-1.5 border-l border-zinc-200 pl-3">
              <span className="text-[10px] font-bold text-zinc-400 uppercase mr-1">Người được gán:</span>
              <button
                onClick={() => setSelectedAssigneeId(null)}
                className={`h-7 px-2.5 rounded-lg text-[10px] font-bold transition-all ${
                  selectedAssigneeId === null
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600"
                }`}
              >
                Tất cả
              </button>
              <div className="flex -space-x-1">
                {members.slice(0, 5).map((m) => {
                  const initial = m.fullName ? m.fullName.charAt(0).toUpperCase() : "?";
                  const isSelected = selectedAssigneeId === m.userId;
                  return (
                    <button
                      key={m.userId}
                      onClick={() => setSelectedAssigneeId(isSelected ? null : m.userId)}
                      title={m.fullName || m.email || undefined}
                      className={`h-7 w-7 rounded-full text-[10px] font-bold border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? "border-blue-600 bg-blue-100 text-blue-800 scale-110 z-10"
                          : "border-white bg-emerald-500 text-slate-950 hover:scale-105"
                      }`}
                    >
                      {initial}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => void loadData()}
              disabled={isLoading}
              className="h-9 rounded-xl border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition"
            >
              Làm mới
            </button>
            {canWrite && (
              <>
                <Link
                  href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/sprints/create`}
                  className="flex h-9 items-center rounded-xl border border-zinc-200 bg-white px-3.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition"
                >
                  Tạo Sprint
                </Link>
                <Link
                  href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/tasks/create`}
                  className="flex h-9 items-center rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition"
                >
                  Tạo Task
                </Link>
              </>
            )}
          </div>
        </div>

        {message && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
            {message}
          </div>
        )}

        {/* LOADING STATE */}
        {isLoading ? (
          <div className="flex h-48 items-center justify-center bg-white rounded-2xl border border-zinc-200/80 shadow-sm">
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
              <p className="text-xs text-zinc-400 font-medium">Đang tải backlog...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* LIST OF SPRINTS */}
            {sprints.map((sprint) => {
              const sprintTasks = getTasksBySprint(sprint.id);
              const isCollapsed = collapsedSprints[sprint.id];
              const { todo, inProgress, done } = getSprintTaskCounts(sprint.id);

              return (
                <div key={sprint.id} className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm overflow-hidden transition-all duration-200">
                  {/* Sprint Header Row */}
                  <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-50/50 p-4 border-b border-zinc-100">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleCollapse(sprint.id)}
                        className="text-zinc-400 hover:text-zinc-900 transition"
                      >
                        <svg
                          className={`h-4 w-4 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 className="font-bold text-sm text-zinc-900">{sprint.name}</h3>
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                            sprint.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-800"
                              : sprint.status === "COMPLETED"
                              ? "bg-zinc-100 text-zinc-600"
                              : "bg-blue-50 text-blue-700"
                          }`}>
                            {sprint.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                          {sprint.startDate ? new Date(sprint.startDate).toLocaleDateString("vi-VN") : "-"} -{" "}
                          {sprint.endDate ? new Date(sprint.endDate).toLocaleDateString("vi-VN") : "-"}
                          {sprint.goal ? ` · Goal: ${sprint.goal}` : ""}
                        </p>
                      </div>
                    </div>

                    {/* Stats & Actions */}
                    <div className="flex items-center gap-4">
                      {/* Work Items counts */}
                      <div className="flex items-center gap-1 text-[10px] font-bold">
                        <span className="h-5 min-w-5 px-1 bg-zinc-200 text-zinc-700 rounded flex items-center justify-center" title="To Do">
                          {todo}
                        </span>
                        <span className="h-5 min-w-5 px-1 bg-blue-100 text-blue-700 rounded flex items-center justify-center" title="In Progress">
                          {inProgress}
                        </span>
                        <span className="h-5 min-w-5 px-1 bg-emerald-100 text-emerald-700 rounded flex items-center justify-center" title="Done">
                          {done}
                        </span>
                      </div>

                      {/* Control buttons */}
                      {canWrite && (
                        <div className="flex gap-2">
                          {sprint.status === "PLANNED" && (
                            <button
                              onClick={() => void handleStartSprint(sprint.id)}
                              className="h-7 bg-blue-600 hover:bg-blue-700 text-[10px] font-bold text-white px-2.5 rounded-lg transition"
                            >
                              Bắt đầu
                            </button>
                          )}
                          {sprint.status === "ACTIVE" && (
                            <button
                              onClick={() => void handleCompleteSprint(sprint.id)}
                              className="h-7 bg-emerald-600 hover:bg-emerald-700 text-[10px] font-bold text-white px-2.5 rounded-lg transition"
                            >
                              Hoàn thành
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Task list rows */}
                  {!isCollapsed && (
                    <div className="divide-y divide-zinc-100">
                      {sprintTasks.map((task) => (
                        <div
                          key={task.id}
                          className={`flex items-center justify-between gap-4 p-3 hover:bg-zinc-50/50 transition-all ${
                            task.status === "DONE" ? "bg-zinc-50/20" : ""
                          }`}
                        >
                          {/* Left: Checkbox + Code + Title */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={task.status === "DONE"}
                              onChange={() => void handleToggleTaskStatus(task)}
                              className="h-4 w-4 rounded-md border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className={`font-mono text-xs font-bold shrink-0 ${
                              task.status === "DONE" ? "line-through text-zinc-400" : "text-zinc-600"
                            }`}>
                              {task.taskCode}
                            </span>
                            <Link
                              href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/tasks/${task.id}`}
                              className={`text-xs font-semibold truncate hover:text-blue-600 hover:underline transition ${
                                task.status === "DONE" ? "line-through text-zinc-400" : "text-zinc-800"
                              }`}
                            >
                              {task.title}
                            </Link>
                          </div>

                          {/* Right: Status badge, priority, assignee, target sprint changer */}
                          <div className="flex items-center gap-4 shrink-0">
                            {/* Target Sprint Selector */}
                            {canWrite && (
                              <select
                                value={sprint.id}
                                onChange={(e) => void handleMoveTask(task.id, e.target.value || null)}
                                className="h-6 text-[10px] font-bold bg-transparent border-none text-zinc-400 hover:text-zinc-700 outline-none cursor-pointer"
                              >
                                <option value={sprint.id}>Sprint hiện tại</option>
                                {sprints
                                  .filter((s) => s.id !== sprint.id)
                                  .map((s) => (
                                    <option key={s.id} value={s.id}>
                                      Di chuyển: {s.name}
                                    </option>
                                  ))}
                                <option value="">Trả về Backlog</option>
                              </select>
                            )}

                            {/* Priority */}
                            <div className="w-5 flex items-center justify-center">
                              {renderPriorityIcon(task.priority)}
                            </div>

                            {/* Status Badge */}
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                              task.status === "DONE"
                                ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                                : task.status === "IN_PROGRESS"
                                ? "bg-blue-50 border-blue-100 text-blue-700"
                                : "bg-zinc-100 border-zinc-200 text-zinc-600"
                            }`}>
                              {task.status}
                            </span>

                            {/* Assignee Avatar */}
                            <div
                              className="h-6 w-6 rounded-full bg-emerald-500 border border-white text-slate-950 font-bold text-[9px] flex items-center justify-center shadow-sm"
                              title={task.assignee?.fullName ?? "Chưa gán"}
                            >
                              {task.assignee?.fullName ? task.assignee.fullName.charAt(0).toUpperCase() : "-"}
                            </div>
                          </div>
                        </div>
                      ))}

                      {sprintTasks.length === 0 && (
                        <div className="p-6 text-center text-xs text-zinc-400 font-medium">
                          Kéo hoặc di chuyển task vào đây để lập kế hoạch Sprint.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* BACKLOG SECTION */}
            {(() => {
              const backlogTasks = getTasksBySprint(null);
              const isCollapsed = collapsedSprints["backlog"];
              const { todo, inProgress, done } = getSprintTaskCounts(null);

              return (
                <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm overflow-hidden transition-all duration-200">
                  <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-100/50 p-4 border-b border-zinc-200">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleCollapse("backlog")}
                        className="text-zinc-500 hover:text-zinc-900 transition"
                      >
                        <svg
                          className={`h-4 w-4 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <div>
                        <h3 className="font-bold text-sm text-zinc-800 flex items-center gap-2">
                          Backlog
                        </h3>
                        <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                          Danh sách task chờ gán vào Sprint ({backlogTasks.length} task)
                        </p>
                      </div>
                    </div>

                    {/* Stats counts */}
                    <div className="flex items-center gap-1 text-[10px] font-bold">
                      <span className="h-5 min-w-5 px-1 bg-zinc-200 text-zinc-700 rounded flex items-center justify-center" title="To Do">
                        {todo}
                      </span>
                      <span className="h-5 min-w-5 px-1 bg-blue-100 text-blue-700 rounded flex items-center justify-center" title="In Progress">
                        {inProgress}
                      </span>
                      <span className="h-5 min-w-5 px-1 bg-emerald-100 text-emerald-700 rounded flex items-center justify-center" title="Done">
                        {done}
                      </span>
                    </div>
                  </div>

                  {!isCollapsed && (
                    <div className="divide-y divide-zinc-100">
                      {backlogTasks.map((task) => (
                        <div
                          key={task.id}
                          className={`flex items-center justify-between gap-4 p-3 hover:bg-zinc-50/50 transition-all ${
                            task.status === "DONE" ? "bg-zinc-50/20" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={task.status === "DONE"}
                              onChange={() => void handleToggleTaskStatus(task)}
                              className="h-4 w-4 rounded-md border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className={`font-mono text-xs font-bold shrink-0 ${
                              task.status === "DONE" ? "line-through text-zinc-400" : "text-zinc-600"
                            }`}>
                              {task.taskCode}
                            </span>
                            <Link
                              href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/tasks/${task.id}`}
                              className={`text-xs font-semibold truncate hover:text-blue-600 hover:underline transition ${
                                task.status === "DONE" ? "line-through text-zinc-400" : "text-zinc-800"
                              }`}
                            >
                              {task.title}
                            </Link>
                          </div>

                          <div className="flex items-center gap-4 shrink-0">
                            {/* Sprint Selector */}
                            {canWrite && sprints.length > 0 && (
                              <select
                                value=""
                                onChange={(e) => void handleMoveTask(task.id, e.target.value || null)}
                                className="h-6 text-[10px] font-bold bg-transparent border-none text-zinc-400 hover:text-zinc-700 outline-none cursor-pointer"
                              >
                                <option value="">Chờ gán (Backlog)</option>
                                {sprints.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    Gán vào: {s.name}
                                  </option>
                                ))}
                              </select>
                            )}

                            {/* Priority */}
                            <div className="w-5 flex items-center justify-center">
                              {renderPriorityIcon(task.priority)}
                            </div>

                            {/* Status */}
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                              task.status === "DONE"
                                ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                                : task.status === "IN_PROGRESS"
                                ? "bg-blue-50 border-blue-100 text-blue-700"
                                : "bg-zinc-100 border-zinc-200 text-zinc-600"
                            }`}>
                              {task.status}
                            </span>

                            {/* Assignee Avatar */}
                            <div
                              className="h-6 w-6 rounded-full bg-emerald-500 border border-white text-slate-950 font-bold text-[9px] flex items-center justify-center shadow-sm"
                              title={task.assignee?.fullName ?? "Chưa gán"}
                            >
                              {task.assignee?.fullName ? task.assignee.fullName.charAt(0).toUpperCase() : "-"}
                            </div>
                          </div>
                        </div>
                      ))}

                      {backlogTasks.length === 0 && (
                        <div className="p-6 text-center text-xs text-zinc-400 font-medium">
                          Tuyệt vời! Không có task nào trong Backlog.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </AppShell>
  );
}
