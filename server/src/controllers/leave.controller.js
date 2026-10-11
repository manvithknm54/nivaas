import { z } from "zod";
import LeaveRequest from "../models/LeaveRequest.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { todayIST, ymdRe } from "../utils/dates.js";
import { leaveDays, leaveCredit } from "../services/leaveService.js";
import { applyLeaveCredits, reverseLeaveCredits } from "../services/rentService.js";
import { notify } from "../services/notifyService.js";

const view = (l) => ({
  id: l._id, leaveOn: l.leaveOn, returnOn: l.returnOn, days: l.days, note: l.note, status: l.status,
  creditTotal: l.creditTotal, creditApplied: l.creditApplied,
  tenant: l.tenant?.name ? { name: l.tenant.name, room: l.tenant.room?.number } : undefined,
});

const cancelLeave = async (leave, userId) => {
  if (!["pending", "approved"].includes(leave.status)) throw new ApiError(409, "This leave can't be cancelled");
  if (leave.status === "approved") await reverseLeaveCredits(leave, userId);
  leave.status = "cancelled";
  await leave.save();
};

/* ---------- Tenant ---------- */
export const myLeaves = asyncHandler(async (req, res) => {
  const leaves = await LeaveRequest.find({ tenant: req.user._id }).sort({ leaveOn: -1 }).limit(30);
  res.json({ ratePerWeek: req.pg.leaveRatePerWeek, leaves: leaves.map(view) });
});

export const requestLeave = asyncHandler(async (req, res) => {
  const d = z
    .object({ leaveOn: z.string().regex(ymdRe), returnOn: z.string().regex(ymdRe), note: z.string().max(200).optional() })
    .parse(req.body);
  if (d.leaveOn < todayIST()) throw new ApiError(400, "Leave can't start in the past");
  const days = leaveDays(d.leaveOn, d.returnOn);
  if (!(days >= 1)) throw new ApiError(400, "Return date must be after the leave date");
  if (days > 90) throw new ApiError(400, "Leave can be at most 90 days");
  const clash = await LeaveRequest.exists({
    tenant: req.user._id, status: { $in: ["pending", "approved"] }, leaveOn: { $lt: d.returnOn }, returnOn: { $gt: d.leaveOn },
  });
  if (clash) throw new ApiError(409, "You already have a leave in those dates");

  const rate = req.pg.leaveRatePerWeek;
  const leave = await LeaveRequest.create({
    ...d, pg: req.pg._id, tenant: req.user._id, ratePerWeek: rate, days, creditTotal: leaveCredit(days, rate),
  });
  await notify({
    user: req.pg.owner, kind: "leave", link: "/owner/leaves",
    title: `Leave request from ${req.user.name}`, body: `${d.leaveOn} to ${d.returnOn} (${days} days)`,
  });
  res.status(201).json(view(leave));
});

export const tenantCancel = asyncHandler(async (req, res) => {
  const leave = await LeaveRequest.findOne({ _id: req.params.id, tenant: req.user._id });
  if (!leave) throw new ApiError(404, "Leave not found");
  if (leave.status === "approved" && leave.leaveOn <= todayIST()) {
    throw new ApiError(409, "This leave has already started. Ask your owner to cancel it.");
  }
  await cancelLeave(leave, req.user._id);
  res.json({ ok: true });
});

/* ---------- Owner ---------- */
export const listLeaves = asyncHandler(async (req, res) => {
  const leaves = await LeaveRequest.find({
    pg: req.pg._id, status: { $in: ["pending", "approved"] }, returnOn: { $gte: todayIST() },
  })
    .populate({ path: "tenant", select: "name room", populate: { path: "room", select: "number" } })
    .sort({ leaveOn: 1 });
  res.json({ ratePerWeek: req.pg.leaveRatePerWeek, leaves: leaves.map(view) });
});

export const approveLeave = asyncHandler(async (req, res) => {
  const leave = await LeaveRequest.findOne({ _id: req.params.id, pg: req.pg._id, status: "pending" });
  if (!leave) throw new ApiError(404, "Request not found");
  if (leave.returnOn <= todayIST()) throw new ApiError(409, "This leave is already over");
  const days = leaveDays(leave.leaveOn, leave.returnOn);
  Object.assign(leave, {
    status: "approved", days, ratePerWeek: req.pg.leaveRatePerWeek,
    creditTotal: leaveCredit(days, req.pg.leaveRatePerWeek), decidedBy: req.user._id,
  });
  await leave.save();
  await applyLeaveCredits(leave.tenant);
  await notify({
    user: leave.tenant, kind: "leave", link: "/app/leaves", title: "Leave approved",
    body: `₹${leave.creditTotal} will be deducted from your rent.`,
  });
  res.json({ ok: true });
});

export const rejectLeave = asyncHandler(async (req, res) => {
  const leave = await LeaveRequest.findOne({ _id: req.params.id, pg: req.pg._id, status: "pending" });
  if (!leave) throw new ApiError(404, "Request not found");
  leave.status = "rejected";
  leave.decidedBy = req.user._id;
  await leave.save();
  await notify({ user: leave.tenant, kind: "leave", link: "/app/leaves", title: "Leave request declined", body: `${leave.leaveOn} to ${leave.returnOn}` });
  res.json({ ok: true });
});

export const ownerCancel = asyncHandler(async (req, res) => {
  const leave = await LeaveRequest.findOne({ _id: req.params.id, pg: req.pg._id });
  if (!leave) throw new ApiError(404, "Leave not found");
  await cancelLeave(leave, req.user._id);
  await notify({ user: leave.tenant, kind: "leave", link: "/app/leaves", title: "Your leave was cancelled", body: `${leave.leaveOn} to ${leave.returnOn}` });
  res.json({ ok: true });
});