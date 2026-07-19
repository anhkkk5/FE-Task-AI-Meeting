import { MeetingSummaryActionItem } from "../types/ai-report.type";

type MeetingSummaryActionItemsProps = {
  items: MeetingSummaryActionItem[];
};

export function MeetingSummaryActionItems({
  items,
}: MeetingSummaryActionItemsProps) {
  if (!items.length) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center text-sm font-semibold text-zinc-500">
        Chưa có việc cần làm được ghi nhận.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200">
      <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
        <thead className="bg-zinc-50 text-[10px] font-black uppercase tracking-wider text-zinc-500">
          <tr>
            <th className="px-4 py-3">Việc cần làm</th>
            <th className="px-4 py-3">Người phụ trách</th>
            <th className="px-4 py-3">Hạn xử lý</th>
            <th className="px-4 py-3">Trạng thái</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 bg-white">
          {items.map((item, index) => (
            <tr key={`${item.text}-${index}`}>
              <td className="px-4 py-3 font-semibold text-zinc-800">
                {item.text}
              </td>
              <td className="px-4 py-3 text-zinc-600">
                {item.assigneeName ?? item.assigneeUserId ?? "-"}
              </td>
              <td className="px-4 py-3 text-zinc-600">
                {item.dueDate ?? "-"}
              </td>
              <td className="px-4 py-3">
                <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-blue-700">
                  {item.status ?? "OPEN"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
