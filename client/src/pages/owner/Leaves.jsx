import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "../../api/axios";
import { inr, dueLabel } from "../../lib/format";
import Pill from "../../components/ui/Pill";
import { useDialog } from "../../components/ui/DialogProvider";

function Row({ l, children }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-ink-900/5 py-4 last:border-0">
      <div className="min-w-48 flex-1">
        <div className="font-semibold">{l.tenant.name} <span className="text-xs font-medium text-ink-900/50">Room {l.tenant.room}</span></div>
        <div className="text-sm text-ink-900/60">{dueLabel(l.leaveOn)} → back {dueLabel(l.returnOn)} · {l.days} days{l.note ? ` · ${l.note}` : ""}</div>
      </div>
      <Pill tone="gold">{l.status === "approved" ? `${inr(l.creditApplied)} of ${inr(l.creditTotal)} credited` : `Credit ${inr(l.creditTotal)}`}</Pill>
      {children}
    </div>
  );
}

export default function Leaves() {
  const qc = useQueryClient();
  const { confirmAction } = useDialog();
  const { data, isLoading } = useQuery({ queryKey: ["leaves"], queryFn: async () => (await api.get("/owner/leaves")).data, refetchInterval: 10000 });

  const act = useMutation({
    mutationFn: ({ id, action }) => api.post(`/owner/leaves/${id}/${action}`),
    onSuccess: (_r, { action }) => {
      toast.success({ approve: "Leave approved. Rent credit applied.", reject: "Request declined", cancel: "Leave cancelled" }[action]);
      ["leaves", "rent", "rent-due", "meals", "summary"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
    },
    onError: (e) => toast.error(e.message),
  });

  const askCancel = async (l) => {
    const ok = await confirmAction({
      title: `Cancel ${l.tenant.name}'s leave?`,
      message: "Any rent credit already applied is reversed, and they count for meals again.",
      confirmText: "Cancel leave", danger: true,
    });
    if (ok) act.mutate({ id: l.id, action: "cancel" });
  };

  const leaves = data?.leaves ?? [];
  const pending = leaves.filter((l) => l.status === "pending");
  const approved = leaves.filter((l) => l.status === "approved");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold">Leaves</h1>
        {data && <p className="mt-1 text-ink-900/60">Deduction: {inr(data.ratePerWeek)} per week away, prorated by the day. Change it in Settings.</p>}
      </div>

      {isLoading ? <div className="text-sm text-ink-900/50">Loading…</div> : (
        <>
          <div className="card">
            <h2 className="text-lg font-extrabold">Waiting for approval ({pending.length})</h2>
            {pending.length === 0 && <p className="mt-3 text-sm text-ink-900/50">No pending requests.</p>}
            {pending.map((l) => (
              <Row key={l.id} l={l}>
                <button className="btn-gold" disabled={act.isPending} onClick={() => act.mutate({ id: l.id, action: "approve" })}>Approve</button>
                <button className="btn-ghost" disabled={act.isPending} onClick={() => act.mutate({ id: l.id, action: "reject" })}>Decline</button>
              </Row>
            ))}
          </div>
          <div className="card">
            <h2 className="text-lg font-extrabold">Approved and upcoming ({approved.length})</h2>
            {approved.length === 0 && <p className="mt-3 text-sm text-ink-900/50">Nobody is away or planning to be.</p>}
            {approved.map((l) => (
              <Row key={l.id} l={l}><button className="btn-ghost" onClick={() => askCancel(l)}>Cancel</button></Row>
            ))}
          </div>
        </>
      )}
    </div>
  );
}