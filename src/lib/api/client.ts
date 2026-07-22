import {
  clearAccessToken,
  getStoredAccessToken,
  saveAccessToken,
} from "@/features/auth/utils/token-storage";
import { resolveRuntimeUrl } from "@/lib/api/runtime-url";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";

const REQUEST_TIMEOUT_MS = 10000;
let refreshPromise: Promise<string> | null = null;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  token?: string;
  body?: unknown;
  skipAuthRefresh?: boolean;
};

export async function apiRequest<T>(path: string, options: ApiOptions = {}) {
  const token = options.token || getStoredAccessToken();
  let response = await fetchApi(path, options, token);

  if (response.status === 401 && !options.skipAuthRefresh) {
    const refreshedToken = await getRefreshedAccessToken();

    if (refreshedToken) {
      response = await fetchApi(path, options, refreshedToken);
    }
  }

  const payload = await readJson<T & { message?: string }>(response);

  if (!response.ok) {
    throw new ApiError(payload.message || "Yêu cầu không thành công.", response.status);
  }

  return payload;
}

export async function apiBlob(path: string, options: ApiOptions = {}) {
  const token = options.token || getStoredAccessToken();
  let response = await fetchApi(path, options, token);

  if (response.status === 401 && !options.skipAuthRefresh) {
    const refreshedToken = await getRefreshedAccessToken();

    if (refreshedToken) {
      response = await fetchApi(path, options, refreshedToken);
    }
  }

  if (!response.ok) {
    const payload = await readJson<{ message?: string }>(response);
    throw new ApiError(payload.message || "Yêu cầu không thành công.", response.status);
  }

  return response.blob();
}

function getRefreshedAccessToken() {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
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
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  const requestBody =
    options.body === undefined
      ? undefined
      : isFormData
        ? (options.body as BodyInit)
        : JSON.stringify(options.body);

  try {
    return await fetch(`${resolveRuntimeUrl(API_BASE_URL)}${path}`, {
      method: options.method ?? "GET",
      credentials: "include",
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: requestBody,
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(
        "Kết nối API quá lâu. Hãy kiểm tra backend có đang chạy và thiết bị có truy cập được cổng 3002 không.",
      );
    }

    throw new Error(
      "Không kết nối được backend. Hãy thử mở API health trên thiết bị và kiểm tra Windows Firewall/cổng 3002.",
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
