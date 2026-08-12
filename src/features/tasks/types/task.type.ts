export type TaskStatus =
  | "BACKLOG"
  | "TODO"
  | "IN_PROGRESS"
  | "REVIEW"
  | "DONE"
  | "CANCELLED";

export type TaskType = "EPIC" | "STORY" | "TASK" | "BUG" | "SUBTASK";
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
  labels: string[];
  acceptanceCriteria: string | null;
  status: TaskStatus;
  workflowStatusId: string | null;
  workflowStatusKey?: TaskStatus;
  taskType: TaskType;
  priority: TaskPriority;
  parentId: string | null;
  parent: { id: string; taskCode: string; title: string; taskType: TaskType } | null;
  children: Array<{ id: string; taskCode: string; title: string; taskType: TaskType; status: TaskStatus }>;
  childProgress: { total: number; done: number; percent: number } | null;
  assigneeId: string | null;
  assignee: TaskUserSummary | null;
  reporterId: string | null;
  reporter: TaskUserSummary | null;
  createdBy: string;
  creator: TaskUserSummary | null;
  sprint: TaskSprintSummary | null;
  dueDate: string | null;
  estimatedHours: number | null;
  storyPoints: number | null;
  completedAt: string | null;
  startedAt: string | null;
  createdAt: string;
  updatedAt?: string;
  isBlocked?: boolean;
  isBlocking?: boolean;
};

export type TaskActivityAction =
  | "CREATED"
  | "UPDATED"
  | "STATUS_CHANGED"
  | "ASSIGNED"
  | "SPRINT_MOVED"
  | "CANCELLED"
  | "DELETED"
  | "COMMENTED"
  | "COMMENT_UPDATED"
  | "COMMENT_DELETED";

export type TaskActivity = {
  id: string;
  action: TaskActivityAction;
  changes: Record<string, { from: unknown; to: unknown }> | null;
  actor: TaskUserSummary;
  createdAt: string;
};

export type TaskComment = {
  id: string;
  taskId: string;
  content: string;
  mentionedUserIds: string[];
  author: TaskUserSummary;
  createdAt: string;
  updatedAt: string;
};

export type TaskQuery = {
  sprintId?: string;
  status?: TaskStatus;
  assigneeId?: string;
  keyword?: string;
  page?: number;
  limit?: number;
  dependencyState?: "BLOCKED" | "BLOCKING";
  taskType?: TaskType;
  priority?: TaskPriority;
  parentId?: string;
  labels?: string[];
  acceptanceCriteria?: string;
  reporterId?: string;
};

export type CreateTaskPayload = {
  taskType?: TaskType;
  priority?: TaskPriority;
  parentId?: string;
  labels?: string[];
  acceptanceCriteria?: string;
  reporterId?: string;
  title: string;
  description?: string;
  sprintId?: string;
  assigneeId?: string;
  dueDate?: string;
  estimatedHours?: number;
  storyPoints?: number;
};

export type UpdateTaskPayload = {
  taskType?: TaskType;
  priority?: TaskPriority;
  parentId?: string | null;
  labels?: string[];
  acceptanceCriteria?: string;
  reporterId?: string | null;
  title?: string;
  description?: string;
  dueDate?: string;
  estimatedHours?: number;
  storyPoints?: number;
};

export type UpdateTaskStatusPayload = {
  status?: TaskStatus;
  workflowStatusId?: string;
  overrideBlocked?: boolean;
  overrideReason?: string;
};

export type TaskDependencyType = "BLOCKS" | "DEPENDS_ON" | "RELATES_TO" | "DUPLICATES";
export type TaskDependencyTask = Pick<Task, "id" | "taskCode" | "title" | "status" | "assigneeId">;
export type TaskDependency = {
  id: string;
  sourceTaskId: string;
  targetTaskId: string;
  type: TaskDependencyType;
  sourceTask: TaskDependencyTask;
  targetTask: TaskDependencyTask;
  createdAt: string;
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
