import { z } from "zod";
import Complaint from "../models/Complaint.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { notify } from "../services/notifyService.js";

const CATS = ["water", "electricity", "wifi", "food", "cleaning", "furniture", "other"];

const view = (c) => ({
  id: c._id, title: c.title, description: c.description, category: c.category, status: c.status,
  resolution: c.resolution?.note ?? null, timeline: c.timeline, createdAt: c.createdAt,
  tenant: c.tenant?.name ? { name: c.tenant.name, room: c.tenant.room?.number } : undefined,
});

/* Tenant */
export const myComplaints = asyncHandler(async (req, res) => {
  res.json((await Complaint.find({ tenant: req.user._id }).sort({ createdAt: -1 }).limit(50)).map(view));
});

export const raiseComplaint = asyncHandler(async (req, res) => {
  const d = z.object({
    title: z.string().trim().min(3, "Give your complaint a short title").max(80),
    description: z.string().trim().max(1000).optional(),
    category: z.enum(CATS).default("other"),
  }).parse(req.body);
  const c = await Complaint.create({
    ...d, pg: req.pg._id, tenant: req.user._id, timeline: [{ status: "open", note: "Complaint raised" }],
  });
  await notify({ user: req.pg.owner, kind: "complaint", link: "/owner/complaints", title: `New complaint: ${d.title}`, body: `${req.user.name} · ${d.category}` });
  res.status(201).json(view(c));
});

/* Owner */
export const listComplaints = asyncHandler(async (req, res) => {
  const list = await Complaint.find({ pg: req.pg._id })
    .populate({ path: "tenant", select: "name room", populate: { path: "room", select: "number" } })
    .sort({ createdAt: -1 })
    .limit(200);
  res.json(list.map(view));
});

export const setStatus = asyncHandler(async (req, res) => {
  const d = z.object({
    status: z.enum(["open", "in_progress", "resolved"]),
    note: z.string().trim().max(300).optional(),
  }).parse(req.body);
  if (d.status === "resolved" && (d.note?.length ?? 0) < 5) throw new ApiError(400, "Describe what was done (at least 5 characters)");
  const c = await Complaint.findOne({ _id: req.params.id, pg: req.pg._id });
  if (!c) throw new ApiError(404, "Complaint not found");
  c.status = d.status;
  c.timeline.push({ status: d.status, note: d.note });
  if (d.status === "resolved") c.resolution = { note: d.note, at: new Date() };
  await c.save();
  const label = { open: "reopened", in_progress: "is being worked on", resolved: "was resolved" }[d.status];
  await notify({
    user: c.tenant, kind: "complaint", link: "/app/complaints", email: d.status === "resolved",
    title: `Your complaint ${label}`, body: `${c.title}${d.note ? ` · ${d.note}` : ""}`,
  });
  res.json({ ok: true });
});