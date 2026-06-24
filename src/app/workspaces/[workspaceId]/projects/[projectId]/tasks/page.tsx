"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { getMyWorkspaceRole, getWorkspaceMembers } from "@/features/members/api/members.api";
import { WorkspaceMember } from "@/features/members/types/member.type";
import { getProjectDetail } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types/project.type";
import { getTasks, updateTaskStatus } from "@/features/tasks/api/tasks.api";
import { Task, TaskPriority, TaskStatus } from "@/features/tasks/types/task.type";
import { useAuth } from "@/hooks/useAuth";

const writeRoles = ["OWNER", "SCRUM_MASTER", "PROJECT_MANAGER"];

// Định nghĩa các cột trạng thái Kanban
const KANBAN_COLUMNS: { key: TaskStatus; label: string; bgHeader: string; borderCol: string }[] = [
  { key: "BACKLOG", label: "Backlog", bgHeader: "bg-zinc-100 text-zinc-700", borderCol: "border-zinc-200" },
  { key: "TODO", label: "Cần làm", bgHeader: "bg-sky-50 text-sky-700 border-sky-100", borderCol: "border-sky-200/50" },
  { key: "IN_PROGRESS", label: "Đang làm", bgHeader: "bg-blue-50 text-blue-700 border-blue-100", borderCol: "border-blue-200/50" },
  { key: "REVIEW", label: "Đánh giá", bgHeader: "bg-violet-50 text-violet-700 border-violet-100", borderCol: "border-violet-200/50" },
  { key: "DONE", label: "Hoàn thành", bgHeader: "bg-emerald-50 text-emerald-700 border-emerald-100", borderCol: "border-emerald-200/50" },
];

