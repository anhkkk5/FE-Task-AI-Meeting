"use client";

import { showAppNotice } from "@/components/feedback/AppDialogProvider";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { getMyWorkspaceRole, getWorkspaceMembers } from "@/features/members/api/members.api";
import { WorkspaceMember } from "@/features/members/types/member.type";
import { getProjectDetail } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types/project.type";
import { getTasks, updateTaskStatus } from "@/features/tasks/api/tasks.api";
import { Task, TaskStatus } from "@/features/tasks/types/task.type";
import { useAuth } from "@/hooks/useAuth";

const writeRoles = ["OWNER", "SCRUM_MASTER", "PROJECT_MANAGER"];

const columns: { key: TaskStatus; label: string }[] = [
  { key: "BACKLOG", label: "Backlog" },
  { key: "TODO", label: "Cần làm" },
  { key: "IN_PROGRESS", label: "Đang làm" },
  { key: "REVIEW", label: "Review" },
  { key: "DONE", label: "Hoàn thành" },
];

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function KanbanBoardPage() {
  const params = useParams<{ workspaceId: string; projectId: string }>();
  const { user, isLoading: authLoading } = useAuth(true);

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [myRole, setMyRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(null);
  const [dependencyFilter, setDependencyFilter] = useState<"ALL" | "BLOCKED" | "BLOCKING">("ALL");
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

  const handleDragStart = (event: React.DragEvent, taskId: string) => {
    event.dataTransfer.setData("text/plain", taskId);
    setActiveDragTaskId(taskId);
  };

  const handleDragEnd = () => {
    setActiveDragTaskId(null);
    setDragOverColumn(null);
  };

  const handleDrop = async (event: React.DragEvent, targetStatus: TaskStatus) => {
    event.preventDefault();
    setDragOverColumn(null);

    const taskId = event.dataTransfer.getData("text/plain") || activeDragTaskId;
    if (!taskId) return;

    const task = tasks.find((item) => item.id === taskId);

    if (!task || task.status === targetStatus) return;

    const previousTasks = tasks;
    setTasks((prev) =>
      prev.map((item) => (item.id === taskId ? { ...item, status: targetStatus } : item)),
    );

    try {
      await updateTaskStatus(params.workspaceId, params.projectId, taskId, {
        status: targetStatus,
      });
    } catch (error) {
      setTasks(previousTasks);
      showAppNotice({ title: "Không thể cập nhật công việc", description: error instanceof Error ? error.message : "Không thể thay đổi trạng thái công việc.", tone: "danger" });
    } finally {
      setActiveDragTaskId(null);
    }
  };

  const handleMoveStatusQuick = async (taskId: string, targetStatus: TaskStatus) => {
    try {
      await updateTaskStatus(params.workspaceId, params.projectId, taskId, {
        status: targetStatus,
      });
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, status: targetStatus } : task)),
      );
    } catch (error) {
      showAppNotice({ title: "Không thể cập nhật công việc", description: error instanceof Error ? error.message : "Không thể thay đổi trạng thái công việc.", tone: "danger" });
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const keyword = searchKeyword.toLowerCase();
    const matchesKeyword =
      task.title.toLowerCase().includes(keyword) || task.taskCode.toLowerCase().includes(keyword);
    const matchesAssignee = selectedAssigneeId ? task.assigneeId === selectedAssigneeId : true;
    const matchesDependency = dependencyFilter === "ALL" ? true : dependencyFilter === "BLOCKED" ? task.isBlocked : task.isBlocking;
    return matchesKeyword && matchesAssignee && matchesDependency;
  });

  const getTasksByStatus = (status: TaskStatus) => filteredTasks.filter((task) => task.status === status);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8f9]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#4F8EB0] border-t-transparent" />
      </div>
    );
  }

  return (
    <AppShell projectId={params.projectId} title={project?.name} workspaceId={params.workspaceId}>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative w-full max-w-sm">
              <input
                className="h-9 w-full rounded border border-[#dfe1e6] bg-white pl-9 pr-3 text-sm text-[#172b4d] outline-none hover:bg-[#f7f8f9] focus:border-[#4F8EB0]"
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder="Tìm theo tiêu đề hoặc mã task"
                value={searchKeyword}
              />
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b778c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.3-4.3M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" />
              </svg>
            </div>

            <button
              className={`h-8 rounded border px-3 text-sm font-medium ${
                selectedAssigneeId === null
                  ? "border-[#4F8EB0] bg-[#e9f2ff] text-[#4F8EB0]"
                  : "border-[#dfe1e6] bg-white text-[#44546f] hover:bg-[#f1f2f4]"
              }`}
              onClick={() => setSelectedAssigneeId(null)}
              type="button"
            >
              Tất cả
            </button>

            <div className="flex -space-x-1">
              {members.slice(0, 6).map((member) => {
                const initial = member.fullName ? member.fullName.charAt(0).toUpperCase() : "?";
                const selected = selectedAssigneeId === member.userId;

                return (
                  <button
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold ${
                      selected
                        ? "z-10 border-[#4F8EB0] bg-[#deebff] text-[#4F8EB0]"
                        : "border-white bg-[#00875a] text-white hover:bg-[#216e4e]"
                    }`}
                    key={member.userId}
                    onClick={() => setSelectedAssigneeId(selected ? null : member.userId)}
                    title={member.fullName || member.email || undefined}
                    type="button"
                  >
                    {initial}
                  </button>
                );
              })}
            </div>
            <select className="h-9 rounded border border-[#dfe1e6] bg-white px-3 text-sm text-[#44546f]" onChange={(event) => setDependencyFilter(event.target.value as typeof dependencyFilter)} value={dependencyFilter}>
              <option value="ALL">Tất cả liên kết</option>
              <option value="BLOCKED">Đang bị chặn</option>
              <option value="BLOCKING">Đang chặn Task khác</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="h-9 rounded border border-[#dfe1e6] bg-white px-3 text-sm font-medium text-[#44546f] hover:bg-[#f1f2f4] disabled:opacity-60"
              disabled={isLoading}
              onClick={() => void loadData()}
              type="button"
            >
              Làm mới
            </button>
            {canWrite ? (
              <Link
                className="flex h-9 items-center rounded bg-[#4F8EB0] px-3 text-sm font-semibold text-white hover:bg-[#317491]"
                href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/tasks/create`}
              >
                Tạo task
              </Link>
            ) : null}
          </div>
        </div>

        {message ? (
          <div className="rounded border border-[#f5cd47] bg-[#fff7d6] px-3 py-2 text-sm font-medium text-[#7f5f01]">
            {message}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex h-80 items-center justify-center rounded border border-[#dfe1e6] bg-white">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#4F8EB0] border-t-transparent" />
          </div>
        ) : (
          <div className="grid min-w-[1180px] grid-cols-5 gap-3 overflow-x-auto pb-3">
            {columns.map((column) => {
              const columnTasks = getTasksByStatus(column.key);
              const isOver = dragOverColumn === column.key;

              return (
                <section
                  className={`flex min-h-[calc(100vh-260px)] flex-col rounded bg-[#f1f2f4] transition ${
                    isOver ? "ring-2 ring-[#4F8EB0]" : ""
                  }`}
                  key={column.key}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragOverColumn(column.key);
                  }}
                  onDrop={(event) => void handleDrop(event, column.key)}
                >
                  <div className="flex h-11 items-center justify-between px-3">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-[#44546f]">
                      {column.label}
                    </h2>
                    <span className="rounded bg-[#dfe1e6] px-1.5 py-0.5 text-xs font-semibold text-[#44546f]">
                      {columnTasks.length}
                    </span>
                  </div>

                  <div className="flex-1 space-y-2 px-2 pb-2">
                    {columnTasks.map((task) => (
                      <article
                        className={`rounded border border-[#dfe1e6] bg-white p-3 shadow-[0_1px_1px_rgba(9,30,66,0.16)] transition hover:border-[#b3b9c4] ${
                          activeDragTaskId === task.id ? "opacity-50" : ""
                        } ${canWrite ? "cursor-grab" : ""}`}
                        draggable={canWrite}
                        key={task.id}
                        onDragEnd={handleDragEnd}
                        onDragStart={(event) => handleDragStart(event, task.id)}
                      >
                        <Link
                          className="line-clamp-2 text-sm font-medium leading-5 text-[#172b4d] hover:text-[#4F8EB0]"
                          href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/tasks/${task.id}`}
                        >
                          {task.title}
                        </Link>

                        <div className="mt-2 flex flex-wrap gap-1">
                          {task.isBlocked ? <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">Bị chặn</span> : null}
                          {task.isBlocking ? <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">Đang chặn</span> : null}
                          {task.sprint ? (
                            <span className="rounded border border-[#dfe1e6] px-1.5 py-0.5 text-xs text-[#44546f]">
                              {task.sprint.name}
                            </span>
                          ) : null}
                          <span className="rounded border border-[#dfe1e6] px-1.5 py-0.5 text-xs text-[#44546f]">
                            {formatDate(task.dueDate)}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="font-mono text-xs font-medium text-[#6b778c]">
                              {task.taskCode}
                            </span>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            {canWrite ? (
                              <select
                                className="h-7 rounded border border-[#dfe1e6] bg-white px-1 text-xs text-[#44546f]"
                                onChange={(event) =>
                                  void handleMoveStatusQuick(task.id, event.target.value as TaskStatus)
                                }
                                value={task.status}
                              >
                                {columns.map((item) => (
                                  <option key={item.key} value={item.key}>
                                    {item.label}
                                  </option>
                                ))}
                              </select>
                            ) : null}
                            <span
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-[#00875a] text-xs font-semibold text-white"
                              title={task.assignee?.fullName ?? "Chưa gán"}
                            >
                              {task.assignee?.fullName ? task.assignee.fullName.charAt(0).toUpperCase() : "-"}
                            </span>
                          </div>
                        </div>
                      </article>
                    ))}

                    {columnTasks.length === 0 ? (
                      <div className="rounded border-2 border-dashed border-[#dfe1e6] px-3 py-8 text-center text-sm font-medium text-[#6b778c]">
                        Chưa có task
                      </div>
                    ) : null}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
