export const todayIST = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // YYYY-MM-DD

export const currentMonth = () => todayIST().slice(0, 7);

export const monthRe = /^\d{4}-(0[1-9]|1[0-2])$/;