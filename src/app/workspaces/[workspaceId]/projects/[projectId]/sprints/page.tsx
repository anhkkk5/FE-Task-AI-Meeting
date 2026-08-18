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
  createTask,
  deleteTask,
  getTasks,
  moveTaskToSprint,
  updateTask,
  updateTaskStatus,
} from "@/features/tasks/api/tasks.api";
import { TaskDetailDrawer } from "@/features/tasks/components/TaskDetailDrawer";
import { TaskImportPanel } from "@/features/tasks/components/TaskImportPanel";
import { Task, TaskStatus } from "@/features/tasks/types/task.type";
import { useAuth } from "@/hooks/useAuth";
import { SprintBurndownChart } from "@/features/analytics/components/SprintBurndownChart";
import {
  exportSprintReportToPDF,
  exportTasksToExcel,
} from "@/features/sprints/utils/export-sprint-report";
import { Download, Printer, FileSpreadsheet } from "lucide-react";

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
      return "bg-[#e9f2ff] text-[#4F8EB0]";
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
      return "bg-[#e9f2ff] text-[#4F8EB0]";
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
  const [dependencyFilter, setDependencyFilter] = useState<"ALL" | "BLOCKED" | "BLOCKING">("ALL");
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState("");
  const [collapsedSprints, setCollapsedSprints] = useState<Record<string, boolean>>({});
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<DropTargetId | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

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

  const handleDrawerStatusChange = async (task: Task, status: TaskStatus, override?: { overrideBlocked: boolean; overrideReason: string }) => {
    const response = await updateTaskStatus(params.workspaceId, params.projectId, task.id, {
      status,
      ...override,
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
    const matchesDependency = dependencyFilter === "ALL" ? true : dependencyFilter === "BLOCKED" ? task.isBlocked : task.isBlocking;
    const matchesLabel = selectedLabel ? task.labels?.includes(selectedLabel) : true;
    return matchesKeyword && matchesAssignee && matchesStatus && matchesDependency && matchesLabel;
  });

  const orderTasksByHierarchy = (items: Task[]) => {
    const itemIds = new Set(items.map((item) => item.id));
    const children = new Map<string, Task[]>();
    items.forEach((item) => {
      if (item.parentId && itemIds.has(item.parentId)) {
        children.set(item.parentId, [...(children.get(item.parentId) ?? []), item]);
      }
    });
    const ordered: Task[] = [];
    const visit = (item: Task) => {
      ordered.push(item);
      (children.get(item.id) ?? []).forEach(visit);
    };
    items.filter((item) => !item.parentId || !itemIds.has(item.parentId)).forEach(visit);
    return ordered;
  };

  const getTasksBySprint = (sprintId: string | null) =>
    orderTasksByHierarchy(filteredTasks.filter((task) => task.sprintId === sprintId));

  const getTaskDepth = (task: Task, currentSprintId: string | null) => {
    let depth = 0;
    let parentId = task.parentId;
    const visited = new Set<string>();
    while (parentId && depth < 3 && !visited.has(parentId)) {
      visited.add(parentId);
      const parent = filteredTasks.find((item) => item.id === parentId && item.sprintId === currentSprintId);
      if (!parent) break;
      depth += 1;
      parentId = parent.parentId;
    }
    return depth;
  };

  const getDescendantStoryPoints = (taskId: string): number =>
    tasks.filter((item) => item.parentId === taskId).reduce(
      (total, child) => total + (child.storyPoints ?? 0) + getDescendantStoryPoints(child.id),
      0,
    );

  const getDescendantProgress = (taskId: string) => {
    const collect = (parentId: string): Task[] => tasks.filter((item) => item.parentId === parentId).flatMap((item) => [item, ...collect(item.id)]);
    const descendants = collect(taskId);
    const done = descendants.filter((item) => item.status === "DONE").length;
    return descendants.length ? Math.round((done / descendants.length) * 100) : 0;
  };

  const getSprintTaskCounts = (sprintId: string | null) => {
    const sprintTasks = tasks.filter((task) => task.sprintId === sprintId);
    return {
      todo: sprintTasks.filter((task) => task.status === "TODO" || task.status === "BACKLOG").length,
      inProgress: sprintTasks.filter((task) => task.status === "IN_PROGRESS" || task.status === "REVIEW").length,
      done: sprintTasks.filter((task) => task.status === "DONE").length,
    };
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((current) => {
      const next = new Set(current);
      if (next.has(taskId)) next.delete(taskId); else next.add(taskId);
      return next;
    });
  };

  const runBulkAction = async (action: "status" | "sprint" | "assignee" | "priority", value: string) => {
    if (!value || selectedTaskIds.size === 0) return;
    setIsBulkUpdating(true);
    const selected = tasks.filter((task) => selectedTaskIds.has(task.id));
    const results = await Promise.allSettled(selected.map((task) => {
      if (action === "status") return updateTaskStatus(params.workspaceId, params.projectId, task.id, { status: value as TaskStatus });
      if (action === "sprint") return moveTaskToSprint(params.workspaceId, params.projectId, task.id, { sprintId: value === "BACKLOG" ? null : value });
      if (action === "assignee") return assignTask(params.workspaceId, params.projectId, task.id, { assigneeId: value === "UNASSIGNED" ? null : value });
      return updateTask(params.workspaceId, params.projectId, task.id, { priority: value as Task["priority"] });
    }));
    const failed = results.filter((result) => result.status === "rejected").length;
    setSelectedTaskIds(new Set());
    await loadData();
    setMessage(failed ? `Đã cập nhật ${results.length - failed}/${results.length} Task. ${failed} Task không hợp lệ hoặc bị chặn.` : `Đã cập nhật ${results.length} Task.`);
    setIsBulkUpdating(false);
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
        aria-label={`Chọn ${task.taskCode}`}
        checked={selectedTaskIds.has(task.id)}
        className="h-4 w-4 rounded border-[#b3b9c4] text-[#4F8EB0]"
        disabled={!canWrite || isBulkUpdating}
        onChange={() => toggleTaskSelection(task.id)}
        type="checkbox"
      />

      <div className="flex min-w-0 items-center gap-2" style={{ paddingLeft: `${getTaskDepth(task, currentSprintId) * 20}px` }}>
        {getTaskDepth(task, currentSprintId) > 0 ? <span className="shrink-0 text-[#8590a2]">└</span> : null}
        <span
          className={`shrink-0 font-mono text-xs font-medium text-[#6b778c] ${
            task.status === "DONE" ? "line-through" : ""
          }`}
        >
          {task.taskCode}
        </span>
        <span className="shrink-0 rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-bold text-violet-700">{task.taskType}</span>
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${task.priority === "URGENT" ? "bg-rose-50 text-rose-700" : task.priority === "HIGH" ? "bg-amber-50 text-amber-700" : task.priority === "LOW" ? "bg-slate-100 text-slate-600" : "bg-blue-50 text-blue-700"}`}>{task.priority}</span>
        {task.taskType === "EPIC" ? <span className="shrink-0 text-[10px] font-semibold text-[#6b778c]">{getDescendantProgress(task.id)}% · {getDescendantStoryPoints(task.id)} SP</span> : null}
        {task.isBlocked ? <span className="shrink-0 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">Bị chặn</span> : null}
        {task.isBlocking ? <span className="shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">Đang chặn</span> : null}
        <button
          className={`truncate text-left font-medium text-[#172b4d] hover:text-[#4F8EB0] ${
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
          className={`h-7 w-full cursor-pointer rounded border-none px-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#4F8EB0] ${statusClass(task.status)}`}
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
            className="h-7 min-w-0 flex-1 cursor-pointer rounded border border-[#dfe1e6] bg-white px-1.5 text-xs text-[#44546f] outline-none focus:border-[#4F8EB0]"
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
          isDragOver ? "border-[#4F8EB0] shadow-[0_0_0_2px_#e9f2ff]" : "border-[#dfe1e6]"
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
              <span className="rounded bg-[#e9f2ff] px-1.5 py-0.5 text-[#4F8EB0]">{counts.inProgress}</span>
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
                className="h-8 rounded bg-[#4F8EB0] px-3 text-sm font-semibold text-white hover:bg-[#317491]"
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
              <div className={`border-t border-[#dfe1e6] px-3 py-8 text-center text-sm ${isDragOver ? "bg-[#e9f2ff] text-[#4F8EB0]" : "bg-white text-[#6b778c]"}`}>
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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#4F8EB0] border-t-transparent" />
      </div>
    );
  }

  const backlogTasks = getTasksBySprint(null);
  const backlogCounts = getSprintTaskCounts(null);
  const backlogCollapsed = collapsedSprints.backlog;
  const isBacklogDragOver = dragOverTarget === backlogDropTarget;
  const activeSprintCount = sprints.filter((sprint) => sprint.status === "ACTIVE").length;
  const plannedSprintCount = sprints.filter((sprint) => sprint.status === "PLANNED").length;
  const chartSprint = sprints.find((sprint) => sprint.status === "ACTIVE") ?? sprints[0] ?? null;
  const chartTasks = chartSprint
    ? tasks.filter((task) => task.sprintId === chartSprint.id)
    : [];
  const taskSummary = {
    total: tasks.length,
    backlog: tasks.filter((task) => task.sprintId === null).length,
    todo: tasks.filter((task) => task.status === "TODO" || task.status === "BACKLOG").length,
    inProgress: tasks.filter((task) => task.status === "IN_PROGRESS" || task.status === "REVIEW").length,
    done: tasks.filter((task) => task.status === "DONE").length,
  };
  const planningSprint = sprints.find((sprint) => sprint.status === "ACTIVE") ?? sprints.find((sprint) => sprint.status === "PLANNED") ?? null;
  const planningCapacity = (() => {
    if (!planningSprint) return null;
    const dates: string[] = [];
    for (let date = new Date(planningSprint.startDate); date <= new Date(planningSprint.endDate); date.setDate(date.getDate() + 1)) if (date.getDay() !== 0 && date.getDay() !== 6) dates.push(date.toISOString().slice(0, 10));
    const available = members.reduce((sum, member) => sum + dates.filter((date) => !(member.unavailableDates ?? []).includes(date)).length * (member.dailyCapacityHours ?? 8), 0);
    const assigned = tasks.filter((task) => task.sprintId === planningSprint.id && task.status !== "DONE").reduce((sum, task) => sum + (task.estimatedHours ?? 0), 0);
    return { available, assigned, utilization: available ? Math.round(assigned / available * 100) : 0 };
  })();
  const hasActiveFilters =
    searchKeyword.trim().length > 0 ||
    selectedStatus !== "ALL" ||
    dependencyFilter !== "ALL" ||
    selectedAssigneeId !== null || selectedLabel !== "";
  const availableLabels = [...new Set(tasks.flatMap((task) => task.labels ?? []))].sort();

  const clearFilters = () => {
    setSearchKeyword("");
    setSelectedStatus("ALL");
    setDependencyFilter("ALL");
    setSelectedAssigneeId(null);
    setSelectedLabel("");
  };

  return (
    <AppShell projectId={params.projectId} title={project?.name} workspaceId={params.workspaceId}>
      <div className="space-y-4">
        <section className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm shadow-slate-100/70 space-y-5">
          {/* Top Filter and Action Row */}
          <div className="flex flex-col gap-4">
            <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-[minmax(240px,1.35fr)_minmax(150px,.8fr)_minmax(180px,1fr)_minmax(170px,.9fr)_minmax(150px,.8fr)_auto] 2xl:items-end">
              <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                Tìm task
                <div className="relative">
                  <input
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3 text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:bg-slate-50 focus:border-[#4F8EB0] focus:bg-white focus:ring-4 focus:ring-[#4F8EB0]/15"
                    onChange={(event) => setSearchKeyword(event.target.value)}
                    placeholder="Nhập tên hoặc mã task..."
                    value={searchKeyword}
                  />
                  <svg
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
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

              <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                Trạng thái
                <select
                  className="h-10 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-sm font-medium text-slate-800 outline-none transition-all hover:bg-slate-50 focus:border-[#4F8EB0] focus:bg-white focus:ring-4 focus:ring-[#4F8EB0]/15"
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

              <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                Người nhận
                <select
                  className="h-10 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-sm font-medium text-slate-800 outline-none transition-all hover:bg-slate-50 focus:border-[#4F8EB0] focus:bg-white focus:ring-4 focus:ring-[#4F8EB0]/15"
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

              <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                Liên kết
                <select className="h-10 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-sm font-medium text-slate-800 outline-none focus:border-[#4F8EB0]" onChange={(event) => setDependencyFilter(event.target.value as typeof dependencyFilter)} value={dependencyFilter}>
                  <option value="ALL">Tất cả</option>
                  <option value="BLOCKED">Đang bị chặn</option>
                  <option value="BLOCKING">Đang chặn Task khác</option>
                </select>
              </label>

              <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">Nhãn<select className="h-10 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-sm font-medium" onChange={(event) => setSelectedLabel(event.target.value)} value={selectedLabel}><option value="">Tất cả nhãn</option>{availableLabels.map((label) => <option key={label} value={label}>#{label}</option>)}</select></label>

              <button
                className="h-10 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-40"
                disabled={!hasActiveFilters}
                onClick={clearFilters}
                type="button"
              >
                Xóa lọc
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-start gap-2 border-t border-slate-100 pt-4 lg:justify-end">
              <button
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-60"
                disabled={isLoading}
                onClick={() => void loadData()}
                type="button"
              >
                <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Làm mới
              </button>
              {canWrite ? (
                <>
                  <Link
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
                    href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/sprints/create`}
                  >
                    <svg className="h-3.5 w-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Tạo sprint
                  </Link>
                  <button
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-95"
                    onClick={() =>
                      exportTasksToExcel(
                        tasks,
                        `${project?.keyCode || "PRJ"}_Tasks_Report.csv`,
                      )
                    }
                    type="button"
                    title="Xuất file Excel (.csv UTF-8 chuẩn tiếng Việt)"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    Xuất Excel
                  </button>
                  <button
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-95"
                    onClick={() =>
                      exportSprintReportToPDF(
                        sprints.find((s) => s.status === "ACTIVE") || sprints[0] || null,
                        tasks,
                        project?.name,
                        "Workspace",
                      )
                    }
                    type="button"
                    title="In & Xuất báo cáo PDF chuẩn"
                  >
                    <Printer className="h-4 w-4 text-blue-600" />
                    Báo cáo PDF
                  </button>
                  <button
                    className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border px-3.5 text-xs font-semibold shadow-sm transition-all active:scale-95 ${
                      showImportPanel
                        ? "border-[#4F8EB0] bg-[#e9f2ff] text-[#4F8EB0]"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                    onClick={() => setShowImportPanel((prev) => !prev)}
                    type="button"
                  >
                    <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Nhập Excel
                  </button>
                  <Link
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#4F8EB0] px-4 text-xs font-bold text-white shadow-md shadow-[#4F8EB0]/20 transition-all hover:bg-[#3d7290] active:scale-95"
                    href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/tasks/create`}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    Tạo task
                  </Link>
                </>
              ) : null}
            </div>
          </div>

          {canWrite ? <div className="flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-3 sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 text-sm font-bold text-blue-900"><input checked={filteredTasks.length > 0 && filteredTasks.every((task) => selectedTaskIds.has(task.id))} className="h-4 w-4 rounded" onChange={(event) => setSelectedTaskIds(event.target.checked ? new Set(filteredTasks.map((task) => task.id)) : new Set())} type="checkbox" />Chọn tất cả đang hiển thị</label>
            <span className="rounded-full bg-blue-600 px-2.5 py-1 text-xs font-bold text-white">{selectedTaskIds.size} đã chọn</span>
            {selectedTaskIds.size > 0 ? <div className="grid flex-1 gap-2 sm:grid-cols-4">
              <select className="h-9 rounded-lg border border-blue-200 bg-white px-2 text-xs" defaultValue="" disabled={isBulkUpdating} onChange={(event) => { void runBulkAction("status", event.target.value); event.target.value = ""; }}><option value="" disabled>Đổi trạng thái...</option><option value="TODO">Cần làm</option><option value="IN_PROGRESS">Đang làm</option><option value="REVIEW">Review</option><option value="DONE">Hoàn thành</option></select>
              <select className="h-9 rounded-lg border border-blue-200 bg-white px-2 text-xs" defaultValue="" disabled={isBulkUpdating} onChange={(event) => { void runBulkAction("sprint", event.target.value); event.target.value = ""; }}><option value="" disabled>Chuyển Sprint...</option><option value="BACKLOG">Backlog</option>{sprints.filter((sprint) => sprint.status !== "COMPLETED" && sprint.status !== "CANCELLED").map((sprint) => <option key={sprint.id} value={sprint.id}>{sprint.name}</option>)}</select>
              <select className="h-9 rounded-lg border border-blue-200 bg-white px-2 text-xs" defaultValue="" disabled={isBulkUpdating} onChange={(event) => { void runBulkAction("assignee", event.target.value); event.target.value = ""; }}><option value="" disabled>Gán người phụ trách...</option><option value="UNASSIGNED">Bỏ gán</option>{members.map((member) => <option key={member.userId} value={member.userId}>{member.fullName || member.email}</option>)}</select>
              <select className="h-9 rounded-lg border border-blue-200 bg-white px-2 text-xs" defaultValue="" disabled={isBulkUpdating} onChange={(event) => { void runBulkAction("priority", event.target.value); event.target.value = ""; }}><option value="" disabled>Đổi ưu tiên...</option><option value="LOW">Thấp</option><option value="MEDIUM">Trung bình</option><option value="HIGH">Cao</option><option value="URGENT">Khẩn cấp</option></select>
            </div> : <span className="text-xs text-blue-700">Chọn Task bằng ô đầu mỗi dòng để thao tác hàng loạt.</span>}
          </div> : null}

          {planningCapacity ? <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4"><div className="flex items-center justify-between text-xs font-bold text-indigo-900"><span>Capacity · {planningSprint?.name}</span><span>{planningCapacity.assigned}h / {planningCapacity.available}h · {planningCapacity.utilization}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-indigo-100"><div className={`h-full ${planningCapacity.utilization > 100 ? "bg-rose-500" : "bg-indigo-600"}`} style={{ width: `${Math.min(100, planningCapacity.utilization)}%` }} /></div>{planningCapacity.utilization > 100 ? <p className="mt-2 text-xs font-semibold text-rose-700">Đội đang bị giao vượt quá giờ khả dụng.</p> : null}</div> : null}

          {/* Stat KPI Cards Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {/* Tổng Task */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 transition-all hover:bg-slate-100/60">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tổng task</span>
                <span className="rounded-lg bg-slate-200/60 px-2 py-0.5 text-[10px] font-bold text-slate-600">All</span>
              </div>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">{taskSummary.total}</p>
            </div>

            {/* Backlog */}
            <div className="rounded-2xl border border-amber-200/70 bg-amber-50/50 p-3.5 transition-all hover:bg-amber-50">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Backlog</span>
                <span className="rounded-lg bg-amber-200/60 px-2 py-0.5 text-[10px] font-bold text-amber-900">Unassigned</span>
              </div>
              <p className="mt-2 text-2xl font-extrabold text-amber-900">{taskSummary.backlog}</p>
            </div>

            {/* Cần làm */}
            <div className="rounded-2xl border border-blue-200/70 bg-blue-50/50 p-3.5 transition-all hover:bg-blue-50">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">Cần làm</span>
                <span className="rounded-lg bg-blue-200/60 px-2 py-0.5 text-[10px] font-bold text-blue-900">Todo</span>
              </div>
              <p className="mt-2 text-2xl font-extrabold text-blue-900">{taskSummary.todo}</p>
            </div>

            {/* Đang xử lý */}
            <div className="rounded-2xl border border-sky-200/70 bg-sky-50/50 p-3.5 transition-all hover:bg-sky-50">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800">Đang xử lý</span>
                <span className="rounded-lg bg-sky-200/60 px-2 py-0.5 text-[10px] font-bold text-sky-900">In Progress</span>
              </div>
              <p className="mt-2 text-2xl font-extrabold text-[#4F8EB0]">{taskSummary.inProgress}</p>
            </div>

            {/* Hoàn thành */}
            <div className="col-span-2 rounded-2xl border border-emerald-200/70 bg-emerald-50/50 p-3.5 transition-all hover:bg-emerald-50 sm:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Hoàn thành</span>
                <span className="rounded-lg bg-emerald-200/60 px-2 py-0.5 text-[10px] font-bold text-emerald-900">Done</span>
              </div>
              <p className="mt-2 text-2xl font-extrabold text-emerald-700">{taskSummary.done}</p>
            </div>
          </div>

          {/* Biểu đồ Burndown Chart trực quan */}
          <SprintBurndownChart
            sprint={chartSprint}
            tasks={chartTasks}
            projectName={project?.name}
          />

          {/* Bottom Info Bar */}
          <div className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between font-medium">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-[#4F8EB0] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Kéo thả task giữa Backlog và Sprint để phân công. Bấm tên task để xem chi tiết.</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-700 shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                Đang chạy: {activeSprintCount}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100/80 px-2.5 py-0.5 text-sky-800">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500"></span>
                Sắp tới: {plannedSprintCount}
              </span>
            </div>
          </div>
        </section>

        <div className="hidden">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative w-full max-w-xs">
              <input
                className="h-9 w-full rounded border border-[#dfe1e6] bg-white pl-9 pr-3 text-sm text-[#172b4d] outline-none hover:bg-[#f7f8f9] focus:border-[#4F8EB0]"
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
                  className="flex h-9 items-center rounded bg-[#4F8EB0] px-3 text-sm font-semibold text-white hover:bg-[#317491]"
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
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#4F8EB0] border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-3 overflow-x-auto pb-3">
            <div className="min-w-[920px] space-y-3">
              {sprints.map((sprint) => renderSprint(sprint))}

              <section
                className={`overflow-hidden rounded border bg-white transition ${
                  isBacklogDragOver ? "border-[#4F8EB0] shadow-[0_0_0_2px_#e9f2ff]" : "border-[#dfe1e6]"
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
                      <span className="rounded bg-[#e9f2ff] px-1.5 py-0.5 text-[#4F8EB0]">
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
                      <div className={`border-t border-[#dfe1e6] px-3 py-8 text-center text-sm ${isBacklogDragOver ? "bg-[#e9f2ff] text-[#4F8EB0]" : "bg-white text-[#6b778c]"}`}>
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
          onUpdateStructure={async (task, payload) => {
            const response = await updateTask(params.workspaceId, params.projectId, task.id, payload);
            setSelectedTask(response.data.task);
            await loadData();
          }}
          onCreateSubtask={async (task, payload) => {
            await createTask(params.workspaceId, params.projectId, {
              ...payload,
              taskType: "SUBTASK",
              priority: task.priority,
              parentId: task.id,
              sprintId: task.sprintId ?? undefined,
              assigneeId: task.assigneeId ?? undefined,
            });
            await loadData();
            const refreshed = await getTasks(params.workspaceId, params.projectId, { limit: 100 });
            const current = refreshed.data.items.find((item) => item.id === task.id);
            if (current) setSelectedTask(current);
          }}
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
