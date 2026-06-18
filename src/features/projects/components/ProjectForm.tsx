"use client";

import { FormEvent, useState } from "react";

type ProjectFormPayload = {
  name: string;
  keyCode?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
};

type ProjectFormProps = {
  initialName?: string;
  initialKeyCode?: string;
  initialDescription?: string | null;
  initialStartDate?: string | null;
  initialEndDate?: string | null;
  mode: "create" | "update";
  submitLabel: string;
  onSubmit: (payload: ProjectFormPayload) => Promise<void>;
};

export function ProjectForm({
  initialName = "",
  initialKeyCode = "",
  initialDescription = "",
  initialStartDate = "",
  initialEndDate = "",
  mode,
  submitLabel,
  onSubmit,
}: ProjectFormProps) {
  const [name, setName] = useState(initialName);
  const [keyCode, setKeyCode] = useState(initialKeyCode);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [startDate, setStartDate] = useState(initialStartDate ?? "");
  const [endDate, setEndDate] = useState(initialEndDate ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({
        name,
        keyCode: mode === "create" ? keyCode : undefined,
        description,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
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
          maxLength={150}
          minLength={2}
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      {mode === "create" ? (
        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          Key code
          <input
            className="h-11 border border-zinc-300 px-3 text-sm font-normal uppercase outline-none focus:border-zinc-900"
            maxLength={20}
            minLength={2}
            pattern="[A-Z0-9_]+"
            required
            value={keyCode}
            onChange={(event) => setKeyCode(event.target.value.toUpperCase())}
          />
        </label>
      ) : null}
      <label className="grid gap-2 text-sm font-medium text-zinc-700">
        Description
        <textarea
          className="min-h-28 resize-y border border-zinc-300 px-3 py-2 text-sm font-normal outline-none focus:border-zinc-900"
          maxLength={1000}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          Start date
          <input
            className="h-11 border border-zinc-300 px-3 text-sm font-normal outline-none focus:border-zinc-900"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          End date
          <input
            className="h-11 border border-zinc-300 px-3 text-sm font-normal outline-none focus:border-zinc-900"
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </label>
      </div>
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
