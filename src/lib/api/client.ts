import {
  clearAccessToken,
  getStoredAccessToken,
  saveAccessToken,
} from "@/features/auth/utils/token-storage";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

type ApiOptions = {
  method?: "GET" | "POST" | "PATCH";
  token?: string;
  body?: unknown;
  skipAuthRefresh?: boolean;
};

export async function apiRequest<T>(path: string, options: ApiOptions = {}) {
  const token = options.token || getStoredAccessToken();
  let response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (response.status === 401 && !options.skipAuthRefresh) {
    const refreshedToken = await refreshAccessToken();

    if (refreshedToken) {
      response = await fetch(`${API_BASE_URL}${path}`, {
        method: options.method ?? "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${refreshedToken}`,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        cache: "no-store",
      });
    }
  }

  const payload = (await response.json()) as T & {
    message?: string;
  };

  if (!response.ok) {
    throw new Error(payload.message || "Request failed");
  }

  return payload;
}

async function refreshAccessToken() {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    clearAccessToken();
    return "";
  }

  const payload = (await response.json()) as {
    data?: {
      tokens?: {
        accessToken?: string;
      };
    };
  };
  const accessToken = payload.data?.tokens?.accessToken ?? "";

  if (accessToken) {
    saveAccessToken(accessToken);
  }

  return accessToken;
}
