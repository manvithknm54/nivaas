import { useEffect } from "react";
import { Home, IndianRupee } from "lucide-react";
import Shell from "../../components/layout/Shell";
import { useAuth } from "../../context/AuthContext";

const nav = [
  { to: "/app", label: "Home", icon: Home, end: true },
  { to: "/app/rent", label: "Rent", icon: IndianRupee },
];

export function TenantLayout() {
  const { user } = useAuth();
  return <Shell nav={nav} subtitle={user.pgName || "Not in a PG yet"} />;
}

export function TenantHome() {
  const { user, refresh } = useAuth();

  useEffect(() => {
    refresh();
    if (user.status !== "pending") return;
    const id = setInterval(refresh, 10000);
    return () => clearInterval(id);
  }, [user.status]);

  const messages = {
    unassigned: ["You're not in a PG yet", "Scan the QR code your PG owner shows you, or open the invite link they send."],
    pending: ["Request sent", `Waiting for the owner of ${user.pgName || "the PG"} to approve you.`],
    active: [`Welcome to ${user.pgName}`, "Check the Rent tab for your dues. Meals and leaves are coming soon."],
    left: ["You've left this PG", "Ask your owner for a new invite if this is a mistake."],
  };
  const [title, body] = messages[user.status];

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Hi, {user.name.split(" ")[0]}</h1>
      <div className="card mt-8">
        <h2 className="text-xl font-extrabold">{title}</h2>
        <p className="mt-2 text-ink-900/60">{body}</p>
      </div>
    </div>
  );
}