export default function KanbanBoardPage() {
  const params = useParams<{ workspaceId: string; projectId: string }>();
  const { user, isLoading: authLoading } = useAuth(true);

  // States
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [myRole, setMyRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Filters
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(null);

  // Drag states
  const [activeDragTaskId, setActiveDragTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const canWrite = writeRoles.includes(myRole) && project?.status === "ACTIVE";

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const [projectRes, tasksRes, roleRes, membersRes] = await Promise.all([
        getProjectDetail(params.workspaceId, params.projectId),
        getTasks(params.workspaceId, params.projectId, { page: 1, limit: 100 }),
        getMyWorkspaceRole(params.workspaceId),
        getWorkspaceMembers(params.workspaceId),
      ]);

      setProject(projectRes.data.project);
      setTasks(tasksRes.data.items);
      setMyRole(roleRes.data.role);
      setMembers(membersRes.data.items);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Tải danh sách task thất bại.");
    } finally {
      setIsLoading(false);
    }
  }, [params.projectId, params.workspaceId]);

  useEffect(() => {
    if (user && params.workspaceId && params.projectId) {
      void loadData();
    }
  }, [user, params.workspaceId, params.projectId, loadData]);

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    setActiveDragTaskId(taskId);
  };

  const handleDragEnd = () => {
    setActiveDragTaskId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, columnKey: TaskStatus) => {
    e.preventDefault();
    if (dragOverColumn !== columnKey) {
      setDragOverColumn(columnKey);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData("text/plain") || activeDragTaskId;

    if (!taskId) return;

    // Tìm task hiện tại
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Nếu không thay đổi trạng thái
    if (task.status === targetStatus) return;

    // Cập nhật local state trước để UI thay đổi mượt mà (Optimistic Update)
    const previousTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t))
    );

    try {
      await updateTaskStatus(params.workspaceId, params.projectId, taskId, {
        status: targetStatus,
      });
    } catch (error) {
      // Revert if error
      setTasks(previousTasks);
      alert(error instanceof Error ? error.message : "Không thể thay đổi trạng thái task");
    } finally {
      setActiveDragTaskId(null);
    }
  };

  // Thay đổi status nhanh bằng nút bấm (cho mobile)
  const handleMoveStatusQuick = async (taskId: string, targetStatus: TaskStatus) => {
    try {
      await updateTaskStatus(params.workspaceId, params.projectId, taskId, {
        status: targetStatus,
      });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t))
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : "Không thể thay đổi trạng thái task");
    }
  };

  // Lọc task
  const filteredTasks = tasks.filter((task) => {
    const matchesKeyword =
      task.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      task.taskCode.toLowerCase().includes(searchKeyword.toLowerCase());
    const matchesAssignee = selectedAssigneeId ? task.assigneeId === selectedAssigneeId : true;
    return matchesKeyword && matchesAssignee;
  });

  const getTasksByStatus = (status: TaskStatus) => {
    return filteredTasks.filter((t) => t.status === status);
  };

  const renderPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case "URGENT":
        return <span className="bg-red-50 text-red-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-red-100">URGENT</span>;
      case "HIGH":
        return <span className="bg-orange-50 text-orange-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-orange-100">HIGH</span>;
      case "MEDIUM":
        return <span className="bg-amber-50 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-100">MEDIUM</span>;
      case "LOW":
      default:
        return <span className="bg-zinc-50 text-zinc-600 text-[9px] font-bold px-1.5 py-0.5 rounded border border-zinc-200">LOW</span>;
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
      <div className="space-y-6 max-w-[90rem] mx-auto pb-12">
        {/* BANNER FILTER & ACTIONS */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative w-64">
              <input
                type="text"
                placeholder="Tìm theo tiêu đề hoặc mã task..."
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
              <Link
                href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/tasks/create`}
                className="flex h-9 items-center rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition"
              >
                Tạo Task
              </Link>
            )}
          </div>
        </div>

        {message && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
            {message}
          </div>
        )}

        {/* KANBAN BOARD CONTAINER */}
        {isLoading ? (
          <div className="flex h-96 items-center justify-center bg-white rounded-2xl border border-zinc-200/80 shadow-sm">
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
              <p className="text-xs text-zinc-400 font-medium">Đang tải bảng công việc...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start overflow-x-auto min-w-[64rem] pb-4">
            {KANBAN_COLUMNS.map((col) => {
              const colTasks = getTasksByStatus(col.key);
              const isOver = dragOverColumn === col.key;

              return (
                <div
                  key={col.key}
                  onDragOver={(e) => handleDragOver(e, col.key)}
                  onDrop={(e) => void handleDrop(e, col.key)}
                  className={`bg-zinc-50/50 rounded-2xl border transition-all duration-200 p-3 min-h-[35rem] flex flex-col ${col.borderCol} ${
                    isOver ? "bg-blue-50/80 border-blue-300 shadow-md ring-2 ring-blue-500/10 scale-[1.01]" : ""
                  }`}
                >
                  {/* Column Header */}
                  <div className={`p-2.5 rounded-xl border font-bold text-xs flex justify-between items-center mb-4 shadow-sm ${col.bgHeader}`}>
                    <span>{col.label}</span>
                    <span className="bg-white/70 px-2 py-0.5 rounded-full text-[10px] text-zinc-500 font-mono">
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Column Task Cards */}
                  <div className="flex-1 space-y-3 overflow-y-auto">
                    {colTasks.map((task) => (
                      <div
                        key={task.id}
                        draggable={canWrite}
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onDragEnd={handleDragEnd}
                        className={`bg-white p-4 rounded-xl border border-zinc-200/80 shadow-sm space-y-3 cursor-grab transition-all select-none hover:shadow-md hover:border-zinc-300 ${
                          activeDragTaskId === task.id ? "opacity-40" : ""
                        }`}
                      >
                        {/* Task Code */}
                        <div className="flex items-center justify-between">
                          <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 ${
                            task.status === "DONE" ? "line-through text-zinc-400" : ""
                          }`}>
                            {task.taskCode}
                          </span>
                          {renderPriorityBadge(task.priority)}
                        </div>

                        {/* Title */}
                        <Link
                          href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/tasks/${task.id}`}
                          className={`text-xs font-bold text-zinc-800 line-clamp-2 leading-snug hover:text-blue-600 transition ${
                            task.status === "DONE" ? "line-through text-zinc-400" : ""
                          }`}
                        >
                          {task.title}
                        </Link>

                        {/* Bottom Info: Assignee + Date */}
                        <div className="flex items-center justify-between border-t border-zinc-100 pt-3 text-[10px] font-medium text-zinc-500">
                          <span>
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString("vi-VN") : "-"}
                          </span>

                          <div className="flex items-center gap-2">
                            {/* Mobile action quick select status */}
                            {canWrite && (
                              <div className="relative group/menu">
                                <button className="p-0.5 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700">
                                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                                  </svg>
                                </button>
                                <div className="absolute right-0 bottom-full mb-1 w-36 bg-white border border-zinc-200 rounded-xl shadow-lg py-1 hidden group-hover/menu:block z-20">
                                  <p className="px-2 py-1 text-[8px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100">
                                    Chuyển trạng thái
                                  </p>
                                  {KANBAN_COLUMNS.filter((c) => c.key !== col.key).map((c) => (
                                    <button
                                      key={c.key}
                                      onClick={() => void handleMoveStatusQuick(task.id, c.key)}
                                      className="w-full text-left px-2 py-1.5 hover:bg-zinc-50 text-[10px] font-semibold text-zinc-700 transition"
                                    >
                                      {c.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Avatar */}
                            <div
                              className="h-5.5 w-5.5 rounded-full bg-emerald-500 border border-white text-slate-950 font-bold flex items-center justify-center shadow-sm text-[9px]"
                              title={task.assignee?.fullName ?? "Chưa gán"}
                            >
                              {task.assignee?.fullName ? task.assignee.fullName.charAt(0).toUpperCase() : "-"}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {colTasks.length === 0 && (
                      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-200 rounded-2xl min-h-[10rem] text-center text-zinc-400 text-[10px] font-medium">
                        Không có task
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
