import { apiRequest } from "@/lib/api/client";
import { cachedRequest, invalidateCache } from "@/lib/api/request-cache";
import {
  AddMemberPayload,
  ChangeMemberRolePayload,
  MyWorkspaceRole,
  WorkspaceMember,
  WorkspaceMemberLookup,
} from "../types/member.type";

const MEMBERS_CACHE_PREFIX = "members";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export function getWorkspaceMembers(workspaceId: string) {
  return apiRequest<ApiResponse<{ items: WorkspaceMember[] }>>(
    `/workspaces/${workspaceId}/members`,
  );
}

/**
 * Role cua chinh nguoi dung trong workspace, duoc goi lai o rat nhieu trang chi
 * de quyet dinh an/hien vai nut. Cache ngan han de khoi ton mot vong mang moi
 * lan chuyen trang; cac ham doi thanh vien ben duoi se xoa cache ngay.
 */
export function getMyWorkspaceRole(workspaceId: string) {
  return cachedRequest(`${MEMBERS_CACHE_PREFIX}:me:${workspaceId}`, () =>
    apiRequest<ApiResponse<MyWorkspaceRole>>(
      `/workspaces/${workspaceId}/members/me`,
    ),
  );
}

export function lookupWorkspaceMemberByEmail(
  workspaceId: string,
  email: string,
) {
  const params = new URLSearchParams({
    email,
  });

  return apiRequest<ApiResponse<WorkspaceMemberLookup>>(
    `/workspaces/${workspaceId}/members/lookup?${params.toString()}`,
  );
}

export async function addWorkspaceMember(
  workspaceId: string,
  payload: AddMemberPayload,
) {
  const response = await apiRequest<ApiResponse<{ member: WorkspaceMember }>>(
    `/workspaces/${workspaceId}/members`,
    {
      method: "POST",
      body: payload,
    },
  );

  invalidateCache(`${MEMBERS_CACHE_PREFIX}:me:${workspaceId}`);

  return response;
}

export async function changeWorkspaceMemberRole(
  workspaceId: string,
  memberId: string,
  payload: ChangeMemberRolePayload,
) {
  const response = await apiRequest<ApiResponse<{ member: WorkspaceMember }>>(
    `/workspaces/${workspaceId}/members/${memberId}/role`,
    {
      method: "PATCH",
      body: payload,
    },
  );

  invalidateCache(`${MEMBERS_CACHE_PREFIX}:me:${workspaceId}`);

  return response;
}

export async function removeWorkspaceMember(
  workspaceId: string,
  memberId: string,
) {
  const response = await apiRequest<ApiResponse<null>>(
    `/workspaces/${workspaceId}/members/${memberId}/remove`,
    {
      method: "PATCH",
    },
  );

  invalidateCache(`${MEMBERS_CACHE_PREFIX}:me:${workspaceId}`);

  return response;
}
