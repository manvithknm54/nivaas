// Date and time helpers for meal polls
export const todayYmd = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

export const dayLabel = (ymd) =>
  new Date(`${ymd}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

export const relDay = (ymd) => {
  const diff = Math.round(
    (new Date(`${ymd}T00:00:00`) -
      new Date(`${todayYmd()}T00:00:00`)) /
      86400000
  );
  return diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : null;
};

export const optionLabel = (o) =>
  ({ veg: "Veg", egg: "Egg", nonveg: "Non-veg" })[o] || o;

export const time12 = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${
    h >= 12 ? "PM" : "AM"
  }`;
};

// Currency helper
export const inr = (n) =>
  "₹" +
  Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

// Current month in YYYY-MM format (IST)
export const thisMonth = () =>
  new Date()
    .toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
    .slice(0, 7);

// Format month and year
export const monthLabel = (m) =>
  new Date(`${m}-01T00:00:00`).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

// Shift month forward or backward
export const shiftMonth = (m, d) => {
  const [y, mo] = m.split("-").map(Number);
  const dt = new Date(y, mo - 1 + d, 1);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
};

// Format an ISO date
export const dateLabel = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

// Format rent due date
export const dueLabel = (s) => dateLabel(`${s}T00:00:00`);

export const addDaysYmd = (ymd, n) => {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export const daysBetweenYmd = (a, b) =>
  Math.round((new Date(`${b}T00:00:00Z`) - new Date(`${a}T00:00:00Z`)) / 86400000);

export const timeAgo = (iso) => {
  const m = Math.round((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
};

export const CATEGORIES = [
  ["water", "Water"], ["electricity", "Electricity"], ["wifi", "WiFi"], ["food", "Food"],
  ["cleaning", "Cleaning"], ["furniture", "Furniture"], ["other", "Other"],
];
export const categoryLabel = (k) => CATEGORIES.find(([v]) => v === k)?.[1] ?? k;