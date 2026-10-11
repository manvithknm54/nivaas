import RentDue from "../models/RentDue.js";
import RentEntry from "../models/RentEntry.js";
import Bill from "../models/Bill.js";
import Pg from "../models/Pg.js";
import { summarize, groupEntries } from "./rentService.js";
import { notify } from "./notifyService.js";
import { todayIST, nowIST, addDays, daysBetween } from "../utils/dates.js";

const EVERY_MS = 4.5 * 3600 * 1000; // hourly job + 4.5h gap = sends at ~8am, 1pm, 6pm
const inr = (n) => "₹" + Number(n).toLocaleString("en-IN");

// Rent: from the due date until paid or extended. Only between 8:00 and 21:00 IST.
export const runRentReminders = async () => {
  const hhmm = nowIST();
  if (hhmm < "08:00" || hhmm >= "21:00") return 0;
  const today = todayIST();
  const since = addDays(today, -190).slice(0, 7);

  const dues = await RentDue.find({
    month: { $gte: since },
    $and: [
      { $or: [{ extendedUntil: null, dueOn: { $lte: today } }, { extendedUntil: { $lte: today } }] },
      { $or: [{ lastReminderAt: null }, { lastReminderAt: { $lte: new Date(Date.now() - EVERY_MS) } }] },
    ],
  }).populate("tenant", "name email status");

  const by = groupEntries(await RentEntry.find({ due: { $in: dues.map((d) => d._id) } }));
  let sent = 0;
  for (const due of dues) {
    if (!due.tenant || due.tenant.status !== "active") continue;
    const { balance } = summarize(due, by.get(String(due._id)) || []);
    if (balance <= 0) continue;
    await notify({
      user: due.tenant._id, kind: "rent_due", key: `rent:${due._id}`, link: "/app/rent", email: true,
      title: `Rent pending: ${inr(balance)}`,
      body: `Your rent for ${due.month} was due on ${due.extendedUntil || due.dueOn}. Please pay your owner, or ask for more time in the app.`,
    });
    await RentDue.updateOne({ _id: due._id }, { $set: { lastReminderAt: new Date() } });
    sent++;
  }
  return sent;
};

// Bills: from N days before expiry, once a day, until renewed. After 9:00 IST.
export const runBillReminders = async () => {
  if (nowIST() < "09:00") return 0;
  const today = todayIST();
  const bills = await Bill.find({ lastRemindedOn: { $ne: today } });
  let sent = 0;
  for (const b of bills) {
    const left = daysBetween(today, b.expiresOn);
    if (left > b.remindDaysBefore) continue;
    const pg = await Pg.findById(b.pg).select("owner");
    if (!pg) continue;
    const when = left > 1 ? `in ${left} days` : left === 1 ? "tomorrow" : left === 0 ? "today" : `${-left} day${left === -1 ? "" : "s"} ago`;
    await notify({
      user: pg.owner, kind: "bill", key: `bill:${b._id}`, link: "/owner/bills", email: true,
      title: left < 0 ? `${b.name} expired ${when}` : `${b.name} expires ${when}`,
      body: "Renew it, then mark it as renewed in Nivaas to stop these reminders.",
    });
    await Bill.updateOne({ _id: b._id }, { $set: { lastRemindedOn: today } });
    sent++;
  }
  return sent;
};