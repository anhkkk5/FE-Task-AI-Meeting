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
