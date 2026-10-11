import { z } from "zod";
import RentDue from "../models/RentDue.js";
import RentEntry from "../models/RentEntry.js";
import ExtensionRequest from "../models/ExtensionRequest.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ymdRe } from "../utils/dates.js";
import { summarize } from "../services/rentService.js";
import { checkUntil, applyExtension } from "../services/extensionService.js";
import { notify } from "../services/notifyService.js";

const until = z.string().regex(ymdRe, "Pick a valid date");

/* Tenant */
export const requestExtension = asyncHandler(async (req, res) => {
  const d = z.object({ until, reason: z.string().min(3, "Please give a short reason").max(200) }).parse(req.body);
  const due = await RentDue.findOne({ _id: req.params.id, tenant: req.user._id });
  if (!due) throw new ApiError(404, "Due not found");
  if (summarize(due, await RentEntry.find({ due: due._id })).balance <= 0) throw new ApiError(409, "This month is already paid");
  if (await ExtensionRequest.exists({ due: due._id, status: "pending" })) throw new ApiError(409, "You already have a pending request for this month");
  checkUntil(due, d.until);
  await ExtensionRequest.create({ pg: req.pg._id, tenant: req.user._id, due: due._id, requestedUntil: d.until, reason: d.reason });
  await notify({
    user: req.pg.owner, kind: "extension", link: "/owner/rent",
    title: `${req.user.name} asked for more time`, body: `Rent for ${due.month}, until ${d.until}. ${d.reason}`,
  });
  res.status(201).json({ ok: true });
});

/* Owner */
export const listExtensions = asyncHandler(async (req, res) => {
  const reqs = await ExtensionRequest.find({ pg: req.pg._id, status: "pending" })
    .populate({ path: "tenant", select: "name room", populate: { path: "room", select: "number" } })
    .populate("due", "month dueOn extendedUntil")
    .sort({ createdAt: 1 });
  res.json(
    reqs.map((r) => ({
      id: r._id, tenant: { name: r.tenant?.name, room: r.tenant?.room?.number }, month: r.due.month,
      currentUntil: r.due.extendedUntil || r.due.dueOn, requestedUntil: r.requestedUntil, reason: r.reason,
    }))
  );
});

export const decideExtension = asyncHandler(async (req, res) => {
  const d = z.object({ approve: z.boolean(), until: until.optional() }).parse(req.body);
  const r = await ExtensionRequest.findOne({ _id: req.params.id, pg: req.pg._id, status: "pending" });
  if (!r) throw new ApiError(404, "Request not found");
  const due = await RentDue.findById(r.due);
  const to = d.until || r.requestedUntil;
  if (d.approve) {
    checkUntil(due, to);
    await applyExtension(due, to);
  }
  r.status = d.approve ? "approved" : "rejected";
  r.decidedAt = new Date();
  await r.save();
  await notify({
    user: r.tenant, kind: "extension", link: "/app/rent", email: true,
    title: d.approve ? "Extension approved" : "Extension declined",
    body: d.approve ? `Your rent for ${due.month} is now due on ${to}.` : `Your request for ${due.month} was declined. Please speak to your owner.`,
  });
  res.json({ ok: true });
});

// Owner changes a due date directly (e.g. after talking to the tenant)
export const extendDue = asyncHandler(async (req, res) => {
  const { until: to } = z.object({ until }).parse(req.body);
  const due = await RentDue.findOne({ _id: req.params.id, pg: req.pg._id });
  if (!due) throw new ApiError(404, "Due not found");
  checkUntil(due, to);
  await applyExtension(due, to);
  await ExtensionRequest.updateMany({ due: due._id, status: "pending" }, { $set: { status: "approved", decidedAt: new Date() } });
  await notify({ user: due.tenant, kind: "extension", link: "/app/rent", email: true, title: "Due date changed", body: `Your rent for ${due.month} is now due on ${to}.` });
  res.json({ ok: true });
});