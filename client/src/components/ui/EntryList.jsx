import { inr, dateLabel } from "../../lib/format";

export default function EntryList({ entries, onReverse }) {
  if (!entries.length) return <p className="text-sm text-ink-900/50">Nothing recorded yet.</p>;
  return (
    <ul className="divide-y divide-ink-900/5">
      {entries.map((e) => {
        const isRev = e.type === "reversal";
        const label = isRev ? `Reversed ${e.reversedType}` : e.type === "credit" ? "Credit" : "Payment";
        return (
          <li key={e.id} className={`flex items-center gap-3 py-3 text-sm ${e.reversed ? "opacity-50" : ""}`}>
            <div className="flex-1">
              <div className={`font-semibold ${e.reversed ? "line-through" : ""}`}>
                {label}{e.type === "payment" ? ` · ${e.method.toUpperCase()}` : ""}
              </div>
              <div className="text-xs text-ink-900/50">{dateLabel(e.createdAt)}{e.note ? ` · ${e.note}` : ""}</div>
            </div>
            <div className={`font-bold ${isRev ? "text-red-600" : ""}`}>{isRev ? "−" : ""}{inr(e.amount)}</div>
            {onReverse && !e.reversed && !isRev && (
              <button className="text-xs font-semibold text-ink-900/40 hover:text-red-500" onClick={() => onReverse(e)}>Reverse</button>
            )}
          </li>
        );
      })}
    </ul>
  );
}