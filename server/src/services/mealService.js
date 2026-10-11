import MealPoll from "../models/MealPoll.js";
import { todayIST, nowIST, addDays, weekdayOf } from "../utils/dates.js";

// upcoming | open | closed | locked
export const pollState = (poll, cutoff) => {
  if (poll.locked) return "locked";
  const today = todayIST();
  if (today < addDays(poll.date, -1)) return "upcoming";
  if (today > poll.date || (today === poll.date && nowIST() >= cutoff)) return "closed";
  return "open";
};

// Pure counting logic: non-voters follow their diet.
export const tally = (option, tenants, voteByTenant) => {
  let veg = 0;
  let special = 0;
  let voted = 0;
  const pending = [];
  for (const t of tenants) {
    const v = voteByTenant.get(String(t._id));
    if (v) voted++;
    else pending.push(t.name);
    const choice = v ?? (t.diet === "nonveg" ? option : "veg");
    if (choice === "veg") veg++;
    else special++;
  }
  return { veg, special, voted, total: tenants.length, pending };
};

// Idempotent: upsert + unique index (pg, date). Safe to call on every request.
export const ensurePolls = async (pg) => {
  const today = todayIST();
  const ops = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(today, i);
    const rule = pg.mealDays.find((d) => d.weekday === weekdayOf(date));
    if (rule) {
      ops.push({
        updateOne: {
          filter: { pg: pg._id, date },
          update: { $setOnInsert: { pg: pg._id, date, option: rule.option } },
          upsert: true,
        },
      });
    }
  }
  if (ops.length) await MealPoll.bulkWrite(ops);
};

export const upcomingPolls = async (pg) => {
  await ensurePolls(pg);
  return MealPoll.find({ pg: pg._id, date: { $gte: todayIST() } }).sort({ date: 1 });
};