export type TaskStatus =
  | "BACKLOG"
  | "TODO"
  | "IN_PROGRESS"
  | "REVIEW"
  | "DONE"
  | "CANCELLED";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type TaskUserSummary = {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
};

export type TaskSprintSummary = {
  id: string;
  name: string;
  status: string;
};

export type Task = {
  id: string;
  projectId: string;
  sprintId: string | null;
  taskCode: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  assignee: TaskUserSummary | null;
  createdBy: string;
  creator: TaskUserSummary | null;
  sprint: TaskSprintSummary | null;
  dueDate: string | null;
  estimatedHours: number | null;
  storyPoints: number | null;
  createdAt: string;
  updatedAt?: string;
};

export type TaskQuery = {
  sprintId?: string;
  status?: TaskStatus;
  assigneeId?: string;
  priority?: TaskPriority;
  keyword?: string;
  page?: number;
  limit?: number;
};

export type CreateTaskPayload = {
  title: string;
  description?: string;
  sprintId?: string;
  assigneeId?: string;
  priority?: TaskPriority;
  dueDate?: string;
  estimatedHours?: number;
  storyPoints?: number;
};

export type UpdateTaskPayload = {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
  estimatedHours?: number;
  storyPoints?: number;
};

export type UpdateTaskStatusPayload = {
  status: TaskStatus;
};

export type AssignTaskPayload = {
  assigneeId: string | null;
};

export type MoveTaskSprintPayload = {
  sprintId: string | null;
};

export type TaskImportItem = {
  rowNumber?: number;
  title: string;
  description?: string | null;
  sprintId?: string | null;
  sprintName?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  assigneeEmail?: string | null;
  dueDate?: string | null;
  estimatedHours?: number | null;
  storyPoints?: number | null;
};

export type TaskImportPreviewRow = {
  rowNumber: number;
  valid: boolean;
  errors: string[];
  data: TaskImportItem;
  raw: Record<string, string>;
};

export type TaskImportPreviewSummary = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
};
