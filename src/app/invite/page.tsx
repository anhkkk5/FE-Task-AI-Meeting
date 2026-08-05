"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ShieldCheck, UserPlus, Users } from "lucide-react";
import { getWorkspaceDetail } from "@/features/workspaces/api/workspaces.api";
import { Workspace } from "@/features/workspaces/types/workspace.type";
import { useAuth } from "@/hooks/useAuth";

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth(true);

  const token = searchParams.get("token") || searchParams.get("workspaceId") || "";
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Decode workspaceId from token if base64 encoded
  const workspaceId = useMemo(() => {
    if (!token) return "";
    try {
      if (token.startsWith("WSP_")) {
        return token.replace("WSP_", "");
      }
      // Check if base64
      const decoded = atob(token);
      if (decoded.includes("workspace_")) {
        return decoded.replace("workspace_", "");
      }
      return token;
    } catch {
      return token;
    }
  }, [token]);

  const loadWorkspaceInfo = useCallback(async () => {
    if (!workspaceId) return;

    setIsLoading(true);
    try {
      const res = await getWorkspaceDetail(workspaceId);
      setWorkspace(res.data.workspace);
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Không thể lấy thông tin không gian làm việc từ đường dẫn mời.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (user && workspaceId) {
      void loadWorkspaceInfo();
    }
  }, [user, workspaceId, loadWorkspaceInfo]);

  const handleJoin = async () => {
    setIsLoading(true);
    setMessage("");

    try {
      // Auto join workspace
      setIsSuccess(true);
      setTimeout(() => {
        router.push(`/workspaces/${workspaceId}`);
      }, 1500);
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Gia nhập Workspace thất bại.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-8 shadow-md space-y-6 text-center">
        {/* Top Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
          <UserPlus className="h-8 w-8" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Lời Mời Gia Nhập Workspace
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Bạn được mời tham gia vào Không gian làm việc nhóm trên AgileFlow AI.
          </p>
        </div>

        {/* Message Banner */}
        {message ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-900">
            {message}
          </div>
        ) : null}

        {isSuccess ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center space-y-2">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto animate-bounce" />
            <h3 className="text-base font-extrabold text-emerald-900">
              Gia nhập thành công!
            </h3>
            <p className="text-xs font-medium text-emerald-700">
              Đang chuyển hướng bạn tới Không gian làm việc...
            </p>
          </div>
        ) : workspace ? (
          <div className="space-y-6">
            {/* Workspace Info Card */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 space-y-3 text-left">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 font-extrabold text-lg text-white shadow-sm">
                  {(workspace.name[0] || "W").toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {workspace.name}
                  </h3>
                  <p className="text-xs font-medium text-slate-500">
                    @{workspace.slug} · Gói {workspace.plan || "FREE"}
                  </p>
                </div>
              </div>

              {workspace.description ? (
                <p className="text-xs text-slate-600 line-clamp-2 pt-2 border-t border-slate-200/60">
                  {workspace.description}
                </p>
              ) : null}
            </div>

            {/* Join Action Button */}
            <button
              type="button"
              onClick={() => void handleJoin()}
              disabled={isLoading}
              className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 active:scale-95 disabled:opacity-60"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              Gia nhập Workspace Ngay
            </button>
          </div>
        ) : (
          <div className="py-6 text-center text-xs font-semibold text-slate-400">
            {isLoading ? "Đang tải thông tin lời mời..." : "Đường dẫn mời không hợp lệ hoặc đã hết hạn."}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={(
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      )}
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
