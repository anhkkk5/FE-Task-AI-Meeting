"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    router.replace(user ? (user.isSystemAdmin ? "/admin" : "/dashboard") : "/login");
  }, [isLoading, router, user]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#367ea2] border-t-transparent" />
    </div>
  );
}
