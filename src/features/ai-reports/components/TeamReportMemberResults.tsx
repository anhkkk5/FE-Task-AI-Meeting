import { TeamDailyReportOutput } from "../types/ai-report.type";

type TeamReportMemberResultsProps = {
  members: NonNullable<TeamDailyReportOutput["memberSummaries"]>;
  missingDailyUpdates: string[];
};

/** Chu cai dau ten, dung lam avatar de khong phai tai anh nguoi dung. */
function initials(fullName: string) {
  const words = fullName.trim().split(/\s+/).filter(Boolean);

  if (!words.length) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

/**
 * Ket qua lam viec cua tung thanh vien.
 *
 * Hien ca danh sach nguoi chua gui cap nhat ngay o cuoi: thieu du lieu la thong
 * tin quan ly can biet, khong phai loi de an di.
 */
export function TeamReportMemberResults({
  members,
  missingDailyUpdates,
}: TeamReportMemberResultsProps) {
  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      data-print-block="true"
      id="team-report-members"
    >
      <h2 className="text-sm font-black text-slate-900">
        Kết quả theo thành viên
      </h2>

      {members.length ? (
        <ul className="mt-4 divide-y divide-slate-100">
          {members.map((member) => (
            <li className="flex gap-3 py-3 first:pt-0 last:pb-0" key={member.userId}>
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-black text-brand-700"
              >
                {initials(member.fullName)}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">
                  {member.fullName}
                </p>
                <p className="mt-1 text-sm font-medium leading-relaxed text-slate-600">
                  {member.summary}
                </p>
                {member.blockers.length ? (
                  <p className="mt-1.5 text-xs font-bold text-amber-700">
                    Vướng mắc: {member.blockers.join("; ")}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm font-medium text-slate-400">
          Chưa có dữ liệu.
        </p>
      )}

      {missingDailyUpdates.length ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-[11px] font-black uppercase tracking-wider text-amber-700">
            Chưa gửi cập nhật hằng ngày
          </p>
          <ul className="mt-1.5 space-y-1">
            {missingDailyUpdates.map((item, index) => (
              <li
                className="text-sm font-medium text-amber-900"
                key={`${item}-${index}`}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
