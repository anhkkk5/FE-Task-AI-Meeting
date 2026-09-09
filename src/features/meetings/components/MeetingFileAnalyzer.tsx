"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { CheckCircle2, FileText, Film, LoaderCircle, Sparkles, UploadCloud, XCircle } from "lucide-react";
import {
  getLatestMeetingImportJob,
  getMeetingImportJob,
  MeetingImportJob,
  uploadMeetingSource,
} from "../api/meetings.api";

const ACCEPT = ".pdf,.docx,.txt,.md,.mp3,.wav,.m4a,.ogg,.webm,.mp4,.mov,.mkv";

function readableFileName(value: string) {
  if (!/(?:Ã|Â|Ä|Æ|á[\u0080-\u2022])/.test(value)) return value;

  try {
    const cp1252: Record<string, number> = {
      "€": 0x80, "‚": 0x82, "ƒ": 0x83, "„": 0x84, "…": 0x85,
      "†": 0x86, "‡": 0x87, "ˆ": 0x88, "‰": 0x89, "Š": 0x8a,
      "‹": 0x8b, "Œ": 0x8c, "Ž": 0x8e, "‘": 0x91, "’": 0x92,
      "“": 0x93, "”": 0x94, "•": 0x95, "–": 0x96, "—": 0x97,
      "˜": 0x98, "™": 0x99, "š": 0x9a, "›": 0x9b, "œ": 0x9c,
      "ž": 0x9e, "Ÿ": 0x9f,
    };
    const bytes = Uint8Array.from(value, (character) => cp1252[character] ?? character.charCodeAt(0));
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return decoded || value;
  } catch {
    return value;
  }
}

export function MeetingFileAnalyzer({ workspaceId, projectId }: { workspaceId: string; projectId: string }) {
  const [job, setJob] = useState<MeetingImportJob | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void getLatestMeetingImportJob(workspaceId, projectId)
      .then((response) => setJob(response.data.job))
      .catch(() => undefined);
  }, [projectId, workspaceId]);

  useEffect(() => {
    if (!job || job.status === "COMPLETED" || job.status === "FAILED") return;
    const timer = window.setInterval(() => {
      void getMeetingImportJob(workspaceId, projectId, job.id)
        .then((response) => setJob(response.data.job))
        .catch(() => undefined);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [job, projectId, workspaceId]);

  async function upload(file?: File) {
    if (!file || isUploading) return;
    setError(""); setIsUploading(true);
    try {
      const response = await uploadMeetingSource(workspaceId, projectId, file);
      setJob(response.data.job);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Không thể tải tệp lên.");
    } finally { setIsUploading(false); }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault(); setIsDragging(false); void upload(event.dataTransfer.files[0]);
  }
  function onChoose(event: ChangeEvent<HTMLInputElement>) {
    void upload(event.target.files?.[0]); event.target.value = "";
  }

  const active = job && !["COMPLETED", "FAILED"].includes(job.status);

  return (
    <section id="meeting-file-analyzer" className="scroll-mt-28 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600"><Sparkles className="h-5 w-5" /></span>
          <div><h2 className="text-lg font-extrabold text-slate-900">Phân tích tài liệu và media bằng AI</h2><p className="mt-0.5 text-sm text-slate-500">Kết quả được lưu độc lập, không thay đổi biên bản hoặc tóm tắt của cuộc họp.</p></div>
        </div>
        <div className="flex gap-2 text-xs font-semibold text-slate-500"><span className="rounded-full bg-slate-100 px-2.5 py-1">Tài liệu ≤ 25 MB</span><span className="rounded-full bg-slate-100 px-2.5 py-1">Media ≤ 200 MB</span></div>
      </div>

      <div className="p-6">
        <input ref={inputRef} className="hidden" type="file" accept={ACCEPT} onChange={onChoose} />
        <div
          className={`flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 text-center transition ${isDragging ? "border-violet-500 bg-violet-50" : "border-slate-200 bg-slate-50/70 hover:border-violet-300 hover:bg-violet-50/40"}`}
          onClick={() => inputRef.current?.click()}
          onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
        >
          {isUploading ? <LoaderCircle className="h-10 w-10 animate-spin text-violet-600" /> : <UploadCloud className="h-10 w-10 text-violet-500" />}
          <p className="mt-4 font-bold text-slate-800">{isUploading ? "Đang tải tệp lên..." : "Kéo thả tệp vào đây hoặc nhấn để chọn"}</p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">PDF, DOCX, TXT, MD, MP3, WAV, M4A, OGG, WEBM, MP4, MOV hoặc MKV. Video dài được tách thành nhiều đoạn âm thanh và xử lý nền.</p>
        </div>

        {job ? (
          <div className="mt-5 rounded-2xl border border-slate-200 p-4">
            <div className="flex items-start gap-3">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${job.status === "FAILED" ? "bg-rose-50 text-rose-600" : job.status === "COMPLETED" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"}`}>
                {job.status === "FAILED" ? <XCircle className="h-5 w-5" /> : job.status === "COMPLETED" ? <CheckCircle2 className="h-5 w-5" /> : job.kind === "MEDIA" ? <Film className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2"><p className="truncate font-bold text-slate-800" title={readableFileName(job.fileName)}>{readableFileName(job.fileName)}</p><span className="text-xs font-semibold text-slate-500">{Math.round(job.fileSize / 1024 / 1024 * 10) / 10} MB</span></div>
                <p className={`mt-1 text-sm ${job.status === "FAILED" ? "text-rose-600" : "text-slate-500"}`}>
                  {job.status === "FAILED"
                    ? `Lần xử lý trước thất bại: ${job.error || job.message}. Hãy chọn lại tệp để thử lại.`
                    : job.message}
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full transition-all duration-500 ${job.status === "FAILED" ? "bg-rose-500" : job.status === "COMPLETED" ? "bg-emerald-500" : "bg-gradient-to-r from-blue-500 to-violet-500"}`} style={{ width: `${job.progress}%` }} /></div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-slate-500">{active ? `${job.progress}%` : job.status === "COMPLETED" ? "Hoàn tất" : "Thất bại"}</span>
                  {job.status === "FAILED" ? (
                    <button className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-700" onClick={() => inputRef.current?.click()} type="button">Chọn lại tệp</button>
                  ) : null}
                </div>
                {job.status === "COMPLETED" && job.summary ? (
                  <div className="mt-5 space-y-4 border-t border-slate-100 pt-5">
                    <div><p className="text-xs font-bold uppercase tracking-wider text-violet-600">Tóm tắt AI</p><h3 className="mt-1 text-lg font-extrabold text-slate-900">{job.summary.title || readableFileName(job.fileName)}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{job.summary.summary}</p></div>
                    {job.summary.keyPoints?.length ? <div><p className="text-sm font-bold text-slate-800">Ý chính</p><ul className="mt-2 space-y-1 text-sm text-slate-600">{job.summary.keyPoints.map((item, index) => <li key={index}>• {item}</li>)}</ul></div> : null}
                    {job.summary.nextSteps?.length ? <div><p className="text-sm font-bold text-slate-800">Bước tiếp theo</p><ul className="mt-2 space-y-1 text-sm text-slate-600">{job.summary.nextSteps.map((item, index) => <li key={index}>• {item}</li>)}</ul></div> : null}
                    <details className="rounded-xl bg-slate-50 p-3"><summary className="cursor-pointer text-sm font-bold text-slate-700">Xem văn bản đã trích xuất</summary><p className="mt-3 max-h-72 overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-slate-600">{job.transcript}</p></details>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
        {error ? <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p> : null}
      </div>
    </section>
  );
}
