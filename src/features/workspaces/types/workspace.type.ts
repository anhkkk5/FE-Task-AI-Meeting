export type WorkspaceStatus = "ACTIVE" | "ARCHIVED";
export type WorkspacePlan = "FREE" | "PRO" | "ENTERPRISE";
export type WorkspaceRole =
  | "OWNER"
  | "SCRUM_MASTER"
  | "PROJECT_MANAGER"
  | "MEMBER"
  | "VIEWER";

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  ownerId: string;
  plan: WorkspacePlan;
  status: WorkspaceStatus;
  role?: WorkspaceRole;
  myRole?: WorkspaceRole;
  createdAt: string;
  updatedAt: string;
};

export type CreateWorkspacePayload = {
  name: string;
  description?: string;
};

export type UpdateWorkspacePayload = {
  name?: string;
  description?: string;
};
