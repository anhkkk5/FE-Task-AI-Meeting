import { apiRequest } from "@/lib/api/client";
import { WorkspaceDashboard, WorkspacesOverview } from "../types/stats.type";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

/** Số liệu tổng hợp cho trang danh sách workspace. */
export function getWorkspacesOverview() {
  return apiRequest<ApiResponse<WorkspacesOverview>>("/stats/workspaces");
}

/** Số liệu chi tiết cho dashboard của một workspace. */
export function getWorkspaceDashboard(workspaceId: string) {
  return apiRequest<ApiResponse<WorkspaceDashboard>>(
    `/stats/workspaces/${workspaceId}/dashboard`,
  );
}
