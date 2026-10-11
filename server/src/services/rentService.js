import RentDue from "../models/RentDue.js";
import RentEntry from "../models/RentEntry.js";
import LeaveRequest from "../models/LeaveRequest.js";
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

const owing = { status: "approved", $expr: { $lt: ["$creditApplied", "$creditTotal"] } };

// Posts approved-leave credit onto the earliest open dues. Never pushes a balance below zero;
// whatever is left waits and is applied when the next due is generated.
export const applyLeaveCredits = async (tenantId) => {
  const leaves = await LeaveRequest.find({ tenant: tenantId, ...owing }).sort({ createdAt: 1 });
  for (const leave of leaves) {
    let left = r2(leave.creditTotal - leave.creditApplied);
    const dues = await RentDue.find({ tenant: tenantId, month: { $gte: leave.leaveOn.slice(0, 7) } }).sort({ month: 1 });
    for (const due of dues) {
      if (left < 0.01) break;
      const { balance } = summarize(due, await RentEntry.find({ due: due._id }));
      const amount = r2(Math.min(left, balance));
      if (amount < 0.01) continue;
      await RentEntry.create({
        pg: leave.pg, tenant: tenantId, due: due._id, type: "credit", amount,
        note: `Leave ${leave.leaveOn} to ${leave.returnOn}`, leave: leave._id, recordedBy: leave.decidedBy,
      });
      left = r2(left - amount);
      leave.creditApplied = r2(leave.creditApplied + amount);
    }
    await leave.save();
  }
};

// Cancelling a leave reverses its credits (append-only: nothing is deleted).
export const reverseLeaveCredits = async (leave, userId) => {
  const entries = await RentEntry.find({ leave: leave._id, type: "credit" });
  for (const e of entries) {
    if (await RentEntry.exists({ reverses: e._id })) continue;
    await RentEntry.create({
      pg: e.pg, tenant: e.tenant, due: e.due, type: "reversal", reversedType: "credit",
      reverses: e._id, amount: e.amount, method: "other", note: "Leave cancelled", recordedBy: userId,
    });
  }
};

// Safe to run any number of times: upsert + unique index (tenant, month).
export const generateDuesForPg = async (pg, month) => {
  const [y, m] = month.split("-").map(Number);
  const endOfMonth = new Date(Date.UTC(y, m, 1));
  const tenants = await User.find({
    pg: pg._id, role: "tenant", status: "active", room: { $ne: null }, joinedOn: { $lt: endOfMonth },
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

  const created = ops.length ? (await RentDue.bulkWrite(ops)).upsertedCount : 0;
  for (const id of await LeaveRequest.distinct("tenant", { pg: pg._id, ...owing })) await applyLeaveCredits(id);
  return { created };
};