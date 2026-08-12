import Link from "next/link";
import type { ReportCitation, ReportClaim } from "../types/ai-report.type";

const kindLabel = { FACT: "Dữ kiện", INFERENCE: "Suy luận", RECOMMENDATION: "Đề xuất" } as const;
const kindStyle = { FACT: "bg-emerald-50 text-emerald-700", INFERENCE: "bg-amber-50 text-amber-700", RECOMMENDATION: "bg-violet-50 text-violet-700" } as const;
export function ReportClaims({ claims = [], citations = [] }: { claims?: ReportClaim[]; citations?: ReportCitation[] }) {
  if (!claims.length) return null; const byId = new Map(citations.map((source) => [`${source.type}:${source.id}`, source]));
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-black text-slate-900">Nhận định có căn cứ</h2><p className="mt-1 text-xs text-slate-500">Mỗi nhận định được phân loại và liên kết tới dữ liệu dùng để kết luận.</p><div className="mt-4 space-y-3">{claims.map((claim) => <article className="rounded-xl border border-slate-200 bg-slate-50 p-3" key={claim.id}><div className="flex items-start gap-2"><span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-black uppercase ${kindStyle[claim.kind]}`}>{kindLabel[claim.kind]}</span><p className="text-sm font-medium text-slate-800">{claim.text}</p></div><div className="mt-2 flex flex-wrap gap-1.5">{claim.sourceIds.map((id) => { const source = byId.get(id); return source ? <Link className="rounded bg-white px-2 py-1 text-xs font-bold text-blue-700 hover:underline" href={source.href} key={id}>Nguồn: {source.label}</Link> : null; })}{!claim.sourceIds.length ? <span className="text-xs font-semibold text-amber-700">Chưa đủ nguồn trực tiếp</span> : null}</div></article>)}</div></section>;
}
