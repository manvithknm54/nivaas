import { motion } from "framer-motion";

export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-ink-950 p-12 text-ink-100 lg:flex">
        <div className="text-3xl font-extrabold text-gold-400">Nivaas</div>
        <div>
          <h2 className="text-4xl font-extrabold leading-tight">Your PG,<br />beautifully managed.</h2>
          <p className="mt-4 max-w-sm text-ink-100/60">Rent, meals, leaves and reminders in one calm place.</p>
        </div>
        <div className="text-xs text-ink-100/40">© Nivaas</div>
      </div>
      <div className="grid place-items-center p-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <h1 className="text-3xl font-extrabold">{title}</h1>
          <p className="mt-2 text-ink-900/60">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </motion.div>
      </div>
    </div>
  );
}