import { apiRequest } from "@/lib/api/client";
import {
  CreateSprintPayload,
  Sprint,
  SprintQuery,
  UpdateSprintPayload,
} from "../types/sprint.type";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

function sprintBasePath(workspaceId: string, projectId: string) {
  return `/workspaces/${workspaceId}/projects/${projectId}/sprints`;
}

export function createSprint(
  workspaceId: string,
  projectId: string,
  payload: CreateSprintPayload,
) {
  return apiRequest<ApiResponse<{ sprint: Sprint }>>(
    sprintBasePath(workspaceId, projectId),
    {
      method: "POST",
      body: payload,
    },
  );
}

export function getSprints(
  workspaceId: string,
  projectId: string,
  query: SprintQuery = {},
) {
  const params = new URLSearchParams();

  if (query.status) params.set("status", query.status);
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));

  const search = params.toString();

  return apiRequest<
    ApiResponse<{
      items: Sprint[];
      meta: { total: number; page: number; limit: number };
    }>
  >(
    `${sprintBasePath(workspaceId, projectId)}${search ? `?${search}` : ""}`,
  );
}

export function getSprintDetail(
  workspaceId: string,
  projectId: string,
  sprintId: string,
) {
  return apiRequest<ApiResponse<{ sprint: Sprint }>>(
    `${sprintBasePath(workspaceId, projectId)}/${sprintId}`,
  );
}

export function updateSprint(
  workspaceId: string,
  projectId: string,
  sprintId: string,
  payload: UpdateSprintPayload,
) {
  return apiRequest<ApiResponse<{ sprint: Sprint }>>(
    `${sprintBasePath(workspaceId, projectId)}/${sprintId}`,
    {
      method: "PATCH",
      body: payload,
    },
  );
}

export function startSprint(
  workspaceId: string,
  projectId: string,
  sprintId: string,
) {
  return apiRequest<ApiResponse<{ sprint: Sprint }>>(
    `${sprintBasePath(workspaceId, projectId)}/${sprintId}/start`,
    {
      method: "PATCH",
    },
  );
}

export function completeSprint(
  workspaceId: string,
  projectId: string,
  sprintId: string,
) {
  return apiRequest<ApiResponse<{ sprint: Sprint }>>(
    `${sprintBasePath(workspaceId, projectId)}/${sprintId}/complete`,
    {
      method: "PATCH",
    },
  );
}

export function cancelSprint(
  workspaceId: string,
  projectId: string,
  sprintId: string,
) {
  return apiRequest<ApiResponse<null>>(
    `${sprintBasePath(workspaceId, projectId)}/${sprintId}/cancel`,
    {
      method: "PATCH",
    },
  );
}
