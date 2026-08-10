import { apiRequest } from "@/lib/api/client";

type PublicUser = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  jobTitle?: string | null;
  isSystemAdmin?: boolean;
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
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: payload,
    skipAuthRefresh: true,
  });
}

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


