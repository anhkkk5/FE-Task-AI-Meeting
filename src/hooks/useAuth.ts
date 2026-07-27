"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthContext } from "@/features/auth/components/AuthProvider";

const publicPaths = new Set(["/login", "/register"]);

/**
 * Doc phien dang nhap dung chung tu AuthProvider.
 *
 * Chu ky ham giu nguyen nhu ban tu fetch truoc day de cac trang dang dung khong
 * phai sua, nhung ben trong khong con goi `/auth/me` nua: provider o root layout
 * da goi mot lan cho ca session. Nho vay chuyen trang khong con phai cho vong
 * xac thuc truoc khi bat dau tai du lieu.
 */
export function useAuth(requireAuth = true) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isResolved, loginUser, logoutUser, refreshUser } =
    useAuthContext();

  useEffect(() => {
    // Chi dieu huong khi da biet chac ket qua kiem tra phien, tranh day nguoi
    // dung ra trang login trong luc request `/auth/me` con dang bay.
    if (!requireAuth || !isResolved || user) {
      return;
    }

    if (!publicPaths.has(pathname)) {
      router.replace("/login");
    }
  }, [requireAuth, isResolved, user, pathname, router]);

  return {
    user,
    isLoading,
    loginUser,
    logoutUser,
    refreshUser,
  };
}
