export const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

export const thisMonth = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }).slice(0, 7);

export const monthLabel = (m) =>
  new Date(`${m}-01T00:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

export const shiftMonth = (m, d) => {
  const [y, mo] = m.split("-").map(Number);
  const dt = new Date(y, mo - 1 + d, 1);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
};

export const dateLabel = (iso) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
export const dueLabel = (s) => dateLabel(`${s}T00:00:00`);