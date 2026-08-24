"use client";

import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";

export type AppDialogTone = "default" | "danger" | "warning" | "success";

export type ConfirmDialogOptions = {
  title?: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: AppDialogTone;
};

type ConfirmRequest = ConfirmDialogOptions & {
  resolve: (confirmed: boolean) => void;
};

type NoticeRequest = {
  title?: string;
  description: string;
  tone?: AppDialogTone;
};

const CONFIRM_EVENT = "agileflow:confirm";
const NOTICE_EVENT = "agileflow:notice";

export function confirmAction(
  options: ConfirmDialogOptions | string,
): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);

  return new Promise((resolve) => {
    window.dispatchEvent(
      new CustomEvent<ConfirmRequest>(CONFIRM_EVENT, {
        detail: {
          ...(typeof options === "string"
            ? { description: options }
            : options),
          resolve,
        },
      }),
    );
  });
}

export function showAppNotice(
  options: NoticeRequest | string,
): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<NoticeRequest>(NOTICE_EVENT, {
      detail:
        typeof options === "string" ? { description: options } : options,
    }),
  );
}

function DialogIcon({ tone }: { tone: AppDialogTone }) {
  const className = "h-6 w-6";
  if (tone === "danger") return <XCircle className={`${className} text-rose-600`} />;
  if (tone === "warning") return <AlertTriangle className={`${className} text-amber-600`} />;
  if (tone === "success") return <CheckCircle2 className={`${className} text-emerald-600`} />;
  return <Info className={`${className} text-blue-600`} />;
}

export function AppDialogProvider({ children }: { children: ReactNode }) {
  const [confirmation, setConfirmation] = useState<ConfirmRequest | null>(null);
  const [notice, setNotice] = useState<NoticeRequest | null>(null);

  useEffect(() => {
    const onConfirm = (event: Event) => {
      setConfirmation((event as CustomEvent<ConfirmRequest>).detail);
    };
    const onNotice = (event: Event) => {
      setNotice((event as CustomEvent<NoticeRequest>).detail);
    };
    window.addEventListener(CONFIRM_EVENT, onConfirm);
    window.addEventListener(NOTICE_EVENT, onNotice);
    return () => {
      window.removeEventListener(CONFIRM_EVENT, onConfirm);
      window.removeEventListener(NOTICE_EVENT, onNotice);
    };
  }, []);

  const active = confirmation ?? notice;
  const tone = active?.tone ?? "default";

  function closeConfirmation(value: boolean) {
    confirmation?.resolve(value);
    setConfirmation(null);
  }

  return (
    <>
      {children}
      {active ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/35 px-4 py-8 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target !== event.currentTarget) return;
            if (confirmation) closeConfirmation(false);
            else setNotice(null);
          }}
          role="dialog"
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start gap-3 px-6 pb-4 pt-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50">
                <DialogIcon tone={tone} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-slate-900">
                  {active.title ?? (confirmation ? "Xác nhận thao tác" : "Thông báo")}
                </h2>
                <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">
                  {active.description}
                </p>
              </div>
              <button
                aria-label="Đóng"
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                onClick={() => confirmation ? closeConfirmation(false) : setNotice(null)}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
              {confirmation ? (
                <>
                  <button
                    className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    onClick={() => closeConfirmation(false)}
                    type="button"
                  >
                    {confirmation.cancelLabel ?? "Hủy"}
                  </button>
                  <button
                    className={`h-10 rounded-lg px-4 text-sm font-semibold text-white shadow-sm transition ${
                      tone === "danger"
                        ? "bg-rose-600 hover:bg-rose-700"
                        : tone === "warning"
                          ? "bg-amber-600 hover:bg-amber-700"
                          : "bg-blue-600 hover:bg-blue-700"
                    }`}
                    onClick={() => closeConfirmation(true)}
                    type="button"
                  >
                    {confirmation.confirmLabel ?? "Xác nhận"}
                  </button>
                </>
              ) : (
                <button
                  className="h-10 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
                  onClick={() => setNotice(null)}
                  type="button"
                >
                  Đã hiểu
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
