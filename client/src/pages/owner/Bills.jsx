import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Trash2, Wifi } from "lucide-react";
import { api } from "../../api/axios";
import { inr, dueLabel, todayYmd, addDaysYmd } from "../../lib/format";
import Pill from "../../components/ui/Pill";
import Modal from "../../components/ui/Modal";
import { useDialog } from "../../components/ui/DialogProvider";

function RenewForm({ bill, onClose, refresh }) {
  const base = bill.expiresOn > todayYmd() ? bill.expiresOn : todayYmd();
  const [expiresOn, setExpiresOn] = useState(addDaysYmd(base, 30));
  const [amount, setAmount] = useState("");
  const renew = useMutation({
    mutationFn: () => api.post(`/owner/bills/${bill.id}/renew`, { expiresOn, ...(amount !== "" && { amount: Number(amount) }) }),
    onSuccess: () => { toast.success(`${bill.name} renewed until ${dueLabel(expiresOn)}`); refresh(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); renew.mutate(); }} className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[28, 30, 90].map((d) => (
          <button type="button" key={d} className="btn-ghost" onClick={() => setExpiresOn(addDaysYmd(base, d))}>+{d} days</button>
        ))}
      </div>
      <div><label className="label">New expiry date</label>
        <input className="input" type="date" required min={addDaysYmd(todayYmd(), 1)} value={expiresOn} onChange={(e) => setExpiresOn(e.target.value)} /></div>
      <div><label className="label">Amount paid (optional)</label>
        <input className="input" type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
      <button className="btn-gold w-full" disabled={renew.isPending}>Mark as renewed</button>
    </form>
  );
}

export default function Bills() {
  const qc = useQueryClient();
  const { confirmAction } = useDialog();
  const [renew, setRenew] = useState(null);
  const [form, setForm] = useState({ name: "", expiresOn: "", remindDaysBefore: 3, amount: "" });
  const refresh = () => ["bills", "summary", "notifications"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));

  const { data: bills = [], isLoading } = useQuery({ queryKey: ["bills"], queryFn: async () => (await api.get("/owner/bills")).data, refetchInterval: 30000 });
  const add = useMutation({
    mutationFn: () => api.post("/owner/bills", {
      name: form.name, expiresOn: form.expiresOn, remindDaysBefore: Number(form.remindDaysBefore),
      ...(form.amount !== "" && { amount: Number(form.amount) }),
    }),
    onSuccess: () => { toast.success("Bill added"); setForm({ name: "", expiresOn: "", remindDaysBefore: 3, amount: "" }); refresh(); },
    onError: (e) => toast.error(e.message),
  });
  const del = useMutation({ mutationFn: (id) => api.delete(`/owner/bills/${id}`), onSuccess: () => { toast.success("Bill removed"); refresh(); }, onError: (e) => toast.error(e.message) });

  const askDelete = async (b) => {
    if (await confirmAction({ title: `Remove ${b.name}?`, message: "You'll stop getting reminders for it.", confirmText: "Remove", danger: true })) del.mutate(b.id);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold">Bills and recharges</h1>
        <p className="mt-1 text-ink-900/60">Add your WiFi plan or any recurring recharge. You'll be reminded before it runs out, then daily until you renew.</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); add.mutate(); }} className="card grid gap-4 md:grid-cols-5">
        <div className="md:col-span-2"><label className="label">Name</label>
          <input className="input" required placeholder="WiFi recharge" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><label className="label">Expires on</label>
          <input className="input" type="date" required value={form.expiresOn} onChange={(e) => setForm({ ...form, expiresOn: e.target.value })} /></div>
        <div><label className="label">Remind me (days before)</label>
          <input className="input" type="number" min="0" max="30" value={form.remindDaysBefore} onChange={(e) => setForm({ ...form, remindDaysBefore: e.target.value })} /></div>
        <div className="flex items-end"><button className="btn-gold w-full" disabled={add.isPending}>Add bill</button></div>
      </form>

      {isLoading ? <div className="text-sm text-ink-900/50">Loading…</div> : bills.length === 0 ? (
        <div className="card text-center text-ink-900/50">No bills yet. Add your WiFi recharge above.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {bills.map((b) => {
            const tone = b.daysLeft < 0 ? "red" : b.daysLeft <= b.remindDaysBefore ? "amber" : "green";
            const label = b.daysLeft < 0 ? `Expired ${-b.daysLeft}d ago` : b.daysLeft === 0 ? "Expires today" : `${b.daysLeft} days left`;
            return (
              <div key={b.id} className="card space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-ink-950 text-gold-400"><Wifi size={20} /></div>
                    <div>
                      <div className="font-extrabold">{b.name}</div>
                      <div className="text-xs text-ink-900/50">Expires {dueLabel(b.expiresOn)} · reminds {b.remindDaysBefore}d before</div>
                    </div>
                  </div>
                  <button onClick={() => askDelete(b)} className="text-ink-900/30 hover:text-red-500"><Trash2 size={18} /></button>
                </div>
                <div className="flex items-center justify-between">
                  <Pill tone={tone}>{label}</Pill>
                  <button className="btn-gold" onClick={() => setRenew(b)}>Mark renewed</button>
                </div>
                {b.history.length > 0 && (
                  <details className="text-sm">
                    <summary className="cursor-pointer font-semibold text-ink-900/50">Recent renewals</summary>
                    <ul className="mt-2 space-y-1 text-ink-900/60">
                      {b.history.map((h, i) => <li key={i}>{dueLabel(h.renewedOn)} → until {dueLabel(h.expiresOn)}{h.amount != null ? ` · ${inr(h.amount)}` : ""}</li>)}
                    </ul>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!renew} onClose={() => setRenew(null)} title={renew ? `Renew ${renew.name}` : ""}>
        {renew && <RenewForm bill={renew} onClose={() => setRenew(null)} refresh={refresh} />}
      </Modal>
    </div>
  );
}