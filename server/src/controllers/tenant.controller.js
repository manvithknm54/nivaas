import { z } from "zod";
import User from "../models/User.js";
import Room from "../models/Room.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listTenants = asyncHandler(async (req, res) => {
  const tenants = await User.find({ pg: req.pg._id, role: "tenant", status: { $in: ["pending", "active"] } })
    .populate("room", "number type")
    .select("-password")
    .sort({ createdAt: -1 });
  res.json(tenants);
});

const findTenant = (req, status) =>
  User.findOne({ _id: req.params.id, pg: req.pg._id, role: "tenant", status });

export const approveTenant = asyncHandler(async (req, res) => {
  const { roomId } = z.object({ roomId: z.string().min(1) }).parse(req.body);
  const room = await Room.findOne({ _id: roomId, pg: req.pg._id });
  if (!room) throw new ApiError(404, "Room not found");
  const taken = await User.countDocuments({ room: room._id, status: "active" });
  if (taken >= room.beds) throw new ApiError(409, "That room is full");
  const tenant = await findTenant(req, "pending");
  if (!tenant) throw new ApiError(404, "Request not found");
  tenant.room = room._id;
  tenant.status = "active";
  tenant.joinedOn = new Date();
  await tenant.save();
  res.json({ ok: true });
});

export const rejectTenant = asyncHandler(async (req, res) => {
  const tenant = await findTenant(req, "pending");
  if (!tenant) throw new ApiError(404, "Request not found");
  tenant.pg = null;
  tenant.status = "unassigned";
  await tenant.save();
  res.json({ ok: true });
});

export const removeTenant = asyncHandler(async (req, res) => {
  const tenant = await findTenant(req, "active");
  if (!tenant) throw new ApiError(404, "Tenant not found");
  tenant.status = "left";
  tenant.room = null;
  await tenant.save();
  res.json({ ok: true });
});