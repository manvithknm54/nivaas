import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import AuthShell from "../../components/layout/AuthShell";
import { useAuth } from "../../context/AuthContext";
import { safeNext } from "./Login";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const next = safeNext(sp.get("next"));
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: next ? "tenant" : "owner" });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await register(form);
      nav(next || (u.role === "owner" ? "/owner" : "/app"), { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="It takes less than a minute.">
      <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-ink-900/5 p-1">
        {[["owner", "I own a PG"], ["tenant", "I stay in a PG"]].map(([v, l]) => (
          <button type="button" key={v} onClick={() => setForm({ ...form, role: v })}
            className={`rounded-lg py-2.5 text-sm font-semibold transition ${form.role === v ? "bg-white shadow" : "text-ink-900/50"}`}>{l}</button>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">Full name</label><input className="input" required value={form.name} onChange={set("name")} /></div>
        <div><label className="label">Email</label><input className="input" type="email" required value={form.email} onChange={set("email")} /></div>
        <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={set("phone")} /></div>
        <div><label className="label">Password (8+ characters)</label><input className="input" type="password" required minLength={8} value={form.password} onChange={set("password")} /></div>
        <button className="btn-gold w-full" disabled={busy}>{busy ? "Creating…" : "Create account"}</button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-900/60">
        Already registered? <Link className="font-semibold text-gold-500" to={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}>Log in</Link>
      </p>
    </AuthShell>
  );
}