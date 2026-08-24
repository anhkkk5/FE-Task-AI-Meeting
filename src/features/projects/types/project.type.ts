export type ProjectStatus = "ACTIVE" | "ARCHIVED" | "COMPLETED";
export type WorkflowStatusKey = "BACKLOG" | "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "CANCELLED";
export type WorkflowStatusConfig = { workflowStatusId?: string; key: WorkflowStatusKey; label: string; color: string; category: "TO_DO" | "IN_PROGRESS" | "DONE"; order: number; enabled: boolean };
export type WorkflowTransitionConfig = { from: WorkflowStatusKey; to: WorkflowStatusKey; roles?: string[] };

export type Project = {
  id: string;
  workspaceId: string;
  name: string;
  keyCode: string;
  description: string | null;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  workflowStatuses: WorkflowStatusConfig[];
  workflowTransitions: WorkflowTransitionConfig[];
  workflowTemplateId: string | null;
  createdBy: string;
  totalTasks?: number;
  completedTasks?: number;
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
  workflowStatuses?: WorkflowStatusConfig[];
  workflowTransitions?: WorkflowTransitionConfig[];
};

export type UpdateProjectPayload = {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  workflowStatuses?: WorkflowStatusConfig[];
  workflowTransitions?: WorkflowTransitionConfig[];
};
