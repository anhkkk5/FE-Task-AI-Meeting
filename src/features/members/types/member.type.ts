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

export type WorkspaceMemberLookupUser = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  status: string;
};

export type WorkspaceMemberLookup = {
  user: WorkspaceMemberLookupUser | null;
  existingMember: WorkspaceMember | null;
  canAdd: boolean;
  reason:
    | "USER_NOT_FOUND"
    | "USER_NOT_ACTIVE"
    | "ALREADY_ACTIVE_MEMBER"
    | "REMOVED_MEMBER_CAN_BE_REACTIVATED"
    | null;
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
