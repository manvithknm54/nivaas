import { z } from "zod";
import Room from "../models/Room.js";
import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createRoom = asyncHandler(async (req, res) => {
  const data = z
    .object({
      number: z.string().min(1, "Room number is required"),
      type: z.enum(["hall", "shared_bath", "attached_bath"]),
      beds: z.number().int().min(1).max(20),
    })
    .parse(req.body);
  const room = await Room.create({ ...data, pg: req.pg._id });
  res.status(201).json(room);
});

export const listRooms = asyncHandler(async (req, res) => {
  const rooms = await Room.find({ pg: req.pg._id }).sort({ number: 1 });
  const counts = await User.aggregate([
    { $match: { pg: req.pg._id, status: "active", room: { $ne: null } } },
    { $group: { _id: "$room", n: { $sum: 1 } } },
  ]);
  const map = new Map(counts.map((c) => [String(c._id), c.n]));
  res.json(rooms.map((r) => ({ ...r.toObject(), occupied: map.get(String(r._id)) || 0 })));
});

export const deleteRoom = asyncHandler(async (req, res) => {
  const room = await Room.findOne({ _id: req.params.id, pg: req.pg._id });
  if (!room) throw new ApiError(404, "Room not found");
  if (await User.exists({ room: room._id, status: "active" })) {
    throw new ApiError(409, "Move the tenants out of this room first");
  }
  await room.deleteOne();
  res.json({ ok: true });
});