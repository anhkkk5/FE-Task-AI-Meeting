export type SprintStatus = "PLANNED" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export type Sprint = {
  id: string;
  projectId: string;
  name: string;
  goal: string | null;
  status: SprintStatus;
  startDate: string;
  endDate: string;
  startedAt: string | null;
  completedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
};

export type SprintQuery = {
  status?: SprintStatus;
  keyword?: string;
  page?: number;
  limit?: number;
};

export type CreateSprintPayload = {
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
};

export type UpdateSprintPayload = {
  name?: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
};
