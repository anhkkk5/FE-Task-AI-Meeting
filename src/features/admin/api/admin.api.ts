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
  status: string;
  ownerId: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
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
