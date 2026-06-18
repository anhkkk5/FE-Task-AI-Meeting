export type WorkspaceRole =
  | "OWNER"
  | "SCRUM_MASTER"
  | "PROJECT_MANAGER"
  | "MEMBER"
  | "VIEWER";

export type WorkspaceMemberStatus = "ACTIVE" | "INVITED" | "REMOVED";

export type WorkspaceMember = {
  memberId: string;
  userId: string;
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: WorkspaceRole;
  status: WorkspaceMemberStatus;
  joinedAt: string | null;
};

export type MyWorkspaceRole = {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  status: WorkspaceMemberStatus;
};

export type AddMemberPayload = {
  email: string;
  role: Exclude<WorkspaceRole, "OWNER">;
};

export type ChangeMemberRolePayload = {
  role: Exclude<WorkspaceRole, "OWNER">;
};
