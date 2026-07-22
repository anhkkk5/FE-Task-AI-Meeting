"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getMe, logout } from "@/features/auth/api/auth.api";
import { ApiError } from "@/lib/api/client";
import {
  clearAccessToken,
  getStoredAccessToken,
  saveAccessToken,
} from "@/features/auth/utils/token-storage";

type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  jobTitle?: string | null;
};

export function useAuth(requireAuth = true) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = getStoredAccessToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      if (requireAuth && pathname !== "/login" && pathname !== "/register") {
        router.push("/login");
      }
      return;
    }

    try {
      setIsLoading(true);
      const res = await getMe();
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        throw new Error("Failed to fetch user profile");
      }
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) {
        console.warn("Không thể khôi phục phiên đăng nhập:", error);
      }
      clearAccessToken();
      setUser(null);
      if (requireAuth) {
        router.replace("/login");
      }
    } finally {
      setIsLoading(false);
    }
  }, [requireAuth, router, pathname]);

  useEffect(() => {
    // Lắng nghe sự kiện thay đổi auth
    const handleAuthChange = () => {
      void fetchUser();
    };

    void fetchUser();

    window.addEventListener("agile_ai_auth_changed", handleAuthChange);
    return () => {
      window.removeEventListener("agile_ai_auth_changed", handleAuthChange);
    };
  }, [fetchUser]);

  const loginUser = useCallback((token: string, userProfile: UserProfile) => {
    saveAccessToken(token);
    setUser(userProfile);
  }, []);

  const logoutUser = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      clearAccessToken();
      setUser(null);
      router.push("/login");
    }
  }, [router]);

  return {
    user,
    isLoading,
    loginUser,
    logoutUser,
    refreshUser: fetchUser,
  };
}
