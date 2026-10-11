import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "../../api/axios";
import { dueLabel, monthLabel, addDaysYmd } from "../../lib/format";

function Row({ r }) {
  const qc = useQueryClient();
  const [until, setUntil] = useState(r.requestedUntil);
  const decide = useMutation({
    mutationFn: (approve) => api.post(`/owner/extensions/${r.id}/decide`, { approve, until }),
    onSuccess: (_x, approve) => {
      toast.success(approve ? "Due date extended" : "Request declined");
      ["extensions", "rent", "rent-due", "summary"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-ink-900/5 py-4 last:border-0">
      <div className="min-w-52 flex-1">
        <div className="font-semibold">{r.tenant.name} <span className="text-xs font-medium text-ink-900/50">Room {r.tenant.room}</span></div>
        <div className="text-sm text-ink-900/60">{monthLabel(r.month)} rent, due {dueLabel(r.currentUntil)}. "{r.reason}"</div>
      </div>
      <input className="input !w-auto" type="date" min={addDaysYmd(r.currentUntil, 1)} value={until} onChange={(e) => setUntil(e.target.value)} />
      <button className="btn-gold" disabled={decide.isPending} onClick={() => decide.mutate(true)}>Approve</button>
      <button className="btn-ghost" disabled={decide.isPending} onClick={() => decide.mutate(false)}>Decline</button>
    </div>
  );
}

export default function ExtensionRequests() {
  const { data = [] } = useQuery({ queryKey: ["extensions"], queryFn: async () => (await api.get("/owner/extensions")).data, refetchInterval: 15000 });
  if (data.length === 0) return null;
  return (
    <div className="card">
      <h2 className="text-lg font-extrabold">Extension requests ({data.length})</h2>
      <p className="text-sm text-ink-900/60">You can change the date before approving. Reminders pause until the new date.</p>
      {data.map((r) => <Row key={r.id} r={r} />)}
    </div>
  );
}