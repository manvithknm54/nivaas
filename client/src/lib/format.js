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