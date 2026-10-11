const tones = {
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-600",
  ink: "bg-ink-900/10 text-ink-900/70",
  gold: "bg-gold-400/30 text-ink-900",
  dark: "bg-ink-950 text-gold-400",
};

export default function Pill({ tone = "ink", children }) {
  return <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${tones[tone]}`}>{children}</span>;
}