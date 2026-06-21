import { apiRequest } from "@/lib/api/client";
import {
  AssignTaskPayload,
  CreateTaskPayload,
  MoveTaskSprintPayload,
  Task,
  TaskQuery,
  UpdateTaskPayload,
  UpdateTaskStatusPayload,
} from "../types/task.type";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

function taskBasePath(workspaceId: string, projectId: string) {
  return `/workspaces/${workspaceId}/projects/${projectId}/tasks`;
}

export function createTask(
  workspaceId: string,
  projectId: string,
  payload: CreateTaskPayload,
) {
  return apiRequest<ApiResponse<{ task: Task }>>(
    taskBasePath(workspaceId, projectId),
    {
      method: "POST",
      body: payload,
    },
  );
}

export function getTasks(
  workspaceId: string,
  projectId: string,
  query: TaskQuery = {},
) {
  const params = new URLSearchParams();

  if (query.sprintId) params.set("sprintId", query.sprintId);
  if (query.status) params.set("status", query.status);
  if (query.assigneeId) params.set("assigneeId", query.assigneeId);
  if (query.priority) params.set("priority", query.priority);
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));

  const search = params.toString();

  return apiRequest<
    ApiResponse<{
      items: Task[];
      meta: { total: number; page: number; limit: number };
    }>
  >(`${taskBasePath(workspaceId, projectId)}${search ? `?${search}` : ""}`);
}

export function getBacklogTasks(workspaceId: string, projectId: string) {
  return apiRequest<ApiResponse<{ items: Task[] }>>(
    `${taskBasePath(workspaceId, projectId)}/backlog`,
  );
}

export function getSprintTasks(
  workspaceId: string,
  projectId: string,
  sprintId: string,
) {
  return apiRequest<ApiResponse<{ items: Task[] }>>(
    `/workspaces/${workspaceId}/projects/${projectId}/sprints/${sprintId}/tasks`,
  );
}

export function getTaskDetail(
  workspaceId: string,
  projectId: string,
  taskId: string,
) {
  return apiRequest<ApiResponse<{ task: Task }>>(
    `${taskBasePath(workspaceId, projectId)}/${taskId}`,
  );
}

export function updateTask(
  workspaceId: string,
  projectId: string,
  taskId: string,
  payload: UpdateTaskPayload,
) {
  return apiRequest<ApiResponse<{ task: Task }>>(
    `${taskBasePath(workspaceId, projectId)}/${taskId}`,
    {
      method: "PATCH",
      body: payload,
    },
  );
}

export function updateTaskStatus(
  workspaceId: string,
  projectId: string,
  taskId: string,
  payload: UpdateTaskStatusPayload,
) {
  return apiRequest<ApiResponse<{ task: Task }>>(
    `${taskBasePath(workspaceId, projectId)}/${taskId}/status`,
    {
      method: "PATCH",
      body: payload,
    },
  );
}

export function assignTask(
  workspaceId: string,
  projectId: string,
  taskId: string,
  payload: AssignTaskPayload,
) {
  return apiRequest<ApiResponse<{ task: Task }>>(
    `${taskBasePath(workspaceId, projectId)}/${taskId}/assign`,
    {
      method: "PATCH",
      body: payload,
    },
  );
}

export function moveTaskToSprint(
  workspaceId: string,
  projectId: string,
  taskId: string,
  payload: MoveTaskSprintPayload,
) {
  return apiRequest<ApiResponse<{ task: Task }>>(
    `${taskBasePath(workspaceId, projectId)}/${taskId}/sprint`,
    {
      method: "PATCH",
      body: payload,
    },
  );
}

export function cancelTask(
  workspaceId: string,
  projectId: string,
  taskId: string,
) {
  return apiRequest<ApiResponse<{ task: Task }>>(
    `${taskBasePath(workspaceId, projectId)}/${taskId}/cancel`,
    {
      method: "PATCH",
    },
  );
}
