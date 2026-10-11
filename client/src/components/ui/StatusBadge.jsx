const styles = {
  paid: "bg-emerald-100 text-emerald-700",
  partial: "bg-amber-100 text-amber-700",
  unpaid: "bg-ink-900/10 text-ink-900/70",
  overdue: "bg-red-100 text-red-600",
};
const labels = { paid: "Paid", partial: "Partial", unpaid: "Pending", overdue: "Overdue" };

export default function StatusBadge({ status, overdue }) {
  const key = overdue ? "overdue" : status;
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${styles[key]}`}>{labels[key]}</span>;
}