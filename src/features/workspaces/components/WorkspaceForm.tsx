"use client";

import { FormEvent, useState } from "react";

type WorkspaceFormProps = {
  initialName?: string;
  initialDescription?: string | null;
  submitLabel: string;
  onSubmit: (payload: { name: string; description?: string }) => Promise<void>;
};

export function WorkspaceForm({
  initialName = "",
  initialDescription = "",
  submitLabel,
  onSubmit,
}: WorkspaceFormProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({
        name,
        description,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {/* Tên Workspace */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
          <svg className="h-4 w-4 text-[#4F8EB0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Tên Workspace <span className="text-rose-500">*</span>
        </label>
        <input
          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-[#4F8EB0] focus:bg-white focus:ring-4 focus:ring-[#4F8EB0]/15"
          maxLength={100}
          minLength={2}
          required
          placeholder="Ví dụ: Công ty Công nghệ Acme"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      {/* Mô tả */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
          <svg className="h-4 w-4 text-[#4F8EB0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          Mô tả không gian làm việc
        </label>
        <textarea
          className="min-h-28 w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-[#4F8EB0] focus:bg-white focus:ring-4 focus:ring-[#4F8EB0]/15"
          maxLength={500}
          placeholder="Mục đích và đội ngũ hoạt động trong Workspace..."
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      {/* Button submit */}
      <div className="pt-2 flex items-center justify-end gap-3">
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#4F8EB0] px-6 text-sm font-bold text-white shadow-md shadow-[#4F8EB0]/25 transition-all hover:bg-[#3d7290] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Đang lưu...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {submitLabel}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
