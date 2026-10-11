import { z } from "zod";
import Bill from "../models/Bill.js";
import Notification from "../models/Notification.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { todayIST, daysBetween, ymdRe } from "../utils/dates.js";

const view = (b) => ({
  id: b._id, name: b.name, amount: b.amount, expiresOn: b.expiresOn, remindDaysBefore: b.remindDaysBefore,
  daysLeft: daysBetween(todayIST(), b.expiresOn), history: [...b.history].reverse().slice(0, 5),
});

export const listBills = asyncHandler(async (req, res) => {
  res.json((await Bill.find({ pg: req.pg._id }).sort({ expiresOn: 1 })).map(view));
});

export const createBill = asyncHandler(async (req, res) => {
  const d = z.object({
    name: z.string().trim().min(2, "Give the bill a name").max(60),
    expiresOn: z.string().regex(ymdRe, "Pick the expiry date"),
    remindDaysBefore: z.number().int().min(0).max(30).default(3),
    amount: z.number().min(0).optional(),
  }).parse(req.body);
  res.status(201).json(view(await Bill.create({ ...d, pg: req.pg._id })));
});

export const renewBill = asyncHandler(async (req, res) => {
  const d = z.object({ expiresOn: z.string().regex(ymdRe, "Pick the new expiry date"), amount: z.number().min(0).optional() }).parse(req.body);
  if (d.expiresOn <= todayIST()) throw new ApiError(400, "The new expiry date must be in the future");
  const bill = await Bill.findOne({ _id: req.params.id, pg: req.pg._id });
  if (!bill) throw new ApiError(404, "Bill not found");
  bill.history.push({ renewedOn: todayIST(), expiresOn: d.expiresOn, amount: d.amount });
  bill.expiresOn = d.expiresOn;
  bill.lastRemindedOn = null;
  await bill.save();
  await Notification.updateOne({ user: req.user._id, key: `bill:${bill._id}` }, { $set: { read: true } });
  res.json(view(bill));
});

export const deleteBill = asyncHandler(async (req, res) => {
  const bill = await Bill.findOneAndDelete({ _id: req.params.id, pg: req.pg._id });
  if (!bill) throw new ApiError(404, "Bill not found");
  await Notification.deleteOne({ user: req.user._id, key: `bill:${bill._id}` });
  res.json({ ok: true });
});