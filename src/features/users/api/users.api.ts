import { apiRequest } from "@/lib/api/client";
import {
  ChangePasswordPayload,
  ChangePasswordResponse,
  UpdateProfilePayload,
  UserProfileResponse,
} from "../types/user-profile.type";

export function getProfile() {
  return apiRequest<UserProfileResponse>("/users/me", {
    method: "GET",
  });
}

export function updateProfile(payload: UpdateProfilePayload) {
  return apiRequest<UserProfileResponse>("/users/me", {
    method: "PATCH",
    body: payload,
  });
}

export function changePassword(payload: ChangePasswordPayload) {
  return apiRequest<ChangePasswordResponse>("/users/me/password", {
    method: "PATCH",
    body: payload,
  });
}
