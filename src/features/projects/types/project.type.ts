export type ProjectStatus = "ACTIVE" | "ARCHIVED" | "COMPLETED";

export type Project = {
  id: string;
  workspaceId: string;
  name: string;
  keyCode: string;
  description: string | null;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  createdBy: string;
  /**
   * Chi co o endpoint chi tiet du an.
   *
   * Danh sach du an khong join sang bang users nen truong nay se undefined.
   */
  createdByUser?: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  } | null;
  createdAt: string;
  updatedAt?: string;
};

export type ProjectQuery = {
  status?: ProjectStatus;
  keyword?: string;
  page?: number;
  limit?: number;
};

export type CreateProjectPayload = {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
};

export type UpdateProjectPayload = {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
};
