"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getMe, logout } from "@/features/auth/api/auth.api";
import {
  clearAccessToken,
  getStoredAccessToken,
  saveAccessToken,
} from "@/features/auth/utils/token-storage";
import { ApiError } from "@/lib/api/client";
import { clearRequestCache } from "@/lib/api/request-cache";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  jobTitle?: string | null;
  isSystemAdmin?: boolean;
  mfaEnabled?: boolean;
};

export type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  /** Phien da duoc kiem tra xong it nhat mot lan, du ket qua la co hay khong co user. */
  isResolved: boolean;
  loginUser: (token: string, profile: AuthUser) => void;
  logoutUser: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Nguon su that duy nhat cho phien dang nhap.
 *
 * Truoc day moi component goi useAuth deu tu fetch `/auth/me` bang state rieng,
 * nen mot lan chuyen trang phat sinh it nhat 2 request giong nhau (page va
 * AppShell), va moi lan chuyen trang lai goi lai tu dau. Voi backend o xa
 * (~260ms moi vong), rieng buoc nay da chan duong tai du lieu cua ca trang.
 *
 * Provider nay dat o root layout nen khong bi unmount khi doi route: `/auth/me`
 * chi chay mot lan cho ca session, cac trang sau do doc user tu context.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResolved, setIsResolved] = useState(false);

  // Gom cac lan goi trung thoi diem vao mot request. Nhieu component mount cung
  // luc se cung cho chung mot promise thay vi ai cung goi mang mot lan.
  const inFlightRef = useRef<Promise<void> | null>(null);

  // Da tung biet danh tinh nguoi dung hay chua. Dung de phan biet "token doi vi
  // vua luan chuyen" voi "token doi vi vua dang nhap/dang xuat".
  const hasIdentityRef = useRef(false);

  const fetchUser = useCallback(async () => {
    if (inFlightRef.current) {
      return inFlightRef.current;
    }

    const token = getStoredAccessToken();

    if (!token) {
      setUser(null);
      setIsLoading(false);
      setIsResolved(true);
      return;
    }

    const request = (async () => {
      setIsLoading(true);

      try {
        const response = await getMe();

        if (response.success && response.data) {
          setUser(response.data);
          hasIdentityRef.current = true;
        } else {
          setUser(null);
          hasIdentityRef.current = false;
        }
      } catch (error) {
        const isSessionInvalid =
          error instanceof ApiError &&
          (error.status === 401 || error.status === 403);

        if (isSessionInvalid) {
          clearAccessToken();
          setUser(null);
          hasIdentityRef.current = false;
        } else {
          // Loi mang tam thoi khong nen day nguoi dung ra trang login vi token
          // van con hieu luc. Giu nguyen user hien tai neu da co.
          console.warn("Không thể khôi phục phiên đăng nhập:", error);
        }
      } finally {
        setIsLoading(false);
        setIsResolved(true);
        inFlightRef.current = null;
      }
    })();

    inFlightRef.current = request;
    return request;
  }, []);

  useEffect(() => {
    void fetchUser();

    /*
     * Chi dong bo lai khi trang thai dang nhap THAT SU doi.
     *
     * Su kien nay con duoc ban ra moi lan API client tu dong lam moi access
     * token. Truoc day moi lan nhu vay keo theo mot request `/auth/me` nua, du
     * danh tinh nguoi dung khong he doi khi token chi duoc luan chuyen.
     */
    const handleAuthChange = () => {
      const hasToken = Boolean(getStoredAccessToken());

      if (hasToken && hasIdentityRef.current) {
        return;
      }

      if (!hasToken) {
        hasIdentityRef.current = false;
      }

      void fetchUser();
    };

    window.addEventListener("agile_ai_auth_changed", handleAuthChange);
    return () => {
      window.removeEventListener("agile_ai_auth_changed", handleAuthChange);
    };
  }, [fetchUser]);

  const loginUser = useCallback((token: string, profile: AuthUser) => {
    // Login da tra ve profile nen set truc tiep, khong can goi lai `/auth/me`.
    setUser(profile);
    setIsLoading(false);
    setIsResolved(true);
    // Danh dau truoc khi luu token, vi saveAccessToken ban ra su kien auth doi.
    hasIdentityRef.current = true;
    saveAccessToken(token);
  }, []);

  const logoutUser = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      clearAccessToken();
      setUser(null);
      setIsResolved(true);
      hasIdentityRef.current = false;
      // Xoa cache de nguoi dang nhap tiep theo tren cung may khong doc duoc
      // danh sach workspace hay role cua phien truoc.
      clearRequestCache();
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isResolved,
      loginUser,
      logoutUser,
      refreshUser: fetchUser,
    }),
    [user, isLoading, isResolved, loginUser, logoutUser, fetchUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext phải được dùng bên trong AuthProvider.");
  }

  return context;
}
