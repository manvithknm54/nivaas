import { useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Home, IndianRupee, Utensils, Plane, MessageSquare, ArrowRight } from "lucide-react";
import Shell from "../../components/layout/Shell";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/axios";
import { inr } from "../../lib/format";

const home = { to: "/app", label: "Home", icon: Home, end: true };
const full = [
  home,
  { to: "/app/rent", label: "Rent", icon: IndianRupee },
  { to: "/app/meals", label: "Meals", icon: Utensils },
  { to: "/app/leaves", label: "Leaves", icon: Plane },
  { to: "/app/complaints", label: "Complaints", icon: MessageSquare },
];

export function TenantLayout() {
  const { user, refresh } = useAuth();
  // keeps the menu in sync when the owner approves or removes you
  useEffect(() => {
    const id = setInterval(refresh, 15000);
    return () => clearInterval(id);
  }, []);
  return <Shell nav={user.status === "active" ? full : [home]} subtitle={user.pgName || "Not in a PG yet"} />;
}

// Only approved tenants may open these pages, even by typing the URL.
export function ActiveOnly({ children }) {
  const { user } = useAuth();
  return user.status === "active" ? children : <Navigate to="/app" replace />;
}

export function TenantHome() {
  const { user } = useAuth();
  const active = user.status === "active";
  const { data: dues = [] } = useQuery({
    queryKey: ["my-rent"],
    queryFn: async () => (await api.get("/tenant/rent")).data,
    enabled: active,
    refetchInterval: 15000,
  });
  const pending = dues.reduce((s, r) => s + r.balance, 0);
  const overdue = dues.some((r) => r.overdue);

  const messages = {
    unassigned: ["You're not in a PG yet", "Scan the QR code your PG owner shows you, or open the invite link they send."],
    pending: ["Request sent", `Waiting for the owner of ${user.pgName || "the PG"} to approve you.`],
    active: [`Welcome to ${user.pgName}`, "Use the menu for rent, meals, leaves and complaints."],
    left: ["You've left this PG", "Ask your owner for a new invite if this is a mistake."],
  };
  const [title, body] = messages[user.status];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">Hi, {user.name.split(" ")[0]}</h1>
      <div className="card">
        <h2 className="text-xl font-extrabold">{title}</h2>
        <p className="mt-2 text-ink-900/60">{body}</p>
      </div>
      {active && pending > 0 && (
        <Link to="/app/rent" className="card flex items-center justify-between !bg-ink-950 !text-ink-100">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-100/50">{overdue ? "Rent overdue" : "Rent pending"}</div>
            <div className="mt-1 text-3xl font-extrabold text-gold-400">{inr(pending)}</div>
          </div>
          <ArrowRight className="text-gold-400" />
        </Link>
      )}
    </div>
  );
}