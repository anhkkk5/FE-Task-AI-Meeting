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
  keyCode: string;
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
