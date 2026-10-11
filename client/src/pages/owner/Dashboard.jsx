import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { api } from "../../api/axios";
import { usePg } from "../../api/hooks";
import { inr, thisMonth } from "../../lib/format";

export default function Dashboard() {
  const { data: pg } = usePg();
  const { data: rooms = [] } = useQuery({ queryKey: ["rooms"], queryFn: async () => (await api.get("/owner/rooms")).data });
  const { data: rent } = useQuery({
    queryKey: ["rent", thisMonth()],
    queryFn: async () => (await api.get("/owner/rent", { params: { month: thisMonth() } })).data,
    refetchInterval: 15000,
  });
  const { data: s } = useQuery({ queryKey: ["summary"], queryFn: async () => (await api.get("/owner/summary")).data, refetchInterval: 15000 });

  const beds = rooms.reduce((n, r) => n + r.beds, 0);
  const occupied = rooms.reduce((n, r) => n + r.occupied, 0);
  const stats = [
    ["Beds occupied", `${occupied}/${beds}`],
    ["Collected this month", inr(rent?.totals.collected)],
    ["Outstanding", inr(rent?.totals.outstanding)],
    ["Overdue tenants", rent?.totals.overdueCount ?? 0],
  ];

  const items = s
    ? [
        [s.joins, "join requests waiting", "/owner/tenants"],
        [s.leaves, "leave requests to review", "/owner/leaves"],
        [s.extensions, "rent extension requests", "/owner/rent"],
        [s.complaints, "open complaints", "/owner/complaints"],
        ...s.billsDue.map((b) => [1, b.daysLeft < 0 ? `${b.name} has expired` : `${b.name} expires in ${b.daysLeft} day${b.daysLeft === 1 ? "" : "s"}`, "/owner/bills"]),
      ].filter(([n]) => n > 0)
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold">{pg.name}</h1>
        <p className="mt-1 text-ink-900/60">Here's how your PG looks today.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(([l, v]) => (
          <div key={l} className="card">
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-900/50">{l}</div>
            <div className="mt-2 text-2xl font-extrabold">{v}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="text-lg font-extrabold">Needs your attention</h2>
        {items.length === 0 ? (
          <div className="mt-4 flex items-center gap-3 text-ink-900/60"><CheckCircle2 className="text-emerald-500" /> All clear. Nothing is waiting on you.</div>
        ) : (
          <div className="mt-2 divide-y divide-ink-900/5">
            {items.map(([n, label, to], i) => (
              <Link key={i} to={to} className="flex items-center gap-4 py-4 transition hover:opacity-70">
                <span className="grid h-9 min-w-9 place-items-center rounded-full bg-gold-400 px-2 text-sm font-extrabold text-ink-950">{n}</span>
                <span className="flex-1 font-semibold">{label}</span>
                <ArrowRight size={18} className="text-ink-900/30" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}