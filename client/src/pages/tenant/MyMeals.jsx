import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Leaf, Drumstick, Egg, Lock } from "lucide-react";
import { api } from "../../api/axios";
import { dayLabel, relDay, optionLabel, time12 } from "../../lib/format";

const icons = { veg: Leaf, egg: Egg, nonveg: Drumstick };

function Choice({ value, selected, disabled, onPick }) {
  const Icon = icons[value];
  return (
    <button
      disabled={disabled}
      onClick={onPick}
      className={`flex flex-1 flex-col items-center gap-2 rounded-2xl border-2 p-5 text-sm font-bold transition
        ${selected ? "border-gold-500 bg-gold-400/20" : "border-ink-900/10 bg-white hover:border-ink-900/30"}
        disabled:cursor-not-allowed ${disabled && !selected ? "opacity-50" : ""}`}
    >
      <Icon size={24} className={selected ? "text-gold-500" : "text-ink-900/50"} />
      {optionLabel(value)}
    </button>
  );
}

function PollCard({ p, diet }) {
  const qc = useQueryClient();
  const open = p.state === "open";
  const fallback = diet === "nonveg" ? p.option : "veg";

  const vote = useMutation({
    mutationFn: (choice) => api.post(`/tenant/meals/${p.id}/vote`, { choice }),
    onSuccess: (_r, choice) => { toast.success(`${optionLabel(choice)} saved for ${dayLabel(p.date)}`); qc.invalidateQueries({ queryKey: ["my-meals"] }); },
    onError: (e) => { toast.error(e.message); qc.invalidateQueries({ queryKey: ["my-meals"] }); },
  });

  const note = {
    open: p.myChoice ? "You can change your vote until voting closes." : `You haven't voted. We'll go with your diet (${optionLabel(fallback)}).`,
    upcoming: "Voting opens the day before.",
    closed: `Voting is closed. You're down for ${optionLabel(p.myChoice || fallback)}.`,
    locked: `Finalised by the owner. You're down for ${optionLabel(p.myChoice || fallback)}.`,
  }[p.state];

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold">{dayLabel(p.date)}</h2>
            {relDay(p.date) && <span className="rounded-full bg-gold-400/30 px-2.5 py-0.5 text-[11px] font-bold">{relDay(p.date)}</span>}
          </div>
          <div className="text-sm text-ink-900/60">{optionLabel(p.option)} special</div>
        </div>
        {!open && <Lock size={18} className="text-ink-900/30" />}
      </div>
      <div className="flex gap-3">
        {["veg", p.option].map((c) => (
          <Choice key={c} value={c} selected={(p.myChoice ?? (open ? null : fallback)) === c}
            disabled={!open || vote.isPending} onPick={() => vote.mutate(c)} />
        ))}
      </div>
      <p className="text-sm text-ink-900/60">{note}</p>
    </div>
  );
}

export default function MyMeals() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["my-meals"],
    queryFn: async () => (await api.get("/tenant/meals")).data,
    refetchInterval: 10000,
  });

  const setDiet = useMutation({
    mutationFn: (diet) => api.patch("/tenant/profile", { diet }),
    onSuccess: () => { toast.success("Diet updated"); qc.invalidateQueries({ queryKey: ["my-meals"] }); },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <div className="text-sm text-ink-900/50">Loading…</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold">Meals</h1>
        <p className="mt-1 text-ink-900/60">Voting closes at {time12(data.cutoff)} on the day.</p>
      </div>

      <div className="card flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="font-extrabold">My diet</div>
          <div className="text-sm text-ink-900/60">Used when you don't vote.</div>
        </div>
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-ink-900/5 p-1">
          {[["veg", "Veg"], ["nonveg", "Non-veg"]].map(([v, l]) => (
            <button key={v} disabled={setDiet.isPending} onClick={() => data.diet !== v && setDiet.mutate(v)}
              className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${data.diet === v ? "bg-white shadow" : "text-ink-900/50"}`}>{l}</button>
          ))}
        </div>
      </div>

      {data.polls.length === 0 ? (
        <div className="card text-center text-ink-900/50">No special meals scheduled this week.</div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {data.polls.map((p) => <PollCard key={p.id} p={p} diet={data.diet} />)}
        </div>
      )}
    </div>
  );
}