import User from "../models/User.js";
import LeaveRequest from "../models/LeaveRequest.js";
import ExtensionRequest from "../models/ExtensionRequest.js";
import Complaint from "../models/Complaint.js";
import Bill from "../models/Bill.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { todayIST, daysBetween } from "../utils/dates.js";

export const summary = asyncHandler(async (req, res) => {
  const pg = req.pg._id;
  const [joins, leaves, extensions, complaints, bills] = await Promise.all([
    User.countDocuments({ pg, role: "tenant", status: "pending" }),
    LeaveRequest.countDocuments({ pg, status: "pending" }),
    ExtensionRequest.countDocuments({ pg, status: "pending" }),
    Complaint.countDocuments({ pg, status: { $in: ["open", "in_progress"] } }),
    Bill.find({ pg }),
  ]);
  const today = todayIST();
  const billsDue = bills
    .map((b) => ({ name: b.name, daysLeft: daysBetween(today, b.expiresOn), window: b.remindDaysBefore }))
    .filter((b) => b.daysLeft <= b.window);
  res.json({ joins, leaves, extensions, complaints, billsDue });
});