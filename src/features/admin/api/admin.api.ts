import { apiRequest } from "@/lib/api/client";

// ===== Types =====
export type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  status: "active" | "inactive";
  isSystemAdmin: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminWorkspace = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  plan: string;
  status: "ACTIVE" | "ARCHIVED";
  ownerId: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminWorkspaceMember = {
  id: string;
  userId: string;
  role: "OWNER" | "PROJECT_MANAGER" | "SCRUM_MASTER" | "MEMBER" | "VIEWER";
  status: "ACTIVE" | "INACTIVE";
  joinedAt: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  jobTitle: string | null;
};

export type AdminWorkspaceProject = {
  id: string;
  name: string;
  keyCode: string;
  status: string;
  createdBy: string;
  createdAt: string;
  creatorName: string | null;
  sprintCount: number;
  taskCount: number;
};

export type AdminWorkspaceDetail = {
  workspace: AdminWorkspace & {
    owner: { id: string; email: string; full_name: string; avatar_url: string | null; job_title: string | null } | null;
  };
  members: AdminWorkspaceMember[];
  projects: AdminWorkspaceProject[];
  totals: { memberCount: number; projectCount: number; sprintCount: number; taskCount: number };
};

export type SystemStats = {
  users: {
    total: number;
    active: number;
    inactive: number;
    admins: number;
    newLast30Days: number;
  };
  workspaces: {
    total: number;
    active: number;
    archived: number;
    newLast30Days: number;
  };
  projects: { total: number };
  tasks: { total: number };
  meetings: { total: number };
};

type PaginatedData<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

// ===== System Stats =====
export function getSystemStats() {
  return apiRequest<ApiResponse<SystemStats>>("/admin/stats");
}

export type ObservabilitySummary = { windowHours: number; totals: { events: number; failures: number; slowApis: number; failedJobs: number; failedEmails: number }; ai: { calls: number; inputTokens: number; outputTokens: number; estimatedCostUsd: number; averageLatencyMs: number }; recentFailures: Array<{ id: string; kind: string; operation: string; error: string | null; createdAt: string }> };
export type AdminAuditItem = { id: string; actorId: string; action: string; targetType: string; targetId: string; before: Record<string, unknown> | null; after: Record<string, unknown> | null; createdAt: string };
export function getObservability(hours = 24) { return apiRequest<ApiResponse<ObservabilitySummary>>(`/admin/observability?hours=${hours}`); }
export function getAdminAuditLogs() { return apiRequest<ApiResponse<{ items: AdminAuditItem[]; total: number }>>("/admin/audit-logs"); }

// ===== User Management =====
export function getAdminUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);

  const qs = query.toString();
  return apiRequest<ApiResponse<PaginatedData<AdminUser>>>(
    `/admin/users${qs ? `?${qs}` : ""}`,
  );
}

export function toggleAdminUserStatus(userId: string) {
  return apiRequest<ApiResponse<AdminUser>>(
    `/admin/users/${userId}/status`,
    { method: "PATCH" },
  );
}

export function toggleAdminRole(userId: string) {
  return apiRequest<ApiResponse<AdminUser>>(
    `/admin/users/${userId}/admin`,
    { method: "PATCH" },
  );
}

// ===== Workspace Management =====
export function getAdminWorkspaces(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);

  const qs = query.toString();
  return apiRequest<ApiResponse<PaginatedData<AdminWorkspace>>>(
    `/admin/workspaces${qs ? `?${qs}` : ""}`,
  );
}

export function toggleWorkspaceStatus(workspaceId: string) {
  return apiRequest<ApiResponse<{ id: string; status: string }>>(
    `/admin/workspaces/${workspaceId}/status`,
    { method: "PATCH" },
  );
}

export function getAdminWorkspaceDetail(workspaceId: string) {
  return apiRequest<ApiResponse<AdminWorkspaceDetail>>(`/admin/workspaces/${workspaceId}`);
}

export function createAdminWorkspace(payload: { name: string; description?: string; ownerId?: string }) {
  return apiRequest<ApiResponse<AdminWorkspaceDetail>>("/admin/workspaces", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminWorkspace(
  workspaceId: string,
  payload: { name?: string; description?: string; plan?: string },
) {
  return apiRequest<ApiResponse<AdminWorkspaceDetail>>(`/admin/workspaces/${workspaceId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
