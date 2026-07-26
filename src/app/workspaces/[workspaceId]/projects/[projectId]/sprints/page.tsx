"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { DragEvent, useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { getMyWorkspaceRole, getWorkspaceMembers } from "@/features/members/api/members.api";
import { WorkspaceMember } from "@/features/members/types/member.type";
import { getProjectDetail } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types/project.type";
import {
  completeSprint,
  deleteSprint,
  getSprints,
  startSprint,
} from "@/features/sprints/api/sprints.api";
import { Sprint } from "@/features/sprints/types/sprint.type";
import {
  assignTask,
  cancelTask,
  deleteTask,
  getTasks,
  moveTaskToSprint,
  updateTaskStatus,
} from "@/features/tasks/api/tasks.api";
import { TaskDetailDrawer } from "@/features/tasks/components/TaskDetailDrawer";
import { TaskImportPanel } from "@/features/tasks/components/TaskImportPanel";
import { Task, TaskStatus } from "@/features/tasks/types/task.type";
import { useAuth } from "@/hooks/useAuth";

const writeRoles = ["OWNER", "SCRUM_MASTER", "PROJECT_MANAGER"];
const backlogDropTarget = "backlog";

type DropTargetId = typeof backlogDropTarget | string;

const statusFilterOptions: Array<{ value: "ALL" | TaskStatus; label: string }> = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "BACKLOG", label: "Backlog" },
  { value: "TODO", label: "Cần làm" },
  { value: "IN_PROGRESS", label: "Đang làm" },
  { value: "REVIEW", label: "Đang review" },
  { value: "DONE", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Đã hủy" },
];

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

