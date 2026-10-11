import { NavLink, Outlet } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Shell({ nav, subtitle }) {
  const { user, logout } = useAuth();
  const desktop = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
      isActive ? "bg-gold-400 text-ink-950" : "text-ink-100/70 hover:bg-white/5"
    }`;
  const mobile = ({ isActive }) =>
    `flex flex-col items-center gap-1 px-3 py-1 text-[11px] font-semibold ${isActive ? "text-gold-400" : "text-ink-100/60"}`;

  return (
    <div className="min-h-screen md:flex">
      <aside className="sticky top-0 hidden h-screen w-64 flex-col bg-ink-950 p-6 text-ink-100 md:flex">
        <div className="text-2xl font-extrabold text-gold-400">Nivaas</div>
        <div className="mt-1 truncate text-xs text-ink-100/50">{subtitle}</div>
        <nav className="mt-10 flex-1 space-y-1">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={desktop}><Icon size={18} />{label}</NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 pt-4">
          <div className="truncate text-sm font-semibold">{user.name}</div>
          <button onClick={logout} className="mt-2 flex items-center gap-2 text-xs text-ink-100/60 hover:text-gold-400">
            <LogOut size={14} /> Log out
          </button>
        </div>
      </aside>

      <main className="mx-auto w-full max-w-6xl flex-1 p-5 pb-24 md:p-10">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 flex justify-around bg-ink-950 py-2 md:hidden">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={mobile}><Icon size={20} />{label}</NavLink>
        ))}
      </nav>
    </div>
  );
}