import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "../../api/axios";
import { addDaysYmd, dueLabel } from "../../lib/format";

export default function DueDateControl({ due, onChanged }) {
  const current = due.extendedUntil || due.dueOn;
  const [until, setUntil] = useState(addDaysYmd(current, 7));
  const save = useMutation({
    mutationFn: () => api.post(`/owner/rent/${due.id}/extend`, { until }),
    onSuccess: () => { toast.success(`Due date moved to ${dueLabel(until)}`); onChanged(); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-xl bg-sand-50 p-3">
      <div className="min-w-40 flex-1">
        <label className="label">Change due date (currently {dueLabel(current)})</label>
        <input className="input" type="date" min={addDaysYmd(current, 1)} value={until} onChange={(e) => setUntil(e.target.value)} />
      </div>
      <button className="btn-ghost" disabled={save.isPending} onClick={() => save.mutate()}>Set date</button>
    </div>
  );
}