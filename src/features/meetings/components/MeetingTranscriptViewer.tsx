import { MeetingTranscript } from "../types/meeting.type";

type MeetingTranscriptViewerProps = {
  transcript: MeetingTranscript | null;
};

export function MeetingTranscriptViewer({
  transcript,
}: MeetingTranscriptViewerProps) {
  if (!transcript) {
    return (
      <section className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center text-sm font-semibold text-zinc-500">
        Meeting nay chua co transcript.
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-100 px-5 py-4">
        <h2 className="text-base font-black text-zinc-950">
          Transcript viewer
        </h2>
        <p className="mt-1 text-xs font-medium text-zinc-500">
          {transcript.updatedAt
            ? `Cap nhat: ${transcript.updatedAt.slice(0, 16).replace("T", " ")}`
            : "Transcript text"}
        </p>
      </div>
      <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap px-5 py-5 text-sm leading-7 text-zinc-800">
        {transcript.rawTranscript}
      </pre>
    </section>
  );
}
