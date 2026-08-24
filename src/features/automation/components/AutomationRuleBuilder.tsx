"use client";

import { confirmAction, showAppNotice } from "@/components/feedback/AppDialogProvider";

import { useCallback, useEffect, useState } from "react";
import {
  automationRuns,
  createAutomation,
  deleteAutomation,
  dryRunAutomation,
  listAutomations,
  retryAutomationRun,
  updateAutomation,
  type AutomationRule,
} from "../api/automation.api";

export function AutomationRuleBuilder({ workspaceId, projectId }: { workspaceId: string; projectId: string }) {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [name, setName] = useState("Nhắc Task sắp đến hạn");
  const [days, setDays] = useState(1);
  const [conditionField, setConditionField] = useState("");
  const [conditionOperator, setConditionOperator] = useState("EQUALS");
  const [conditionValue, setConditionValue] = useState("");
  const [action, setAction] = useState<AutomationRule["actions"][number]["type"]>("NOTIFY_ASSIGNEE");
  const [actionValue, setActionValue] = useState("");

  const load = useCallback(async () => {
    const response = await listAutomations(workspaceId, projectId);
    setRules(response.data.items);
  }, [workspaceId, projectId]);

  useEffect(() => { void load(); }, [load]);

  async function add() {
    const conditions = conditionField
      ? [{ field: conditionField, operator: conditionOperator, value: conditionOperator === "IS_EMPTY" ? undefined : conditionValue }]
      : [];
    await createAutomation(workspaceId, projectId, {
      name,
      enabled: false,
      trigger: { type: "DUE_DATE", daysBefore: days },
      conditions,
      actions: [{ type: action, ...(action === "NOTIFY_ASSIGNEE" ? { message: actionValue || undefined } : { value: actionValue || undefined }) }],
    });
    await load();
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-bold text-zinc-800">Automation Engine</h2>
      <p className="mt-1 text-xs text-zinc-500">Trigger → điều kiện → hành động. Rule phải chạy thử trước khi được bật.</p>

      <div className="mt-4 grid gap-2 md:grid-cols-3">
        <input className="rounded-lg border px-3 py-2 text-xs" aria-label="Tên rule" value={name} onChange={(event) => setName(event.target.value)} />
        <label className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs">Trước hạn<input className="w-16" min={0} type="number" value={days} onChange={(event) => setDays(Number(event.target.value))} />ngày</label>
        <select className="rounded-lg border px-3 py-2 text-xs" value={conditionField} onChange={(event) => setConditionField(event.target.value)}>
          <option value="">Không có điều kiện</option><option value="status">Trạng thái</option><option value="assigneeId">Người phụ trách</option><option value="priority">Độ ưu tiên</option>
        </select>
        <select className="rounded-lg border px-3 py-2 text-xs" disabled={!conditionField} value={conditionOperator} onChange={(event) => setConditionOperator(event.target.value)}>
          <option value="EQUALS">Bằng</option><option value="NOT_EQUALS">Không bằng</option><option value="IS_EMPTY">Đang trống</option>
        </select>
        <input className="rounded-lg border px-3 py-2 text-xs" disabled={!conditionField || conditionOperator === "IS_EMPTY"} placeholder="Giá trị điều kiện" value={conditionValue} onChange={(event) => setConditionValue(event.target.value)} />
        <select className="rounded-lg border px-3 py-2 text-xs" value={action} onChange={(event) => setAction(event.target.value as typeof action)}>
          <option value="NOTIFY_ASSIGNEE">Nhắc người phụ trách</option><option value="CHANGE_STATUS">Đổi trạng thái</option><option value="ASSIGN_USER">Giao người dùng</option>
        </select>
        <input className="rounded-lg border px-3 py-2 text-xs md:col-span-2" placeholder={action === "CHANGE_STATUS" ? "Mã trạng thái" : action === "ASSIGN_USER" ? "User UUID" : "Nội dung nhắc"} value={actionValue} onChange={(event) => setActionValue(event.target.value)} />
        <button className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white" onClick={() => void add()}>Tạo rule</button>
      </div>

      <div className="mt-5 space-y-3">
        {rules.map((rule) => (
          <div className="rounded-xl border border-zinc-200 p-4" key={rule.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-sm font-bold">{rule.name}</p><p className="text-xs text-zinc-500">Trước hạn {rule.trigger.daysBefore ?? 0} ngày · {rule.actions.map((item) => item.type).join(", ")}</p></div>
              <div className="flex flex-wrap gap-2">
                <button className="rounded border px-2 py-1 text-xs" onClick={async () => { const result = await dryRunAutomation(workspaceId, projectId, rule.id); showAppNotice({ title: "Kết quả chạy thử", description: `${result.data.count} task phù hợp\n${result.data.matchedTasks.map((task) => task.taskCode).join(", ")}`, tone: "success" }); await load(); }}>Chạy thử</button>
                <button className={`rounded px-2 py-1 text-xs font-bold ${rule.enabled ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100"}`} onClick={async () => { await updateAutomation(workspaceId, projectId, rule.id, { ...rule, enabled: !rule.enabled }); await load(); }}>{rule.enabled ? "Đang bật" : "Bật rule"}</button>
                <button className="text-xs text-blue-600" onClick={async () => { const result = await automationRuns(workspaceId, projectId, rule.id); const failed = result.data.items.find((run) => run.status === "FAILED"); if (failed && await confirmAction({ title: "Chạy lại Automation", description: `Lần chạy trước gặp lỗi: ${failed.error}`, confirmLabel: "Chạy lại", tone: "warning" })) await retryAutomationRun(workspaceId, projectId, failed.id); else showAppNotice({ title: "Lịch sử Automation", description: `${result.data.items.length} lần chạy gần nhất.` }); }}>Lịch sử</button>
                <button className="text-xs text-red-600" onClick={async () => { await deleteAutomation(workspaceId, projectId, rule.id); await load(); }}>Xóa</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
