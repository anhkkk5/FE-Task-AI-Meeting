"use client";

import { FormEvent, useEffect, useState } from "react";
import { SaveMeetingTranscriptPayload } from "../types/meeting.type";

type MeetingTranscriptEditorProps = {
  initialRawTranscript?: string;
  onSave: (payload: SaveMeetingTranscriptPayload) => Promise<void>;
};

export function MeetingTranscriptEditor({
  initialRawTranscript = "",
  onSave,
}: MeetingTranscriptEditorProps) {
  const [rawTranscript, setRawTranscript] = useState(initialRawTranscript);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setRawTranscript(initialRawTranscript);
  }, [initialRawTranscript]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      await onSave({
        rawTranscript,
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
      onSubmit={handleSubmit}
    >
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-black text-zinc-950">
            Transcript editor
          </h2>
          <p className="mt-1 text-xs font-medium text-zinc-500">
            Luu text transcript vao MongoDB de chuan bi cho AI summary sau nay.
          </p>
        </div>
        <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-500">
          {rawTranscript.length}/50000
        </span>
      </div>
      <textarea
        className="min-h-96 w-full resize-y rounded-2xl border border-zinc-300 bg-zinc-50 px-4 py-4 text-sm leading-7 text-zinc-800 outline-none transition focus:border-blue-600 focus:bg-white"
        maxLength={50000}
        minLength={1}
        placeholder="Nguyen Van A: Hom nay minh thong nhat backlog...\nNguyen Van B: Em phu trach API meeting..."
        required
        value={rawTranscript}
        onChange={(event) => setRawTranscript(event.target.value)}
      />
      <button
        className="mt-4 h-11 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 disabled:bg-zinc-400"
        disabled={isSaving}
        type="submit"
      >
        {isSaving ? "Dang luu..." : "Luu transcript"}
      </button>
    </form>
  );
}
