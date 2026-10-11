export const todayIST = () =>
  new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  }); // YYYY-MM-DD

export const currentMonth = () => todayIST().slice(0, 7);

export const monthRe = /^\d{4}-(0[1-9]|1[0-2])$/;

// "HH:mm" in IST
export const nowIST = () =>
  new Date().toLocaleTimeString("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

export const addDays = (ymd, n) => {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export const weekdayOf = (ymd) =>
  new Date(`${ymd}T00:00:00Z`).getUTCDay(); // 0 = Sunday

// Returns the number of days between two YYYY-MM-DD dates.
// Example: daysBetween("2026-10-11", "2026-10-18") returns 7.
export const daysBetween = (a, b) =>
  Math.round(
    (new Date(`${b}T00:00:00Z`) - new Date(`${a}T00:00:00Z`)) /
      86400000
  );

// Validates the YYYY-MM-DD date format.
export const ymdRe = /^\d{4}-\d{2}-\d{2}$/;