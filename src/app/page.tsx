"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getStoredAccessToken } from "@/features/auth/utils/token-storage";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = getStoredAccessToken();
    if (token) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#367ea2] border-t-transparent" />
    </div>
  );
}
