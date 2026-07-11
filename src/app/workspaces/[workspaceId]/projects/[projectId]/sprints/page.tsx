"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { getMyWorkspaceRole, getWorkspaceMembers } from "@/features/members/api/members.api";
import { WorkspaceMember } from "@/features/members/types/member.type";
import { getProjectDetail } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types/project.type";
import { completeSprint, getSprints, startSprint } from "@/features/sprints/api/sprints.api";
import { Sprint } from "@/features/sprints/types/sprint.type";
import { getTasks, moveTaskToSprint, updateTaskStatus } from "@/features/tasks/api/tasks.api";
import { Task, TaskPriority, TaskStatus } from "@/features/tasks/types/task.type";
import { useAuth } from "@/hooks/useAuth";

const writeRoles = ["OWNER", "SCRUM_MASTER", "PROJECT_MANAGER"];

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "short",
  });
}

function statusClass(status: TaskStatus) {
  switch (status) {
    case "DONE":
      return "bg-[#dcfff1] text-[#216e4e]";
    case "IN_PROGRESS":
      return "bg-[#e9f2ff] text-[#0c66e4]";
    case "REVIEW":
      return "bg-[#f3f0ff] text-[#5e4db2]";
    case "CANCELLED":
      return "bg-[#f1f2f4] text-[#6b778c]";
    case "BACKLOG":
    case "TODO":
    default:
      return "bg-[#f1f2f4] text-[#44546f]";
  }
}

function statusLabel(status: TaskStatus) {
  switch (status) {
    case "BACKLOG":
      return "Backlog";
    case "TODO":
      return "Cần làm";
    case "IN_PROGRESS":
      return "Đang làm";
    case "REVIEW":
      return "Review";
    case "DONE":
      return "Done";
    case "CANCELLED":
      return "Đã hủy";
  }
}

function sprintStatusClass(status: Sprint["status"]) {
  switch (status) {
    case "ACTIVE":
      return "bg-[#dcfff1] text-[#216e4e]";
    case "COMPLETED":
      return "bg-[#f1f2f4] text-[#44546f]";
    case "CANCELLED":
      return "bg-[#fff4f2] text-[#ae2a19]";
    case "PLANNED":
    default:
      return "bg-[#e9f2ff] text-[#0c66e4]";
  }
}

function priorityMark(priority: TaskPriority) {
  switch (priority) {
    case "URGENT":
      return <span className="font-bold text-[#ae2a19]">↑↑</span>;
    case "HIGH":
      return <span className="font-bold text-[#c25100]">↑</span>;
    case "MEDIUM":
      return <span className="font-bold text-[#974f0c]">=</span>;
    case "LOW":
    default:
      return <span className="font-bold text-[#6b778c]">↓</span>;
  }
}

