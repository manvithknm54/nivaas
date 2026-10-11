import cron from "node-cron";
import Pg from "../models/Pg.js";
import { generateDuesForPg } from "../services/rentService.js";
import { runRentReminders, runBillReminders } from "../services/reminderService.js";
import { currentMonth } from "../utils/dates.js";

const safe = (name, fn) => async () => {
  try { await fn(); } catch (err) { console.error(`[${name}] failed`, err); }
};

const monthly = safe("dues", async () => {
  const month = currentMonth();
  for (const pg of await Pg.find()) {
    const { created } = await generateDuesForPg(pg, month);
    if (created) console.log(`[dues] ${pg.name}: ${created} new for ${month}`);
  }
});

const hourly = safe("reminders", async () => {
  const rent = await runRentReminders();
  const bills = await runBillReminders();
  if (rent || bills) console.log(`[reminders] rent: ${rent}, bills: ${bills}`);
});

export const startScheduler = () => {
  const tz = { timezone: "Asia/Kolkata" };
  cron.schedule("5 0 1 * *", monthly, tz); // dues: 1st of month, 12:05 AM IST
  cron.schedule("0 * * * *", hourly, tz); // reminders: every hour, the job itself enforces 8-9 and the 5h gap
  monthly(); // catch-up if the server was off
  hourly();
};