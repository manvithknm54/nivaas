import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Copy, Lock, Unlock } from "lucide-react";
import { api } from "../../api/axios";
import { dayLabel, relDay, optionLabel, time12 } from "../../lib/format";
import { useDialog } from "../../components/ui/DialogProvider";

const stateStyle = {
  open: ["Voting open", "bg-emerald-100 text-emerald-700"],
  upcoming: ["Opens soon", "bg-ink-900/10 text-ink-900/60"],
  closed: ["Voting closed", "bg-amber-100 text-amber-700"],
  locked: ["Locked for chef", "bg-ink-950 text-gold-400"],
};

function PollCard({ p }) {
  const qc = useQueryClient();
  const { confirmAction } = useDialog();
  const [stateLabel, stateCls] = stateStyle[p.state];
  const special = optionLabel(p.option);
  const done = p.state === "locked" || p.state === "closed";
  const refresh = () => qc.invalidateQueries({ queryKey: ["meals"] });

  const lock = useMutation({
    mutationFn: (locked) => api.post(`/owner/meals/${p.id}/lock`, { locked }),
    onSuccess: (_r, locked) => { toast.success(locked ? "Locked. Counts are final." : "Reopened for voting"); refresh(); },
    onError: (e) => toast.error(e.message),
  });

  const askLock = async () => {
    const ok = await confirmAction({
      title: `Lock ${dayLabel(p.date)}?`,
      message: `Voting closes and the counts become final. ${p.pending.length} ${p.pending.length === 1 ? "person hasn't" : "people haven't"} voted and will be counted by their diet.`,
      confirmText: "Lock and finalise",
    });
    if (ok) lock.mutate(true);
  };

  const copyForChef = () => {
    const text = `*${dayLabel(p.date)}*\nVeg: ${p.veg}\n${special}: ${p.special}\nTotal: ${p.total}`;
    navigator.clipboard.writeText(text);
    toast.success("Copied. Paste it to the chef on WhatsApp.");
  };

  const pct = p.total ? Math.round((p.special / p.total) * 100) : 0;

  return (
    <div className="card space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold">{dayLabel(p.date)}</h2>
            {relDay(p.date) && <span className="rounded-full bg-gold-400/30 px-2.5 py-0.5 text-[11px] font-bold">{relDay(p.date)}</span>}
          </div>
          <div className="text-sm text-ink-900/60">{special} day · {p.voted} of {p.total} voted{p.away ? ` · ${p.away} on leave` : ""}</div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${stateCls}`}>{stateLabel}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-sand-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-900/50">Veg</div>
          <div className="mt-1 text-4xl font-extrabold">{p.veg}</div>
        </div>
        <div className="rounded-xl bg-ink-950 p-4 text-ink-100">
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-100/50">{special}</div>
          <div className="mt-1 text-4xl font-extrabold text-gold-400">{p.special}</div>
        </div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-ink-900/10">
        <div className="h-full rounded-full bg-gold-400 transition-all" style={{ width: `${pct}%` }} />
      </div>

      {p.pending.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer font-semibold text-ink-900/60">Yet to vote ({p.pending.length}). Counted by their diet.</summary>
          <p className="mt-2 text-ink-900/60">{p.pending.join(", ")}</p>
        </details>
      )}

      <div className="flex flex-wrap gap-2">
        <button className="btn-ghost" onClick={copyForChef}><Copy size={16} /> Copy for chef</button>
        {p.locked ? (
          <button className="btn-ghost" disabled={lock.isPending} onClick={() => lock.mutate(false)}><Unlock size={16} /> Reopen voting</button>
        ) : (
          !done && <button className="btn-gold" disabled={lock.isPending} onClick={askLock}><Lock size={16} /> Lock and finalise</button>
        )}
      </div>
    </div>
  );
}

export default function Meals() {
  const { data, isLoading } = useQuery({
    queryKey: ["meals"],
    queryFn: async () => (await api.get("/owner/meals")).data,
    refetchInterval: 10000,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold">Meals</h1>
        {data && <p className="mt-1 text-ink-900/60">Tenants vote from the day before until {time12(data.cutoff)} on the day. Change this in Settings.</p>}
      </div>

      {isLoading ? (
        <div className="text-sm text-ink-900/50">Loading…</div>
      ) : data.polls.length === 0 ? (
        <div className="card text-center text-ink-900/50">No special meal days are set. Add them in Settings, under Meal polls.</div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {data.polls.map((p) => <PollCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}