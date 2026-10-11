import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { api } from "../../api/axios";
import { inr, thisMonth, monthLabel, shiftMonth, dueLabel } from "../../lib/format";
import StatusBadge from "../../components/ui/StatusBadge";
import Modal from "../../components/ui/Modal";
import EntryList from "../../components/ui/EntryList";

function Detail({ id }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["rent-due", id],
    queryFn: async () => (await api.get(`/owner/rent/${id}`)).data,
    refetchInterval: 15000,
  });
  const [form, setForm] = useState({ type: "payment", amount: "", method: "upi", note: "" });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["rent-due", id] });
    qc.invalidateQueries({ queryKey: ["rent"] });
  };

  const add = useMutation({
    mutationFn: () => api.post(`/owner/rent/${id}/entries`, { ...form, amount: Number(form.amount) }),
    onSuccess: () => {
      toast.success(form.type === "payment" ? "Payment recorded" : "Credit added");
      setForm({ ...form, amount: "", note: "" });
      refresh();
    },
    onError: (e) => toast.error(e.message),
  });
  const reverse = useMutation({
    mutationFn: ({ entryId, note }) => api.post(`/owner/rent/entries/${entryId}/reverse`, { note }),
    onSuccess: () => { toast.success("Entry reversed"); refresh(); },
    onError: (e) => toast.error(e.message),
  });

  if (!data) return <div className="py-10 text-center text-sm text-ink-900/50">Loading…</div>;
  const askReverse = (e) => {
    const note = prompt("Why are you reversing this entry?");
    if (note && note.trim().length >= 3) reverse.mutate({ entryId: e.id, note: note.trim() });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xl font-extrabold">{data.tenant.name}</div>
          <div className="text-sm text-ink-900/60">Room {data.tenant.room} · due {dueLabel(data.dueOn)}</div>
        </div>
        <StatusBadge status={data.status} overdue={data.overdue} />
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        {[["Rent", data.amount], ["Paid", data.paid + data.credits], ["Balance", data.balance]].map(([l, v]) => (
          <div key={l} className="rounded-xl bg-sand-50 p-3">
            <div className="text-[11px] font-semibold uppercase text-ink-900/50">{l}</div>
            <div className="mt-1 font-extrabold">{inr(v)}</div>
          </div>
        ))}
      </div>

      {data.balance > 0 && (
        <form onSubmit={(e) => { e.preventDefault(); add.mutate(); }} className="space-y-3 rounded-xl border border-ink-900/10 p-4">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-ink-900/5 p-1">
            {[["payment", "Payment"], ["credit", "Credit / discount"]].map(([v, l]) => (
              <button type="button" key={v} onClick={() => setForm({ ...form, type: v })}
                className={`rounded-md py-2 text-xs font-semibold ${form.type === v ? "bg-white shadow" : "text-ink-900/50"}`}>{l}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <input className="input" type="number" step="0.01" min="0.01" required placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <button type="button" className="btn-ghost whitespace-nowrap" onClick={() => setForm({ ...form, amount: String(data.balance) })}>Full {inr(data.balance)}</button>
          </div>
          {form.type === "payment" && (
            <select className="input" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
              <option value="upi">UPI</option><option value="cash">Cash</option><option value="bank">Bank transfer</option><option value="other">Other</option>
            </select>
          )}
          <input className="input" placeholder={form.type === "credit" ? "Reason (required)" : "Note (optional)"} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <button className="btn-gold w-full" disabled={add.isPending}>{form.type === "payment" ? "Record payment" : "Add credit"}</button>
        </form>
      )}

      <div>
        <h3 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-ink-900/50">History</h3>
        <EntryList entries={data.entries} onReverse={askReverse} />
      </div>
    </div>
  );
}

export default function Rent() {
  const qc = useQueryClient();
  const [month, setMonth] = useState(thisMonth());
  const [filter, setFilter] = useState("all");
  const [openId, setOpenId] = useState(null);
  const { data, isLoading } = useQuery({
    queryKey: ["rent", month],
    queryFn: async () => (await api.get("/owner/rent", { params: { month } })).data,
    refetchInterval: 15000,
  });

  const gen = useMutation({
    mutationFn: () => api.post("/owner/rent/generate", { month }),
    onSuccess: ({ data: d }) => {
      toast.success(d.created ? `${d.created} new dues created` : "Everything is already up to date");
      qc.invalidateQueries({ queryKey: ["rent"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const rows = (data?.rows || []).filter((r) =>
    filter === "all" ? true : filter === "paid" ? r.status === "paid" : filter === "overdue" ? r.overdue : r.balance > 0
  );
  const t = data?.totals;
  const stats = t
    ? [["Expected", inr(t.expected)], ["Collected", inr(t.collected)], ["Outstanding", inr(t.outstanding)], ["Overdue", t.overdueCount]]
    : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold">Rent</h1>
        <div className="flex items-center gap-2">
          <button className="btn-ghost !px-3" onClick={() => setMonth(shiftMonth(month, -1))}><ChevronLeft size={18} /></button>
          <div className="min-w-40 text-center font-bold">{monthLabel(month)}</div>
          <button className="btn-ghost !px-3" disabled={month >= thisMonth()} onClick={() => setMonth(shiftMonth(month, 1))}><ChevronRight size={18} /></button>
          <button className="btn-ghost" disabled={gen.isPending} onClick={() => gen.mutate()}><RefreshCw size={16} /> Generate dues</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(([l, v]) => (
          <div key={l} className="card">
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-900/50">{l}</div>
            <div className="mt-2 text-2xl font-extrabold">{v}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {[["all", "All"], ["pending", "Not fully paid"], ["overdue", "Overdue"], ["paid", "Paid"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`rounded-full px-4 py-2 text-xs font-bold transition ${filter === v ? "bg-ink-950 text-gold-400" : "bg-white ring-1 ring-ink-900/10"}`}>{l}</button>
        ))}
      </div>

      <div className="card overflow-x-auto !p-0">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-ink-900/50">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-ink-900/50">
            {data?.rows.length ? "Nothing matches this filter." : "No dues for this month yet. Approve a tenant or click Generate dues."}
          </div>
        ) : (
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-ink-900/50">
              <tr><th className="p-4">Tenant</th><th>Room</th><th>Rent</th><th>Paid</th><th>Balance</th><th>Due</th><th>Status</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} onClick={() => setOpenId(r.id)} className="cursor-pointer border-t border-ink-900/5 hover:bg-sand-50">
                  <td className="p-4 font-semibold">{r.tenant.name}</td>
                  <td>{r.tenant.room}</td>
                  <td>{inr(r.amount)}</td>
                  <td>{inr(r.paid + r.credits)}</td>
                  <td className="font-bold">{inr(r.balance)}</td>
                  <td>{dueLabel(r.dueOn)}</td>
                  <td><StatusBadge status={r.status} overdue={r.overdue} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={!!openId} onClose={() => setOpenId(null)} title="Rent details">
        {openId && <Detail id={openId} />}
      </Modal>
    </div>
  );
}