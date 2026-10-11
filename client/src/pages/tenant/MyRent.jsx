import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/axios";
import { inr, monthLabel, dueLabel } from "../../lib/format";
import StatusBadge from "../../components/ui/StatusBadge";
import EntryList from "../../components/ui/EntryList";

export default function MyRent() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["my-rent"],
    queryFn: async () => (await api.get("/tenant/rent")).data,
    refetchInterval: 15000,
  });
  const pending = data.reduce((s, r) => s + r.balance, 0);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-extrabold">My rent</h1>

      <div className="card flex flex-wrap items-center justify-between gap-3 !bg-ink-950 !text-ink-100">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-100/50">Total pending</div>
          <div className="mt-1 text-4xl font-extrabold text-gold-400">{inr(pending)}</div>
        </div>
        <div className="text-sm text-ink-100/60">{pending > 0 ? "Pay your owner and ask them to record it." : "You're all caught up 🎉"}</div>
      </div>

      {isLoading ? (
        <div className="text-sm text-ink-900/50">Loading…</div>
      ) : data.length === 0 ? (
        <div className="card text-center text-ink-900/50">No rent due yet. It appears here once your owner approves your stay.</div>
      ) : (
        <div className="space-y-4">
          {data.map((r) => (
            <details key={r.id} className="card">
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-4">
                <div className="flex-1">
                  <div className="font-extrabold">{monthLabel(r.month)}</div>
                  <div className="text-xs text-ink-900/50">Due {dueLabel(r.extendedUntil || r.dueOn)}</div>
                </div>
                <div className="text-right font-extrabold">
                  {inr(r.balance)} <span className="text-xs font-medium text-ink-900/40">of {inr(r.amount)}</span>
                </div>
                <StatusBadge status={r.status} overdue={r.overdue} />
              </summary>
              <div className="mt-4 border-t border-ink-900/5 pt-4"><EntryList entries={r.entries} /></div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}