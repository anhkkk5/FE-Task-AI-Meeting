import Link from "next/link";
import { ReportCitation } from "../types/ai-report.type";

const labels = { TASK: "Task", DAILY_UPDATE: "Daily Update", MEETING: "Cuộc họp", HANDOVER: "Bàn giao" } as const;

export function ReportCitations({ citations = [] }: { citations?: ReportCitation[] }) {
  if (!citations.length) return null;
  return <section className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5"><h3 className="text-sm font-black text-slate-900">Nguồn dữ liệu được sử dụng</h3><p className="mt-1 text-xs text-slate-500">Mở dữ liệu gốc để kiểm tra nhận định của AI.</p><div className="mt-3 flex flex-wrap gap-2">{citations.map((citation) => <Link className="rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50" href={citation.href} key={`${citation.type}:${citation.id}`}>{labels[citation.type]} · {citation.label}</Link>)}</div></section>;
}
