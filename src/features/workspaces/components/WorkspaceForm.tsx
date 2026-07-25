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
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Name
        <input
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
          maxLength={100}
          minLength={2}
          required
          placeholder="e.g. Acme Corp"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Description
        <textarea
          className="min-h-32 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
          maxLength={500}
          placeholder="What is this workspace for?"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>
      <button
        className="h-11 w-fit rounded-xl bg-blue-600 px-6 text-sm font-bold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-300 transition-all mt-2"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}

