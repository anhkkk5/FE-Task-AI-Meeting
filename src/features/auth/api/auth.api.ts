import { apiRequest } from "@/lib/api/client";

type PublicUser = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  jobTitle?: string | null;
};

type AuthResponse = {
  success: boolean;
  message: string;
  data: {
    user: PublicUser;
    tokens: {
      accessToken: string;
    };
  };
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  fullName: string;
  password: string;
};

export function login(payload: LoginPayload) {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: payload,
    skipAuthRefresh: true,
  });
}

export function register(payload: RegisterPayload) {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: payload,
    skipAuthRefresh: true,
  });
}

export function refreshSession() {
  return apiRequest<AuthResponse>("/auth/refresh", {
    method: "POST",
    skipAuthRefresh: true,
  });
}

export function logout() {
  return apiRequest<{ success: boolean; message: string; data: null }>(
    "/auth/logout",
    {
      method: "POST",
      skipAuthRefresh: true,
    },
  );
}

export type GetMeResponse = {
  success: boolean;
  message: string;
  data: PublicUser;
};

export function getMe() {
  return apiRequest<GetMeResponse>("/auth/me");
}


