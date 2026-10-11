import cron from "node-cron";
import Pg from "../models/Pg.js";
import { generateDuesForPg } from "../services/rentService.js";
import { currentMonth } from "../utils/dates.js";

const generateAll = async () => {
  try {
    const month = currentMonth();
    for (const pg of await Pg.find()) {
      const { created } = await generateDuesForPg(pg, month);
      if (created) console.log(`[dues] ${pg.name}: ${created} new for ${month}`);
    }
  } catch (err) {
    console.error("[dues] generation failed", err);
  }
};

export const startScheduler = () => {
  cron.schedule("5 0 1 * *", generateAll, { timezone: "Asia/Kolkata" }); // 1st of month, 12:05 AM IST
  generateAll(); // catch-up on startup, in case the server was off on the 1st
};