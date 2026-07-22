import { apiRequest } from "@/lib/api/client";
import {
  CreateHandoverPayload,
  HandoverStatus,
  ShiftHandover,
  UpdateHandoverPayload,
} from "../types/shift-handover.type";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

const basePath = (workspaceId: string, projectId: string) =>
  `/workspaces/${workspaceId}/projects/${projectId}/shift-handovers/handovers`;

export function getHandovers(
  workspaceId: string,
  projectId: string,
  query: {
    status?: HandoverStatus;
    memberId?: string;
    taskId?: string;
    page?: number;
    limit?: number;
  } = {},
) {
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status);
  if (query.memberId) params.set("memberId", query.memberId);
  if (query.taskId) params.set("taskId", query.taskId);
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 100));

  return apiRequest<
    ApiResponse<{
      items: ShiftHandover[];
      meta: { total: number; page: number; limit: number };
    }>
  >(`${basePath(workspaceId, projectId)}?${params.toString()}`);
}

export function createHandover(
  workspaceId: string,
  projectId: string,
  payload: CreateHandoverPayload,
) {
  return apiRequest<ApiResponse<{ handover: ShiftHandover }>>(
    basePath(workspaceId, projectId),
    { method: "POST", body: payload },
  );
}

export function updateHandover(
  workspaceId: string,
  projectId: string,
  handoverId: string,
  payload: UpdateHandoverPayload,
) {
  return apiRequest<ApiResponse<{ handover: ShiftHandover }>>(
    `${basePath(workspaceId, projectId)}/${handoverId}`,
    { method: "PATCH", body: payload },
  );
}

export function submitHandover(
  workspaceId: string,
  projectId: string,
  handoverId: string,
) {
  return apiRequest<ApiResponse<{ handover: ShiftHandover }>>(
    `${basePath(workspaceId, projectId)}/${handoverId}/submit`,
    { method: "POST" },
  );
}

export function requestHandoverChanges(
  workspaceId: string,
  projectId: string,
  handoverId: string,
  reason: string,
) {
  return apiRequest<ApiResponse<{ handover: ShiftHandover }>>(
    `${basePath(workspaceId, projectId)}/${handoverId}/request-changes`,
    { method: "POST", body: { reason } },
  );
}

export function rejectHandover(
  workspaceId: string,
  projectId: string,
  handoverId: string,
  reason: string,
) {
  return apiRequest<ApiResponse<{ handover: ShiftHandover }>>(
    `${basePath(workspaceId, projectId)}/${handoverId}/reject`,
    { method: "POST", body: { reason } },
  );
}

export function acceptHandover(
  workspaceId: string,
  projectId: string,
  handoverId: string,
) {
  return apiRequest<ApiResponse<{ handover: ShiftHandover }>>(
    `${basePath(workspaceId, projectId)}/${handoverId}/accept`,
    { method: "POST" },
  );
}

export function deleteHandover(
  workspaceId: string,
  projectId: string,
  handoverId: string,
) {
  return apiRequest<ApiResponse<null>>(
    `${basePath(workspaceId, projectId)}/${handoverId}`,
    { method: "DELETE" },
  );
}
