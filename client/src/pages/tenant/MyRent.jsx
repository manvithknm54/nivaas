import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "../../api/axios";
import { inr, monthLabel, dueLabel, addDaysYmd } from "../../lib/format";
import StatusBadge from "../../components/ui/StatusBadge";
import EntryList from "../../components/ui/EntryList";
import Modal from "../../components/ui/Modal";
import Pill from "../../components/ui/Pill";

function ExtensionForm({ due, onClose }) {
  const qc = useQueryClient();
  const current = due.extendedUntil || due.dueOn;
  const [until, setUntil] = useState(addDaysYmd(current, 7));
  const [reason, setReason] = useState("");
  const send = useMutation({
    mutationFn: () => api.post(`/tenant/rent/${due.id}/extension`, { until, reason }),
    onSuccess: () => { toast.success("Request sent to your owner"); qc.invalidateQueries({ queryKey: ["my-rent"] }); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); send.mutate(); }} className="space-y-4">
      <p className="text-sm text-ink-900/60">Rent for {monthLabel(due.month)} is due {dueLabel(current)}. Ask your owner for more time.</p>
      <div><label className="label">I can pay by</label>
        <input className="input" type="date" required min={addDaysYmd(current, 1)} value={until} onChange={(e) => setUntil(e.target.value)} /></div>
      <div><label className="label">Reason</label>
        <input className="input" required minLength={3} maxLength={200} placeholder="e.g. Salary is delayed" value={reason} onChange={(e) => setReason(e.target.value)} /></div>
      <button className="btn-gold w-full" disabled={send.isPending}>Send request</button>
    </form>
  );
}

export default function MyRent() {
  const [ext, setExt] = useState(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-rent"],
    queryFn: async () => (await api.get("/tenant/rent")).data,
    refetchInterval: 15000,
  });

  if (isLoading) return <div className="text-sm text-ink-900/50">Loading…</div>;
  if (isError || !data) return <div className="card text-center text-ink-900/60">We couldn't load your rent right now. Please try again in a moment.</div>;

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

      {data.length === 0 ? (
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
              <div className="mt-4 space-y-4 border-t border-ink-900/5 pt-4">
                <EntryList entries={r.entries} />
                {r.balance > 0 && (
                  r.extension?.status === "pending" ? (
                    <Pill tone="amber">Extension requested until {dueLabel(r.extension.requestedUntil)}</Pill>
                  ) : (
                    <div className="flex flex-wrap items-center gap-3">
                      <button className="btn-ghost" onClick={() => setExt(r)}>Request more time</button>
                      {r.extension?.status === "rejected" && <span className="text-xs text-ink-900/50">Your last request was declined.</span>}
                    </div>
                  )
                )}
              </div>
            </details>
          ))}
        </div>
      )}

      <Modal open={!!ext} onClose={() => setExt(null)} title="Request more time">
        {ext && <ExtensionForm due={ext} onClose={() => setExt(null)} />}
      </Modal>
    </div>
  );
}