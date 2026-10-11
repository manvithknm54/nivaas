import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "../../api/axios";
import { usePg } from "../../api/hooks";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function Settings() {
  const qc = useQueryClient();
  const { data: pg } = usePg();
  const [form, setForm] = useState({
    name: pg.name,
    address: pg.address || "",
    leaveRatePerWeek: pg.leaveRatePerWeek,
    rentDueDay: pg.rentDueDay,
    fees: Object.fromEntries(pg.roomTypes.map((t) => [t.key, t.monthlyFee])),
    mealCutoff: pg.mealCutoff || "08:00",
    mealByDay: Object.fromEntries(DAYS.map((_, i) => [i, pg.mealDays?.find((d) => d.weekday === i)?.option || ""])),
  });

  const save = useMutation({
    mutationFn: () =>
      api.patch("/owner/pg", {
        name: form.name,
        address: form.address,
        leaveRatePerWeek: Number(form.leaveRatePerWeek),
        rentDueDay: Number(form.rentDueDay),
        fees: Object.fromEntries(Object.entries(form.fees).map(([k, v]) => [k, Number(v)])),
        mealCutoff: form.mealCutoff,
        mealDays: Object.entries(form.mealByDay)
          .filter(([, option]) => option)
          .map(([weekday, option]) => ({ weekday: Number(weekday), option })),
      }),
    onSuccess: () => {
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["pg"] });
      qc.invalidateQueries({ queryKey: ["meals"] });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-3xl font-extrabold">Settings</h1>
      <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-6">
        <div className="card space-y-4">
          <h2 className="font-extrabold">PG details</h2>
          <div><label className="label">Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Address</label><input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-extrabold">Monthly fees (food included)</h2>
          {pg.roomTypes.map((t) => (
            <div key={t.key}><label className="label">{t.label}</label>
              <input className="input" type="number" min="0" value={form.fees[t.key]} onChange={(e) => setForm({ ...form, fees: { ...form.fees, [t.key]: e.target.value } })} /></div>
          ))}
        </div>

        <div className="card grid gap-4 sm:grid-cols-2">
          <div><label className="label">Leave deduction per week (₹)</label><input className="input" type="number" min="0" value={form.leaveRatePerWeek} onChange={(e) => setForm({ ...form, leaveRatePerWeek: e.target.value })} /></div>
          <div><label className="label">Rent due day of month</label><input className="input" type="number" min="1" max="28" value={form.rentDueDay} onChange={(e) => setForm({ ...form, rentDueDay: e.target.value })} /></div>
        </div>

        <div className="card space-y-4">
          <div>
            <h2 className="font-extrabold">Meal polls</h2>
            <p className="mt-1 text-sm text-ink-900/60">Pick the days that have a special item. Other days are veg for everyone and need no poll.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {DAYS.map((d, i) => (
              <div key={d} className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">{d}</span>
                <select className="input !w-auto" value={form.mealByDay[i]} onChange={(e) => setForm({ ...form, mealByDay: { ...form.mealByDay, [i]: e.target.value } })}>
                  <option value="">No poll</option>
                  <option value="egg">Egg</option>
                  <option value="nonveg">Non-veg</option>
                </select>
              </div>
            ))}
          </div>
          <div>
            <label className="label">Voting closes at (on the day)</label>
            <input className="input !w-auto" type="time" value={form.mealCutoff} onChange={(e) => setForm({ ...form, mealCutoff: e.target.value })} />
          </div>
        </div>

        <button className="btn-gold" disabled={save.isPending}>Save changes</button>
      </form>
    </div>
  );
}