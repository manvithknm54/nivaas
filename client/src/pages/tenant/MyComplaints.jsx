import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "../../api/axios";
import { CATEGORIES, categoryLabel, dateLabel } from "../../lib/format";
import Pill from "../../components/ui/Pill";

const STATUS = { open: ["Open", "red"], in_progress: ["In progress", "amber"], resolved: ["Resolved", "green"] };

export default function MyComplaints() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: "", category: "other", description: "" });
  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-complaints"],
    queryFn: async () => (await api.get("/tenant/complaints")).data,
    refetchInterval: 15000,
  });
  const send = useMutation({
    mutationFn: () => api.post("/tenant/complaints", form),
    onSuccess: () => { toast.success("Complaint sent to your owner"); setForm({ title: "", category: "other", description: "" }); qc.invalidateQueries({ queryKey: ["my-complaints"] }); },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <div className="text-sm text-ink-900/50">Loading…</div>;
  if (isError || !data) return <div className="card text-center text-ink-900/60">Complaints aren't available right now. Please try again in a moment.</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold">Complaints</h1>
        <p className="mt-1 text-ink-900/60">Raise an issue and follow it until your owner marks it fixed.</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send.mutate(); }} className="card space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2"><label className="label">What's the issue?</label>
            <input className="input" required minLength={3} maxLength={80} placeholder="e.g. No water in the 2nd floor bathroom" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className="label">Category</label>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select></div>
        </div>
        <div><label className="label">Details (optional)</label>
          <textarea className="input min-h-24" maxLength={1000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <button className="btn-gold" disabled={send.isPending}>Send complaint</button>
      </form>

      <div className="space-y-3">
        {data.length === 0 && <div className="card text-center text-ink-900/50">No complaints raised. Hopefully it stays that way.</div>}
        {data.map((c) => (
          <div key={c.id} className="card space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-extrabold">{c.title}</div>
                <div className="text-xs text-ink-900/50">{categoryLabel(c.category)} · {dateLabel(c.createdAt)}</div>
              </div>
              <Pill tone={STATUS[c.status][1]}>{STATUS[c.status][0]}</Pill>
            </div>
            {c.description && <p className="text-sm text-ink-900/70">{c.description}</p>}
            {c.resolution && <div className="rounded-xl bg-emerald-50 p-3 text-sm"><span className="font-bold text-emerald-700">Work done: </span>{c.resolution}</div>}
            <details className="text-sm">
              <summary className="cursor-pointer font-semibold text-ink-900/50">History</summary>
              <ul className="mt-2 space-y-1 text-ink-900/60">
                {c.timeline.map((t, i) => <li key={i}>{dateLabel(t.at)} · {STATUS[t.status][0]}{t.note ? ` · ${t.note}` : ""}</li>)}
              </ul>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}