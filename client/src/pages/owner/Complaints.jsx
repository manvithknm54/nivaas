import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "../../api/axios";
import { categoryLabel, dateLabel } from "../../lib/format";
import Pill from "../../components/ui/Pill";
import { useDialog } from "../../components/ui/DialogProvider";

const STATUS = { open: ["Open", "red"], in_progress: ["In progress", "amber"], resolved: ["Resolved", "green"] };

export default function Complaints() {
  const qc = useQueryClient();
  const { askText } = useDialog();
  const [filter, setFilter] = useState("active");
  const { data: all = [], isLoading } = useQuery({ queryKey: ["complaints"], queryFn: async () => (await api.get("/owner/complaints")).data, refetchInterval: 10000 });

  const update = useMutation({
    mutationFn: ({ id, status, note }) => api.post(`/owner/complaints/${id}/status`, { status, note }),
    onSuccess: () => { toast.success("Complaint updated"); ["complaints", "summary"].forEach((k) => qc.invalidateQueries({ queryKey: [k] })); },
    onError: (e) => toast.error(e.message),
  });

  const resolve = async (c) => {
    const note = await askText({
      title: "Mark as resolved",
      message: "Tell the tenant what was done. This stays on record.",
      label: "What was done?", placeholder: "e.g. Replaced the leaking tap washer",
      confirmText: "Resolve", minLength: 5,
    });
    if (note) update.mutate({ id: c.id, status: "resolved", note });
  };

  const list = all.filter((c) => (filter === "all" ? true : filter === "active" ? c.status !== "resolved" : c.status === "resolved"));

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-extrabold">Complaints</h1>
      <div className="flex gap-2">
        {[["active", "Active"], ["resolved", "Resolved"], ["all", "All"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`rounded-full px-4 py-2 text-xs font-bold transition ${filter === v ? "bg-ink-950 text-gold-400" : "bg-white ring-1 ring-ink-900/10"}`}>{l}</button>
        ))}
      </div>

      {isLoading ? <div className="text-sm text-ink-900/50">Loading…</div> : list.length === 0 ? (
        <div className="card text-center text-ink-900/50">{filter === "active" ? "No active complaints. 🎉" : "Nothing here."}</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {list.map((c) => (
            <div key={c.id} className="card space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-extrabold">{c.title}</div>
                  <div className="text-xs text-ink-900/50">{c.tenant?.name} · Room {c.tenant?.room} · {categoryLabel(c.category)} · {dateLabel(c.createdAt)}</div>
                </div>
                <Pill tone={STATUS[c.status][1]}>{STATUS[c.status][0]}</Pill>
              </div>
              {c.description && <p className="text-sm text-ink-900/70">{c.description}</p>}
              {c.resolution && <div className="rounded-xl bg-emerald-50 p-3 text-sm"><span className="font-bold text-emerald-700">Work done: </span>{c.resolution}</div>}
              <div className="flex flex-wrap gap-2">
                {c.status === "open" && <button className="btn-ghost" disabled={update.isPending} onClick={() => update.mutate({ id: c.id, status: "in_progress" })}>Start work</button>}
                {c.status !== "resolved" && <button className="btn-gold" disabled={update.isPending} onClick={() => resolve(c)}>Mark resolved</button>}
                {c.status === "resolved" && <button className="btn-ghost" disabled={update.isPending} onClick={() => update.mutate({ id: c.id, status: "open" })}>Reopen</button>}
              </div>
              <details className="text-sm">
                <summary className="cursor-pointer font-semibold text-ink-900/50">History</summary>
                <ul className="mt-2 space-y-1 text-ink-900/60">
                  {c.timeline.map((t, i) => <li key={i}>{dateLabel(t.at)} · {STATUS[t.status][0]}{t.note ? ` · ${t.note}` : ""}</li>)}
                </ul>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}