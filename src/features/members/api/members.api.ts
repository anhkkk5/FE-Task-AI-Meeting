import { apiRequest } from "@/lib/api/client";
import {
  AddMemberPayload,
  ChangeMemberRolePayload,
  MyWorkspaceRole,
  WorkspaceMember,
} from "../types/member.type";

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

export function getMyWorkspaceRole(workspaceId: string) {
  return apiRequest<ApiResponse<MyWorkspaceRole>>(
    `/workspaces/${workspaceId}/members/me`,
  );
}

export function addWorkspaceMember(
  workspaceId: string,
  payload: AddMemberPayload,
) {
  return apiRequest<ApiResponse<{ member: WorkspaceMember }>>(
    `/workspaces/${workspaceId}/members`,
    {
      method: "POST",
      body: payload,
    },
  );
}

export function changeWorkspaceMemberRole(
  workspaceId: string,
  memberId: string,
  payload: ChangeMemberRolePayload,
) {
  return apiRequest<ApiResponse<{ member: WorkspaceMember }>>(
    `/workspaces/${workspaceId}/members/${memberId}/role`,
    {
      method: "PATCH",
      body: payload,
    },
  );
}

export function removeWorkspaceMember(
  workspaceId: string,
  memberId: string,
) {
  return apiRequest<ApiResponse<null>>(
    `/workspaces/${workspaceId}/members/${memberId}/remove`,
    {
      method: "PATCH",
    },
  );
}
