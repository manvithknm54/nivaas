import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";
import { api } from "../../api/axios";
import { usePg } from "../../api/hooks";

export default function Rooms() {
  const qc = useQueryClient();
  const { data: pg } = usePg();
  const { data: rooms = [] } = useQuery({ queryKey: ["rooms"], queryFn: async () => (await api.get("/owner/rooms")).data });
  const [form, setForm] = useState({ number: "", type: "hall", beds: 1 });
  const refresh = () => qc.invalidateQueries({ queryKey: ["rooms"] });

  const add = useMutation({
    mutationFn: () => api.post("/owner/rooms", { ...form, beds: Number(form.beds) }),
    onSuccess: () => { toast.success("Room added"); setForm({ ...form, number: "" }); refresh(); },
    onError: (e) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id) => api.delete(`/owner/rooms/${id}`),
    onSuccess: refresh,
    onError: (e) => toast.error(e.message),
  });
  const typeOf = (k) => pg.roomTypes.find((t) => t.key === k);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-extrabold">Rooms</h1>
      <form onSubmit={(e) => { e.preventDefault(); add.mutate(); }} className="card grid gap-4 md:grid-cols-4">
        <div><label className="label">Room number</label><input className="input" required value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} /></div>
        <div><label className="label">Type</label>
          <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {pg.roomTypes.map((t) => <option key={t.key} value={t.key}>{t.label} · ₹{t.monthlyFee}</option>)}
          </select></div>
        <div><label className="label">Beds</label><input className="input" type="number" min="1" max="20" value={form.beds} onChange={(e) => setForm({ ...form, beds: e.target.value })} /></div>
        <div className="flex items-end"><button className="btn-gold w-full" disabled={add.isPending}>Add room</button></div>
      </form>

      {rooms.length === 0 ? (
        <div className="card text-center text-ink-900/50">No rooms yet. Add your first room above.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((r) => (
            <div key={r._id} className="card">
              <div className="flex items-start justify-between">
                <div className="text-2xl font-extrabold">Room {r.number}</div>
                <button onClick={() => confirm(`Delete room ${r.number}?`) && del.mutate(r._id)} className="text-ink-900/30 hover:text-red-500"><Trash2 size={18} /></button>
              </div>
              <div className="mt-1 text-sm text-ink-900/60">{typeOf(r.type)?.label}</div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="font-semibold">₹{typeOf(r.type)?.monthlyFee}/month</span>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${r.occupied >= r.beds ? "bg-ink-900/10" : "bg-gold-400/30"}`}>{r.occupied}/{r.beds} beds</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}