export type UserProfileDetail = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  phoneNumber: string | null;
  jobTitle: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type UpdateProfilePayload = {
  fullName?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  jobTitle?: string;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export type UserProfileResponse = {
  success: boolean;
  message: string;
  data: UserProfileDetail;
};

export type ChangePasswordResponse = {
  success: boolean;
  message: string;
  data: null;
};

export type AiResponseStyle = "CONCISE" | "BALANCED" | "DETAILED";
export type AiTone = "PROFESSIONAL" | "DIRECT" | "SUPPORTIVE";
export type AiFocusArea =
  | "PROGRESS"
  | "BLOCKERS"
  | "DEADLINES"
  | "DECISIONS"
  | "ACTION_ITEMS";

export type AiUserPreferences = {
  responseStyle: AiResponseStyle;
  tone: AiTone;
  focusAreas: AiFocusArea[];
};

export type AiUserPreferencesResponse = {
  success: boolean;
  message: string;
  data: AiUserPreferences;
};

export type UpdateAiUserPreferencesPayload = Partial<AiUserPreferences>;
