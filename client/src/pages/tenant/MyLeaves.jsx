import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "../../api/axios";
import { inr, dueLabel, todayYmd, addDaysYmd, daysBetweenYmd } from "../../lib/format";
import Pill from "../../components/ui/Pill";
import { useDialog } from "../../components/ui/DialogProvider";

const tone = { pending: "amber", approved: "green", rejected: "red", cancelled: "ink" };

export default function MyLeaves() {
  const qc = useQueryClient();
  const { confirmAction } = useDialog();
  const today = todayYmd();
  const [form, setForm] = useState({ leaveOn: today, returnOn: addDaysYmd(today, 7), note: "" });
  const refresh = () => qc.invalidateQueries({ queryKey: ["my-leaves"] });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-leaves"],
    queryFn: async () => (await api.get("/tenant/leaves")).data,
    refetchInterval: 15000,
  });
  const send = useMutation({
    mutationFn: () => api.post("/tenant/leaves", form),
    onSuccess: () => { toast.success("Leave request sent to your owner"); setForm({ ...form, note: "" }); refresh(); },
    onError: (e) => toast.error(e.message),
  });
  const cancel = useMutation({
    mutationFn: (id) => api.post(`/tenant/leaves/${id}/cancel`),
    onSuccess: () => { toast.success("Leave cancelled"); refresh(); qc.invalidateQueries({ queryKey: ["my-rent"] }); },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <div className="text-sm text-ink-900/50">Loading…</div>;
  if (isError || !data) return <div className="card text-center text-ink-900/60">Leaves aren't available right now. Please try again in a moment.</div>;

  const days = daysBetweenYmd(form.leaveOn, form.returnOn);
  const estimate = days >= 1 ? Math.round(((days * data.ratePerWeek) / 7) * 100) / 100 : 0;

  const askCancel = async (l) => {
    const ok = await confirmAction({
      title: "Cancel this leave?",
      message: l.status === "approved" ? "Any rent credit already applied will be reversed." : "Your owner won't see this request any more.",
      confirmText: "Cancel leave", danger: true,
    });
    if (ok) cancel.mutate(l.id);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold">Leaves</h1>
        <p className="mt-1 text-ink-900/60">Going home? Tell your owner and your rent is reduced by {inr(data.ratePerWeek)} for every week you're away.</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send.mutate(); }} className="card space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">I leave on</label>
            <input className="input" type="date" required min={today} value={form.leaveOn} onChange={(e) => setForm({ ...form, leaveOn: e.target.value })} /></div>
          <div><label className="label">I'm back on</label>
            <input className="input" type="date" required min={addDaysYmd(form.leaveOn, 1)} value={form.returnOn} onChange={(e) => setForm({ ...form, returnOn: e.target.value })} /></div>
        </div>
        <div><label className="label">Note (optional)</label>
          <input className="input" maxLength={200} placeholder="e.g. Going home for a festival" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-sand-50 p-4">
          <div className="text-sm text-ink-900/60">{days >= 1 ? `${days} day${days === 1 ? "" : "s"} away` : "Pick valid dates"}</div>
          <div className="text-lg font-extrabold">You save about <span className="text-gold-500">{inr(estimate)}</span></div>
        </div>
        <button className="btn-gold" disabled={send.isPending || days < 1}>Send request</button>
      </form>

      <div className="space-y-3">
        <h2 className="text-lg font-extrabold">My leaves</h2>
        {data.leaves.length === 0 && <div className="card text-center text-ink-900/50">No leaves yet.</div>}
        {data.leaves.map((l) => (
          <div key={l.id} className="card flex flex-wrap items-center gap-4">
            <div className="flex-1">
              <div className="font-extrabold">{dueLabel(l.leaveOn)} → {dueLabel(l.returnOn)} <span className="text-sm font-medium text-ink-900/50">· {l.days} days</span></div>
              <div className="text-sm text-ink-900/60">
                {l.status === "approved" ? `${inr(l.creditApplied)} of ${inr(l.creditTotal)} deducted from your rent` : `Estimated saving ${inr(l.creditTotal)}`}
                {l.note ? ` · ${l.note}` : ""}
              </div>
            </div>
            <Pill tone={tone[l.status]}>{l.status[0].toUpperCase() + l.status.slice(1)}</Pill>
            {(l.status === "pending" || (l.status === "approved" && l.leaveOn > today)) && (
              <button className="btn-ghost" onClick={() => askCancel(l)}>Cancel</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}