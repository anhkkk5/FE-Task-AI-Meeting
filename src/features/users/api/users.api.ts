import { apiRequest } from "@/lib/api/client";
import {
  ChangePasswordPayload,
  ChangePasswordResponse,
  AiUserPreferencesResponse,
  UpdateAiUserPreferencesPayload,
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

export function getAiUserPreferences() {
  return apiRequest<AiUserPreferencesResponse>("/users/me/ai-preferences", {
    method: "GET",
  });
}

export function updateAiUserPreferences(
  payload: UpdateAiUserPreferencesPayload,
) {
  return apiRequest<AiUserPreferencesResponse>("/users/me/ai-preferences", {
    method: "PATCH",
    body: payload,
  });
}

export function resetAiUserPreferences() {
  return apiRequest<AiUserPreferencesResponse>("/users/me/ai-preferences", {
    method: "DELETE",
  });
}