export default function BacklogPage() {
  const params = useParams<{ workspaceId: string; projectId: string }>();
  const { user, isLoading: authLoading } = useAuth(true);

  const [project, setProject] = useState<Project | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [myRole, setMyRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(null);
  const [collapsedSprints, setCollapsedSprints] = useState<Record<string, boolean>>({});

  const canWrite = writeRoles.includes(myRole) && project?.status === "ACTIVE";

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const [projectRes, sprintsRes, tasksRes, roleRes, membersRes] = await Promise.all([
        getProjectDetail(params.workspaceId, params.projectId),
        getSprints(params.workspaceId, params.projectId, { page: 1, limit: 100 }),
        getTasks(params.workspaceId, params.projectId, { page: 1, limit: 100 }),
        getMyWorkspaceRole(params.workspaceId),
        getWorkspaceMembers(params.workspaceId),
      ]);

      setProject(projectRes.data.project);
      setSprints(sprintsRes.data.items);
      setTasks(tasksRes.data.items);
      setMyRole(roleRes.data.role);
      setMembers(membersRes.data.items);

      const initialCollapsed: Record<string, boolean> = { backlog: false };
      sprintsRes.data.items.forEach((sprint) => {
        initialCollapsed[sprint.id] = false;
      });
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

  const handleToggleTaskStatus = async (task: Task) => {
    const newStatus: TaskStatus = task.status === "DONE" ? "TODO" : "DONE";

    try {
      await updateTaskStatus(params.workspaceId, params.projectId, task.id, { status: newStatus });
      setTasks((prev) =>
        prev.map((item) => (item.id === task.id ? { ...item, status: newStatus } : item)),
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : "Không thể cập nhật trạng thái task");
    }
  };

  const handleMoveTask = async (taskId: string, targetSprintId: string | null) => {
    try {
      await moveTaskToSprint(params.workspaceId, params.projectId, taskId, {
        sprintId: targetSprintId,
      });
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                sprintId: targetSprintId,
                sprint: targetSprintId
                  ? {
                      id: targetSprintId,
                      name: sprints.find((sprint) => sprint.id === targetSprintId)?.name || "Sprint",
                      status: sprints.find((sprint) => sprint.id === targetSprintId)?.status || "PLANNED",
                    }
                  : null,
              }
            : task,
        ),
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : "Không thể di chuyển task");
    }
  };

  const handleStartSprint = async (sprintId: string) => {
    if (!confirm("Bắt đầu sprint này?")) return;

    try {
      await startSprint(params.workspaceId, params.projectId, sprintId);
      await loadData();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Bắt đầu sprint thất bại");
    }
  };

  const handleCompleteSprint = async (sprintId: string) => {
    if (!confirm("Hoàn thành sprint này? Task chưa xong sẽ được trả về Backlog.")) return;

    try {
      await completeSprint(params.workspaceId, params.projectId, sprintId);
      await loadData();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Hoàn thành sprint thất bại");
    }
  };

  const toggleCollapse = (id: string) => {
    setCollapsedSprints((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredTasks = tasks.filter((task) => {
    const keyword = searchKeyword.toLowerCase();
    const matchesKeyword =
      task.title.toLowerCase().includes(keyword) || task.taskCode.toLowerCase().includes(keyword);
    const matchesAssignee = selectedAssigneeId ? task.assigneeId === selectedAssigneeId : true;
    return matchesKeyword && matchesAssignee;
  });

  const getTasksBySprint = (sprintId: string | null) =>
    filteredTasks.filter((task) => task.sprintId === sprintId);

  const getSprintTaskCounts = (sprintId: string | null) => {
    const sprintTasks = tasks.filter((task) => task.sprintId === sprintId);
    return {
      todo: sprintTasks.filter((task) => task.status === "TODO" || task.status === "BACKLOG").length,
      inProgress: sprintTasks.filter((task) => task.status === "IN_PROGRESS" || task.status === "REVIEW").length,
      done: sprintTasks.filter((task) => task.status === "DONE").length,
    };
  };

  const renderTaskRow = (task: Task, currentSprintId: string | null) => (
    <div
      className="grid grid-cols-[28px_minmax(120px,1fr)_110px_110px_90px_36px] items-center gap-3 border-t border-[#dfe1e6] bg-white px-3 py-2 text-sm hover:bg-[#f7f8f9]"
      key={task.id}
    >
      <input
        checked={task.status === "DONE"}
        className="h-4 w-4 rounded border-[#b3b9c4] text-[#0c66e4]"
        disabled={!canWrite}
        onChange={() => void handleToggleTaskStatus(task)}
        type="checkbox"
      />

      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`shrink-0 font-mono text-xs font-medium text-[#6b778c] ${
            task.status === "DONE" ? "line-through" : ""
          }`}
        >
          {task.taskCode}
        </span>
        <Link
          className={`truncate font-medium text-[#172b4d] hover:text-[#0c66e4] ${
            task.status === "DONE" ? "line-through text-[#6b778c]" : ""
          }`}
          href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/tasks/${task.id}`}
        >
          {task.title}
        </Link>
      </div>

      <span className={`w-fit rounded px-1.5 py-0.5 text-xs font-semibold ${statusClass(task.status)}`}>
        {statusLabel(task.status)}
      </span>

      {canWrite ? (
        <select
          className="h-7 rounded border border-[#dfe1e6] bg-white px-2 text-xs text-[#44546f]"
          onChange={(event) => void handleMoveTask(task.id, event.target.value || null)}
          value={currentSprintId ?? ""}
        >
          <option value="">Backlog</option>
          {sprints.map((sprint) => (
            <option key={sprint.id} value={sprint.id}>
              {sprint.name}
            </option>
          ))}
        </select>
      ) : (
        <span className="truncate text-xs text-[#6b778c]">{task.sprint?.name ?? "Backlog"}</span>
      )}

      <div className="flex items-center gap-2 text-xs text-[#6b778c]">
        <span>{formatDate(task.dueDate)}</span>
        {priorityMark(task.priority)}
      </div>

      <span
        className="flex h-6 w-6 items-center justify-center rounded-full bg-[#00875a] text-xs font-semibold text-white"
        title={task.assignee?.fullName ?? "Chưa gán"}
      >
        {task.assignee?.fullName ? task.assignee.fullName.charAt(0).toUpperCase() : "-"}
      </span>
    </div>
  );

  const renderSprint = (sprint: Sprint) => {
    const sprintTasks = getTasksBySprint(sprint.id);
    const isCollapsed = collapsedSprints[sprint.id];
    const counts = getSprintTaskCounts(sprint.id);

    return (
      <section className="overflow-hidden rounded border border-[#dfe1e6] bg-white" key={sprint.id}>
        <div className="flex min-h-12 flex-wrap items-center justify-between gap-3 bg-[#f7f8f9] px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <button
              className="flex h-7 w-7 items-center justify-center rounded text-[#44546f] hover:bg-[#dfe1e6]"
              onClick={() => toggleCollapse(sprint.id)}
              type="button"
            >
              <svg
                className={`h-4 w-4 transition ${isCollapsed ? "-rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-sm font-semibold text-[#172b4d]">{sprint.name}</h3>
                <span className="text-sm text-[#6b778c]">
                  {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)} ({sprintTasks.length} task)
                </span>
                <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${sprintStatusClass(sprint.status)}`}>
                  {sprint.status}
                </span>
              </div>
              {sprint.goal ? <p className="truncate text-xs text-[#6b778c]">{sprint.goal}</p> : null}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs font-semibold">
              <span className="rounded bg-[#dfe1e6] px-1.5 py-0.5 text-[#44546f]">{counts.todo}</span>
              <span className="rounded bg-[#e9f2ff] px-1.5 py-0.5 text-[#0c66e4]">{counts.inProgress}</span>
              <span className="rounded bg-[#dcfff1] px-1.5 py-0.5 text-[#216e4e]">{counts.done}</span>
            </div>

            <Link
              className="h-8 rounded border border-[#dfe1e6] bg-white px-3 py-1.5 text-sm font-medium text-[#44546f] hover:bg-[#f1f2f4]"
              href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/sprints/${sprint.id}/board`}
            >
              Bảng
            </Link>

            {canWrite && sprint.status === "PLANNED" ? (
              <button
                className="h-8 rounded border border-[#dfe1e6] bg-white px-3 text-sm font-medium text-[#44546f] hover:bg-[#f1f2f4]"
                onClick={() => void handleStartSprint(sprint.id)}
                type="button"
              >
                Bắt đầu sprint
              </button>
            ) : null}

            {canWrite && sprint.status === "ACTIVE" ? (
              <button
                className="h-8 rounded bg-[#0c66e4] px-3 text-sm font-semibold text-white hover:bg-[#0055cc]"
                onClick={() => void handleCompleteSprint(sprint.id)}
                type="button"
              >
                Hoàn thành sprint
              </button>
            ) : null}
          </div>
        </div>

        {!isCollapsed ? (
          <>
            {sprintTasks.map((task) => renderTaskRow(task, sprint.id))}
            {sprintTasks.length === 0 ? (
              <div className="border-t border-[#dfe1e6] bg-white px-3 py-8 text-center text-sm text-[#6b778c]">
                Chưa có task trong sprint này.
              </div>
            ) : null}
          </>
        ) : null}
      </section>
    );
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8f9]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0c66e4] border-t-transparent" />
      </div>
    );
  }

  const backlogTasks = getTasksBySprint(null);
  const backlogCounts = getSprintTaskCounts(null);
  const backlogCollapsed = collapsedSprints.backlog;

  return (
    <AppShell projectId={params.projectId} title={project?.name} workspaceId={params.workspaceId}>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative w-full max-w-xs">
              <input
                className="h-9 w-full rounded border border-[#dfe1e6] bg-white pl-9 pr-3 text-sm text-[#172b4d] outline-none hover:bg-[#f7f8f9] focus:border-[#0c66e4]"
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder="Tìm backlog"
                value={searchKeyword}
              />
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b778c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.3-4.3M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" />
              </svg>
            </div>

            <button
              className={`h-8 rounded border px-3 text-sm font-medium ${
                selectedAssigneeId === null
                  ? "border-[#0c66e4] bg-[#e9f2ff] text-[#0c66e4]"
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
                        ? "z-10 border-[#0c66e4] bg-[#deebff] text-[#0c66e4]"
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
              <>
                <Link
                  className="flex h-9 items-center rounded border border-[#dfe1e6] bg-white px-3 text-sm font-medium text-[#44546f] hover:bg-[#f1f2f4]"
                  href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/sprints/create`}
                >
                  Tạo sprint
                </Link>
                <Link
                  className="flex h-9 items-center rounded bg-[#0c66e4] px-3 text-sm font-semibold text-white hover:bg-[#0055cc]"
                  href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/tasks/create`}
                >
                  Tạo task
                </Link>
              </>
            ) : null}
          </div>
        </div>

        {message ? (
          <div className="rounded border border-[#f5cd47] bg-[#fff7d6] px-3 py-2 text-sm font-medium text-[#7f5f01]">
            {message}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex h-72 items-center justify-center rounded border border-[#dfe1e6] bg-white">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0c66e4] border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-3 overflow-x-auto pb-3">
            <div className="min-w-[920px] space-y-3">
              {sprints.map((sprint) => renderSprint(sprint))}

              <section className="overflow-hidden rounded border border-[#dfe1e6] bg-white">
                <div className="flex min-h-12 flex-wrap items-center justify-between gap-3 bg-[#f7f8f9] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <button
                      className="flex h-7 w-7 items-center justify-center rounded text-[#44546f] hover:bg-[#dfe1e6]"
                      onClick={() => toggleCollapse("backlog")}
                      type="button"
                    >
                      <svg
                        className={`h-4 w-4 transition ${backlogCollapsed ? "-rotate-90" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m6 9 6 6 6-6" />
                      </svg>
                    </button>
                    <div>
                      <h3 className="text-sm font-semibold text-[#172b4d]">
                        Backlog <span className="font-normal text-[#6b778c]">({backlogTasks.length} task)</span>
                      </h3>
                      <p className="text-xs text-[#6b778c]">Task chưa được gán vào sprint.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs font-semibold">
                      <span className="rounded bg-[#dfe1e6] px-1.5 py-0.5 text-[#44546f]">{backlogCounts.todo}</span>
                      <span className="rounded bg-[#e9f2ff] px-1.5 py-0.5 text-[#0c66e4]">
                        {backlogCounts.inProgress}
                      </span>
                      <span className="rounded bg-[#dcfff1] px-1.5 py-0.5 text-[#216e4e]">{backlogCounts.done}</span>
                    </div>
                    {canWrite ? (
                      <Link
                        className="h-8 rounded border border-[#dfe1e6] bg-white px-3 py-1.5 text-sm font-medium text-[#44546f] hover:bg-[#f1f2f4]"
                        href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/sprints/create`}
                      >
                        Tạo sprint
                      </Link>
                    ) : null}
                  </div>
                </div>

                {!backlogCollapsed ? (
                  <>
                    {backlogTasks.map((task) => renderTaskRow(task, null))}
                    {backlogTasks.length === 0 ? (
                      <div className="border-t border-[#dfe1e6] bg-white px-3 py-8 text-center text-sm text-[#6b778c]">
                        Backlog đang trống.
                      </div>
                    ) : null}
                  </>
                ) : null}
              </section>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
