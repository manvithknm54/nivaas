import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/axios";
import { usePg } from "../../api/hooks";

export default function Dashboard() {
  const { data: pg } = usePg();
  const { data: rooms = [] } = useQuery({ queryKey: ["rooms"], queryFn: async () => (await api.get("/owner/rooms")).data });
  const { data: tenants = [] } = useQuery({ queryKey: ["tenants"], queryFn: async () => (await api.get("/owner/tenants")).data });

  const beds = rooms.reduce((s, r) => s + r.beds, 0);
  const occupied = rooms.reduce((s, r) => s + r.occupied, 0);
  const pending = tenants.filter((t) => t.status === "pending").length;
  const stats = [["Rooms", rooms.length], ["Total beds", beds], ["Occupied", `${occupied}/${beds}`], ["Join requests", pending]];

  return (
    <div>
      <h1 className="text-3xl font-extrabold">{pg.name}</h1>
      <p className="mt-1 text-ink-900/60">Here's how your PG looks today.</p>
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(([l, v]) => (
          <div key={l} className="card">
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-900/50">{l}</div>
            <div className="mt-2 text-3xl font-extrabold">{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}