import { apiRequest } from "@/lib/api/client";
import { cachedRequest, invalidateCache } from "@/lib/api/request-cache";
import {
  CreateWorkspacePayload,
  UpdateWorkspacePayload,
  Workspace,
  WorkspaceStatus,
} from "../types/workspace.type";

const WORKSPACES_CACHE_PREFIX = "workspaces";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export async function createWorkspace(
  payload: CreateWorkspacePayload,
) {
  const response = await apiRequest<ApiResponse<{ workspace: Workspace }>>(
    "/workspaces",
    {
      method: "POST",
      body: payload,
    },
  );

  invalidateCache(WORKSPACES_CACHE_PREFIX);

  return response;
}

/**
 * Sidebar goi ham nay o moi trang du danh sach khong doi, nen ket qua duoc cache
 * ngan han. Cac ham ghi ben duoi se xoa cache de nguoi dung thay thay doi ngay.
 */
export function getMyWorkspaces(status?: WorkspaceStatus) {
  const query = status ? `?status=${status}` : "";

  return cachedRequest(`${WORKSPACES_CACHE_PREFIX}:list:${status ?? "all"}`, () =>
    apiRequest<ApiResponse<{ items: Workspace[] }>>(`/workspaces${query}`),
  );
}

export function getWorkspaceDetail(workspaceId: string) {
  return apiRequest<ApiResponse<{ workspace: Workspace }>>(
    `/workspaces/${workspaceId}`,
  );
}

export async function updateWorkspace(
  workspaceId: string,
  payload: UpdateWorkspacePayload,
) {
  const response = await apiRequest<ApiResponse<{ workspace: Workspace }>>(
    `/workspaces/${workspaceId}`,
    {
      method: "PATCH",
      body: payload,
    },
  );

  invalidateCache(WORKSPACES_CACHE_PREFIX);

  return response;
}

export async function archiveWorkspace(workspaceId: string) {
  const response = await apiRequest<ApiResponse<null>>(
    `/workspaces/${workspaceId}/archive`,
    {
      method: "PATCH",
    },
  );

  invalidateCache(WORKSPACES_CACHE_PREFIX);

  return response;
}
