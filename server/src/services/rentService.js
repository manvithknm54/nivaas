import RentDue from "../models/RentDue.js";
import User from "../models/User.js";
import { todayIST } from "../utils/dates.js";

export const r2 = (n) => Math.round(n * 100) / 100;

export const summarize = (due, entries) => {
  let paid = 0;
  let credits = 0;
  for (const e of entries) {
    const sign = e.type === "reversal" ? -1 : 1;
    const kind = e.type === "reversal" ? e.reversedType : e.type;
    if (kind === "payment") paid += sign * e.amount;
    else credits += sign * e.amount;
  }
  paid = r2(paid);
  credits = r2(credits);
  const balance = r2(due.amount - paid - credits);
  const status = balance <= 0 ? "paid" : paid + credits > 0 ? "partial" : "unpaid";
  const overdue = balance > 0 && todayIST() > (due.extendedUntil || due.dueOn);
  return { paid, credits, balance, status, overdue };
};

export const groupEntries = (entries) => {
  const map = new Map();
  for (const e of entries) {
    const k = String(e.due);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(e);
  }
  return map;
};

export const rowOf = (due, entries) => ({
  id: due._id,
  month: due.month,
  amount: due.amount,
  dueOn: due.dueOn,
  extendedUntil: due.extendedUntil,
  ...summarize(due, entries),
});

export const entryViews = (entries) => {
  const reversed = new Set(entries.filter((e) => e.type === "reversal").map((e) => String(e.reverses)));
  return [...entries]
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((e) => ({
      id: e._id,
      type: e.type,
      reversedType: e.reversedType,
      amount: e.amount,
      method: e.method,
      note: e.note,
      createdAt: e.createdAt,
      reversed: reversed.has(String(e._id)),
    }));
};

// Safe to run any number of times: upsert + unique index (tenant, month).
export const generateDuesForPg = async (pg, month) => {
  const [y, m] = month.split("-").map(Number);
  const endOfMonth = new Date(Date.UTC(y, m, 1));
  const tenants = await User.find({
    pg: pg._id,
    role: "tenant",
    status: "active",
    room: { $ne: null },
    joinedOn: { $lt: endOfMonth },
  }).populate("room", "type");

  const fees = Object.fromEntries(pg.roomTypes.map((t) => [t.key, t.monthlyFee]));
  const dueOn = `${month}-${String(pg.rentDueDay).padStart(2, "0")}`;

  const ops = tenants
    .filter((t) => t.room && fees[t.room.type] != null)
    .map((t) => ({
      updateOne: {
        filter: { tenant: t._id, month },
        update: { $setOnInsert: { pg: pg._id, tenant: t._id, month, amount: fees[t.room.type], dueOn } },
        upsert: true,
      },
    }));

  if (!ops.length) return { created: 0 };
  const result = await RentDue.bulkWrite(ops);
  return { created: result.upsertedCount };
};