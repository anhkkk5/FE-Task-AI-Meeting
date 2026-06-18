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
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-medium text-zinc-700">
        Name
        <input
          className="h-11 border border-zinc-300 px-3 text-sm font-normal outline-none focus:border-zinc-900"
          maxLength={100}
          minLength={2}
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-zinc-700">
        Description
        <textarea
          className="min-h-28 resize-y border border-zinc-300 px-3 py-2 text-sm font-normal outline-none focus:border-zinc-900"
          maxLength={500}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>
      <button
        className="h-11 w-fit bg-zinc-900 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
