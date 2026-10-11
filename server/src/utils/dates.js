export const todayIST = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // YYYY-MM-DD

export const currentMonth = () => todayIST().slice(0, 7);

export const monthRe = /^\d{4}-(0[1-9]|1[0-2])$/;

// "HH:mm" in IST
export const nowIST = () =>
  new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

export const addDays = (ymd, n) => {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export const weekdayOf = (ymd) => new Date(`${ymd}T00:00:00Z`).getUTCDay(); // 0 = Sunday