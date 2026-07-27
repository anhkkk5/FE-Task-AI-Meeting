"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type HandoverReasonModalProps = {
  title: string;
  description: string;
  label: string;
  placeholder?: string;
  confirmLabel: string;
  /** To do dan: hanh dong tu choi dung mau canh bao, con lai dung brand. */
  tone?: "brand" | "danger";
  isSubmitting?: boolean;
  /** Bat buoc nhap ly do hay khong. */
  isReasonRequired?: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
};

/**
 * Hop thoai nhap ly do cho cac hanh dong ban giao.
 *
 * Thay cho `window.prompt`: prompt khong style duoc, bi mot so trinh duyet chan
 * va khong cho biet dang o buoc nao. Dung chung cho "yeu cau bo sung" va
 * "tu choi" nen doi giao dien chi phai sua mot cho.
 */
export function HandoverReasonModal({
  title,
  description,
  label,
  placeholder,
  confirmLabel,
  tone = "brand",
  isSubmitting = false,
  isReasonRequired = true,
  onCancel,
  onConfirm,
}: HandoverReasonModalProps) {
  const [reason, setReason] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus ngay vao o nhap de nguoi dung go duoc luon, khong phai click them.
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Esc de dong: thieu thao tac nay thi modal cam giac nhu bi khoa.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = reason.trim();
    if (isReasonRequired && !trimmed) return;
    onConfirm(trimmed);
  }

  const confirmClass =
    tone === "danger"
      ? "bg-rose-600 shadow-rose-600/20 hover:bg-rose-700"
      : "bg-brand-600 shadow-brand-600/20 hover:bg-brand-700";

  return (
    <div
      aria-labelledby="handover-reason-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      role="dialog"
    >
      <form
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        onSubmit={handleSubmit}
      >
        <h2
          className="text-lg font-bold text-slate-900"
          id="handover-reason-title"
        >
          {title}
        </h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>

        <label className="mt-5 grid gap-2 text-sm font-semibold text-slate-700">
          {label}
          <textarea
            className="min-h-28 resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal leading-relaxed text-slate-800 outline-none transition focus:border-brand-600"
            id="handover-reason-input"
            maxLength={2000}
            placeholder={placeholder}
            ref={textareaRef}
            required={isReasonRequired}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </label>

        <div className="mt-6 flex justify-end gap-2">
          <button
            className="h-10 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            id="handover-reason-cancel"
            type="button"
            onClick={onCancel}
          >
            Hủy
          </button>
          <button
            className={`h-10 rounded-xl px-4 text-sm font-bold text-white shadow-md transition disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none ${confirmClass}`}
            disabled={isSubmitting || (isReasonRequired && !reason.trim())}
            id="handover-reason-confirm"
            type="submit"
          >
            {isSubmitting ? "Đang xử lý..." : confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
