import { apiRequest } from "@/lib/api/client";

type PublicUser = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  jobTitle?: string | null;
  isSystemAdmin?: boolean;
  mfaEnabled?: boolean;
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
export type LoginResponse = AuthResponse | { success: true; message: string; data: { mfaRequired: true; email: string; otpExpiresInSeconds: number } };

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  fullName: string;
  password: string;
};

/**
 * Phản hồi của bước 1: chỉ xác nhận đã gửi OTP, chưa có tài khoản và chưa có token.
 */
export type OtpChallengeResponse = {
  success: boolean;
  message: string;
  data: {
    email: string;
    otpExpiresInSeconds: number;
    resendAfterSeconds: number;
  };
};

export type VerifyOtpPayload = {
  email: string;
  otp: string;
};

export function login(payload: LoginPayload) {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: payload,
    skipAuthRefresh: true,
  });
}

export function forgotPassword(email: string) { return apiRequest<OtpChallengeResponse>("/auth/forgot-password", { method: "POST", body: { email }, skipAuthRefresh: true }); }
export function resetPassword(payload: { email: string; otp: string; newPassword: string }) { return apiRequest<{ success: boolean; message: string; data: null }>("/auth/reset-password", { method: "POST", body: payload, skipAuthRefresh: true }); }
export function verifyMfa(payload: { email: string; otp: string }) { return apiRequest<AuthResponse>("/auth/mfa/verify", { method: "POST", body: payload, skipAuthRefresh: true }); }
export function setMfa(enabled: boolean) { return apiRequest<GetMeResponse>("/auth/mfa", { method: "PATCH", body: { enabled } }); }

/** Bước 1 của đăng ký: gửi mã OTP tới email, chưa tạo tài khoản. */
export function register(payload: RegisterPayload) {
  return apiRequest<OtpChallengeResponse>("/auth/register", {
    method: "POST",
    body: payload,
    skipAuthRefresh: true,
  });
}

/** Bước 2 của đăng ký: OTP đúng thì tài khoản được tạo và trả về token. */
export function verifyRegistrationOtp(payload: VerifyOtpPayload) {
  return apiRequest<AuthResponse>("/auth/verify-otp", {
    method: "POST",
    body: payload,
    skipAuthRefresh: true,
  });
}

export function resendRegistrationOtp(email: string) {
  return apiRequest<OtpChallengeResponse>("/auth/resend-otp", {
    method: "POST",
    body: { email },
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
export type AuthSession = { id: string; current: boolean; userAgent: string | null; ipAddress: string | null; lastUsedAt: string; createdAt: string; expiresAt: string; revokedAt: string | null };
export function getSessions() { return apiRequest<{ success: boolean; message: string; data: { items: AuthSession[] } }>("/auth/sessions"); }
export function revokeSession(sessionId: string) { return apiRequest<{ success: boolean; message: string; data: null }>(`/auth/sessions/${sessionId}`, { method: "DELETE" }); }
export function revokeOtherSessions() { return apiRequest<{ success: boolean; message: string; data: null }>("/auth/sessions/others", { method: "DELETE" }); }


