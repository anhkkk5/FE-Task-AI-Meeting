import {
  clearAccessToken,
  getStoredAccessToken,
  saveAccessToken,
} from "@/features/auth/utils/token-storage";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const REQUEST_TIMEOUT_MS = 10000;

type ApiOptions = {
  method?: "GET" | "POST" | "PATCH";
  token?: string;
  body?: unknown;
  skipAuthRefresh?: boolean;
};

export async function apiRequest<T>(path: string, options: ApiOptions = {}) {
  const token = options.token || getStoredAccessToken();
  let response = await fetchApi(path, options, token);

  if (response.status === 401 && !options.skipAuthRefresh) {
    const refreshedToken = await refreshAccessToken();

    if (refreshedToken) {
      response = await fetchApi(path, options, refreshedToken);
    }
  }

  const payload = await readJson<T & { message?: string }>(response);

  if (!response.ok) {
    throw new Error(payload.message || "Request failed");
  }

  return payload;
}

async function refreshAccessToken() {
  const response = await fetchApi("/auth/refresh", {
    method: "POST",
    skipAuthRefresh: true,
  });

  if (!response.ok) {
    clearAccessToken();
    return "";
  }

  const payload = await readJson<{
    data?: {
      tokens?: {
        accessToken?: string;
      };
    };
  }>(response);
  const accessToken = payload.data?.tokens?.accessToken ?? "";

  if (accessToken) {
    saveAccessToken(accessToken);
  }

  return accessToken;
}

async function fetchApi(path: string, options: ApiOptions, token?: string) {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );

  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(
        "Ket noi API qua lau. Hay kiem tra backend co dang chay va dien thoai co truy cap duoc cong 3002 khong.",
      );
    }

    throw new Error(
      "Khong ket noi duoc backend. Hay thu mo API health tren dien thoai va kiem tra Windows Firewall/port 3002.",
    );
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

async function readJson<T>(response: Response) {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}