function sprintStatusLabel(status: Sprint["status"]) {
  switch (status) {
    case "ACTIVE":
      return "Đang chạy";
    case "COMPLETED":
      return "Hoàn thành";
    case "CANCELLED":
      return "Đã hủy";
    case "PLANNED":
    default:
      return "Đã lên kế hoạch";
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
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | TaskStatus>("ALL");
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(null);
  const [collapsedSprints, setCollapsedSprints] = useState<Record<string, boolean>>({});
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<DropTargetId | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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

  const syncTask = (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
    );
    setSelectedTask((current) =>
      current?.id === updatedTask.id ? updatedTask : current,
    );
  };

  const handleToggleTaskStatus = async (task: Task) => {
    const newStatus: TaskStatus = task.status === "DONE" ? "TODO" : "DONE";

    try {
      const response = await updateTaskStatus(
        params.workspaceId,
        params.projectId,
        task.id,
        { status: newStatus },
      );
      syncTask(response.data.task);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Không thể cập nhật trạng thái task");
    }
  };

  const handleMoveTask = async (taskId: string, targetSprintId: string | null) => {
    try {
      const response = await moveTaskToSprint(params.workspaceId, params.projectId, taskId, {
        sprintId: targetSprintId,
      });
      syncTask(response.data.task);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Không thể di chuyển task");
    }
  };

  /**
   * Doi trang thai ngay tren dong backlog.
   *
   * Tach rieng khoi handler cua drawer vi o day loi phai tu bao,
   * drawer thi tu no da bat loi.
   */
  const handleRowStatusChange = async (task: Task, status: TaskStatus) => {
    if (status === task.status) return;

    try {
      const response = await updateTaskStatus(params.workspaceId, params.projectId, task.id, {
        status,
      });
      syncTask(response.data.task);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Không thể cập nhật trạng thái task");
    }
  };

  /** Doi nguoi phu trach ngay tren dong backlog. */
  const handleRowAssign = async (task: Task, assigneeId: string | null) => {
    if (assigneeId === (task.assigneeId ?? null)) return;

    try {
      const response = await assignTask(params.workspaceId, params.projectId, task.id, {
        assigneeId,
      });
      syncTask(response.data.task);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Không thể gán người phụ trách");
    }
  };

  const handleDrawerStatusChange = async (task: Task, status: TaskStatus) => {
    const response = await updateTaskStatus(params.workspaceId, params.projectId, task.id, {
      status,
    });
    syncTask(response.data.task);
  };

  const handleDrawerAssign = async (task: Task, assigneeId: string | null) => {
    const response = await assignTask(params.workspaceId, params.projectId, task.id, {
      assigneeId,
    });
    syncTask(response.data.task);
  };

  const handleDrawerMoveSprint = async (task: Task, sprintId: string | null) => {
    const response = await moveTaskToSprint(params.workspaceId, params.projectId, task.id, {
      sprintId,
    });
    syncTask(response.data.task);
  };

  const handleDrawerCancel = async (task: Task) => {
    const response = await cancelTask(params.workspaceId, params.projectId, task.id);
    syncTask(response.data.task);
  };

  const handleDrawerDelete = async (task: Task) => {
    await deleteTask(params.workspaceId, params.projectId, task.id);
    setTasks((current) => current.filter((item) => item.id !== task.id));
    setSelectedTask(null);
  };

  const handleTaskDragStart = (event: DragEvent<HTMLDivElement>, taskId: string) => {
    if (!canWrite) return;

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", taskId);
    setDraggedTaskId(taskId);
  };

  const handleTaskDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverTarget(null);
  };

  const handleDropZoneDragOver = (
    event: DragEvent<HTMLElement>,
    target: DropTargetId,
    disabled = false,
  ) => {
    if (!canWrite || disabled) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverTarget(target);
  };

  const handleDropZoneDragLeave = (
    event: DragEvent<HTMLElement>,
    target: DropTargetId,
  ) => {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;

    setDragOverTarget((current) => (current === target ? null : current));
  };

  const handleTaskDrop = async (
    event: DragEvent<HTMLElement>,
    target: DropTargetId,
    disabled = false,
  ) => {
    event.preventDefault();

    if (!canWrite || disabled) {
      setDraggedTaskId(null);
      setDragOverTarget(null);
      return;
    }

    const taskId = event.dataTransfer.getData("text/plain") || draggedTaskId;
    const targetSprintId = target === backlogDropTarget ? null : target;
    const task = tasks.find((item) => item.id === taskId);

    setDraggedTaskId(null);
    setDragOverTarget(null);

    if (!task || task.sprintId === targetSprintId) return;

    await handleMoveTask(task.id, targetSprintId);
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

  const handleDeleteSprint = async (sprint: Sprint) => {
    if (!confirm(`Xóa sprint "${sprint.name}"? Các task sẽ được đưa về Backlog.`)) {
      return;
    }

    try {
      await deleteSprint(params.workspaceId, params.projectId, sprint.id);
      await loadData();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Xóa sprint thất bại");
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
    const matchesStatus = selectedStatus === "ALL" ? true : task.status === selectedStatus;
    return matchesKeyword && matchesAssignee && matchesStatus;
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

  const renderTaskRow = (task: Task, currentSprintId: string | null) => {
    // MEMBER duoc tu doi trang thai task cua chinh minh, giong Jira.
    const canChangeStatus =
      task.status !== "CANCELLED" &&
      (canWrite || (myRole === "MEMBER" && task.assigneeId === user?.id));

    return (
    <div
      className={`grid grid-cols-[28px_minmax(120px,1fr)_128px_110px_90px_150px] items-center gap-3 border-t border-[#dfe1e6] bg-white px-3 py-2 text-sm transition hover:bg-[#f7f8f9] ${
        canWrite ? "cursor-grab active:cursor-grabbing" : ""
      } ${draggedTaskId === task.id ? "opacity-50" : ""}`}
      draggable={canWrite}
      key={task.id}
      onDragEnd={handleTaskDragEnd}
      onDragStart={(event) => handleTaskDragStart(event, task.id)}
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
        <button
          className={`truncate text-left font-medium text-[#172b4d] hover:text-[#0c66e4] ${
            task.status === "DONE" ? "line-through text-[#6b778c]" : ""
          }`}
          onClick={() => setSelectedTask(task)}
          type="button"
        >
          {task.title}
        </button>
      </div>

      {canChangeStatus ? (
        <select
          className={`h-7 w-full cursor-pointer rounded border-none px-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#0c66e4] ${statusClass(task.status)}`}
          onChange={(event) =>
            void handleRowStatusChange(task, event.target.value as TaskStatus)
          }
          onClick={(event) => event.stopPropagation()}
          value={task.status}
        >
          <option value="BACKLOG">Backlog</option>
          <option value="TODO">Cần làm</option>
          <option value="IN_PROGRESS">Đang làm</option>
          <option value="REVIEW">Review</option>
          <option value="DONE">Done</option>
        </select>
      ) : (
        <span className={`w-fit rounded px-1.5 py-0.5 text-xs font-semibold ${statusClass(task.status)}`}>
          {statusLabel(task.status)}
        </span>
      )}

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
      </div>

      <div className="flex min-w-0 items-center gap-2">
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
            task.assignee ? "bg-[#00875a] text-white" : "bg-[#dfe1e6] text-[#6b778c]"
          }`}
          title={task.assignee?.fullName ?? "Chưa gán"}
        >
          {task.assignee?.fullName ? task.assignee.fullName.charAt(0).toUpperCase() : "-"}
        </span>
        {canWrite ? (
          <select
            className="h-7 min-w-0 flex-1 cursor-pointer rounded border border-[#dfe1e6] bg-white px-1.5 text-xs text-[#44546f] outline-none focus:border-[#0c66e4]"
            onChange={(event) => void handleRowAssign(task, event.target.value || null)}
            onClick={(event) => event.stopPropagation()}
            value={task.assigneeId ?? ""}
          >
            <option value="">Chưa gán</option>
            {members
              .filter((member) => member.status === "ACTIVE")
              .map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.fullName || member.email || member.userId}
                </option>
              ))}
          </select>
        ) : (
          <span className="truncate text-xs text-[#6b778c]">
            {task.assignee?.fullName ?? "Chưa gán"}
          </span>
        )}
      </div>
    </div>
    );
  };

  const renderSprint = (sprint: Sprint) => {
    const sprintTasks = getTasksBySprint(sprint.id);
    const isCollapsed = collapsedSprints[sprint.id];
    const counts = getSprintTaskCounts(sprint.id);
    const isDropDisabled = sprint.status === "COMPLETED" || sprint.status === "CANCELLED";
    const isDragOver = dragOverTarget === sprint.id && !isDropDisabled;

    return (
      <section
        className={`overflow-hidden rounded border bg-white transition ${
          isDragOver ? "border-[#0c66e4] shadow-[0_0_0_2px_#e9f2ff]" : "border-[#dfe1e6]"
        } ${isDropDisabled ? "opacity-80" : ""}`}
        key={sprint.id}
        onDragLeave={(event) => handleDropZoneDragLeave(event, sprint.id)}
        onDragOver={(event) => handleDropZoneDragOver(event, sprint.id, isDropDisabled)}
        onDrop={(event) => void handleTaskDrop(event, sprint.id, isDropDisabled)}
      >
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
                  {sprintStatusLabel(sprint.status)}
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

            {sprint.status !== "ACTIVE" &&
            (canWrite || sprint.createdBy === user?.id) ? (
              <button
                className="h-8 rounded border border-[#ffbdad] bg-white px-3 text-sm font-medium text-[#ae2a19] hover:bg-[#fff4f2]"
                onClick={() => void handleDeleteSprint(sprint)}
                type="button"
              >
                Xóa
              </button>
            ) : null}
          </div>
        </div>

        {!isCollapsed ? (
          <>
            {sprintTasks.map((task) => renderTaskRow(task, sprint.id))}
            {sprintTasks.length === 0 ? (
              <div className={`border-t border-[#dfe1e6] px-3 py-8 text-center text-sm ${isDragOver ? "bg-[#e9f2ff] text-[#0c66e4]" : "bg-white text-[#6b778c]"}`}>
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
  const isBacklogDragOver = dragOverTarget === backlogDropTarget;
  const activeSprintCount = sprints.filter((sprint) => sprint.status === "ACTIVE").length;
  const plannedSprintCount = sprints.filter((sprint) => sprint.status === "PLANNED").length;
  const taskSummary = {
    total: tasks.length,
    backlog: tasks.filter((task) => task.sprintId === null).length,
    todo: tasks.filter((task) => task.status === "TODO" || task.status === "BACKLOG").length,
    inProgress: tasks.filter((task) => task.status === "IN_PROGRESS" || task.status === "REVIEW").length,
    done: tasks.filter((task) => task.status === "DONE").length,
  };
  const hasActiveFilters =
    searchKeyword.trim().length > 0 ||
    selectedStatus !== "ALL" ||
    selectedAssigneeId !== null;

  const clearFilters = () => {
    setSearchKeyword("");
    setSelectedStatus("ALL");
    setSelectedAssigneeId(null);
  };

  return (
    <AppShell projectId={params.projectId} title={project?.name} workspaceId={params.workspaceId}>
      <div className="space-y-4">
        <section className="rounded border border-[#dfe1e6] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#dfe1e6] px-4 py-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="grid flex-1 gap-3 md:grid-cols-[minmax(240px,1fr)_180px_220px_auto] md:items-end">
              <label className="grid gap-1 text-xs font-semibold text-[#44546f]">
                Tìm task
                <div className="relative">
                  <input
                    className="h-10 w-full rounded border border-[#dfe1e6] bg-white pl-9 pr-3 text-sm text-[#172b4d] outline-none hover:bg-[#f7f8f9] focus:border-[#0c66e4]"
                    onChange={(event) => setSearchKeyword(event.target.value)}
                    placeholder="Nhập tên task hoặc mã task"
                    value={searchKeyword}
                  />
                  <svg
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b778c]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="m21 21-4.3-4.3M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"
                    />
                  </svg>
                </div>
              </label>

              <label className="grid gap-1 text-xs font-semibold text-[#44546f]">
                Trạng thái
                <select
                  className="h-10 rounded border border-[#dfe1e6] bg-white px-3 text-sm text-[#172b4d] outline-none hover:bg-[#f7f8f9] focus:border-[#0c66e4]"
                  onChange={(event) =>
                    setSelectedStatus(event.target.value as "ALL" | TaskStatus)
                  }
                  value={selectedStatus}
                >
                  {statusFilterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-xs font-semibold text-[#44546f]">
                Người nhận
                <select
                  className="h-10 rounded border border-[#dfe1e6] bg-white px-3 text-sm text-[#172b4d] outline-none hover:bg-[#f7f8f9] focus:border-[#0c66e4]"
                  onChange={(event) => setSelectedAssigneeId(event.target.value || null)}
                  value={selectedAssigneeId ?? ""}
                >
                  <option value="">Tất cả thành viên</option>
                  {members.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.fullName || member.email || member.userId}
                    </option>
                  ))}
                </select>
              </label>

              <button
                className="h-10 rounded border border-[#dfe1e6] bg-white px-3 text-sm font-semibold text-[#44546f] hover:bg-[#f1f2f4] disabled:opacity-50"
                disabled={!hasActiveFilters}
                onClick={clearFilters}
                type="button"
              >
                Xóa lọc
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                className="h-10 rounded border border-[#dfe1e6] bg-white px-3 text-sm font-semibold text-[#44546f] hover:bg-[#f1f2f4] disabled:opacity-60"
                disabled={isLoading}
                onClick={() => void loadData()}
                type="button"
              >
                Làm mới
              </button>
              {canWrite ? (
                <>
                  <Link
                    className="flex h-10 items-center rounded border border-[#dfe1e6] bg-white px-3 text-sm font-semibold text-[#44546f] hover:bg-[#f1f2f4]"
                    href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/sprints/create`}
                  >
                    Tạo sprint
                  </Link>
                  <button
                    className={`h-10 rounded border px-3 text-sm font-semibold ${
                      showImportPanel
                        ? "border-[#0c66e4] bg-[#e9f2ff] text-[#0c66e4]"
                        : "border-[#dfe1e6] bg-white text-[#44546f] hover:bg-[#f1f2f4]"
                    }`}
                    onClick={() => setShowImportPanel((prev) => !prev)}
                    type="button"
                  >
                    Nhập Excel
                  </button>
                  <Link
                    className="flex h-10 items-center rounded bg-[#0c66e4] px-4 text-sm font-semibold text-white hover:bg-[#0055cc]"
                    href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/tasks/create`}
                  >
                    Tạo task
                  </Link>
                </>
              ) : null}
            </div>
          </div>

          <div className="grid gap-0 border-b border-[#dfe1e6] md:grid-cols-5">
            <div className="border-b border-[#dfe1e6] px-4 py-3 md:border-b-0 md:border-r">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#6b778c]">Tổng task</p>
              <p className="mt-1 text-xl font-semibold text-[#172b4d]">{taskSummary.total}</p>
            </div>
            <div className="border-b border-[#dfe1e6] px-4 py-3 md:border-b-0 md:border-r">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#6b778c]">Backlog</p>
              <p className="mt-1 text-xl font-semibold text-[#172b4d]">{taskSummary.backlog}</p>
            </div>
            <div className="border-b border-[#dfe1e6] px-4 py-3 md:border-b-0 md:border-r">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#6b778c]">Cần làm</p>
              <p className="mt-1 text-xl font-semibold text-[#44546f]">{taskSummary.todo}</p>
            </div>
            <div className="border-b border-[#dfe1e6] px-4 py-3 md:border-b-0 md:border-r">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#6b778c]">Đang xử lý</p>
              <p className="mt-1 text-xl font-semibold text-[#0c66e4]">{taskSummary.inProgress}</p>
            </div>
            <div className="px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#6b778c]">Hoàn thành</p>
              <p className="mt-1 text-xl font-semibold text-[#216e4e]">{taskSummary.done}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 px-4 py-3 text-xs text-[#6b778c] lg:flex-row lg:items-center lg:justify-between">
            <p>
              Kéo task giữa Backlog và Sprint để sắp xếp công việc. Bấm tên task để mở bảng chi tiết bên phải.
            </p>
            <p className="font-semibold text-[#44546f]">
              Sprint đang chạy: {activeSprintCount} · Sprint sắp tới: {plannedSprintCount}
            </p>
          </div>
        </section>

        <div className="hidden">
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
                <button
                  className="h-9 rounded border border-[#dfe1e6] bg-white px-3 text-sm font-medium text-[#44546f] hover:bg-[#f1f2f4]"
                  onClick={() => setShowImportPanel((prev) => !prev)}
                  type="button"
                >
                  Nhập Excel
                </button>
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

        {showImportPanel && canWrite ? (
          <TaskImportPanel
            onClose={() => setShowImportPanel(false)}
            onImported={async (createdCount) => {
              setMessage(`Đã nhập ${createdCount} task từ Excel.`);
              await loadData();
            }}
            projectId={params.projectId}
            workspaceId={params.workspaceId}
          />
        ) : null}

        {isLoading ? (
          <div className="flex h-72 items-center justify-center rounded border border-[#dfe1e6] bg-white">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0c66e4] border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-3 overflow-x-auto pb-3">
            <div className="min-w-[920px] space-y-3">
              {sprints.map((sprint) => renderSprint(sprint))}

              <section
                className={`overflow-hidden rounded border bg-white transition ${
                  isBacklogDragOver ? "border-[#0c66e4] shadow-[0_0_0_2px_#e9f2ff]" : "border-[#dfe1e6]"
                }`}
                onDragLeave={(event) => handleDropZoneDragLeave(event, backlogDropTarget)}
                onDragOver={(event) => handleDropZoneDragOver(event, backlogDropTarget)}
                onDrop={(event) => void handleTaskDrop(event, backlogDropTarget)}
              >
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
                      <div className={`border-t border-[#dfe1e6] px-3 py-8 text-center text-sm ${isBacklogDragOver ? "bg-[#e9f2ff] text-[#0c66e4]" : "bg-white text-[#6b778c]"}`}>
                        Backlog đang trống.
                      </div>
                    ) : null}
                  </>
                ) : null}
              </section>
            </div>
          </div>
        )}

        <TaskDetailDrawer
          canChangeStatus={
            canWrite ||
            (myRole === "MEMBER" && selectedTask?.assigneeId === user?.id)
          }
          canManage={canWrite}
          canDelete={Boolean(
            selectedTask &&
              user &&
              (writeRoles.includes(myRole) || selectedTask.createdBy === user.id),
          )}
          members={members}
          onAssign={handleDrawerAssign}
          onCancel={handleDrawerCancel}
          onDelete={handleDrawerDelete}
          onClose={() => setSelectedTask(null)}
          onMoveSprint={handleDrawerMoveSprint}
          onStatusChange={handleDrawerStatusChange}
          projectId={params.projectId}
          sprints={sprints}
          task={selectedTask}
          workspaceId={params.workspaceId}
        />
      </div>
    </AppShell>
  );
}
