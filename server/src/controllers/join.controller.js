import Pg from "../models/Pg.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const joinInfo = asyncHandler(async (req, res) => {
  const pg = await Pg.findOne({ inviteToken: req.params.token });
  if (!pg) throw new ApiError(404, "This invite link is no longer valid");
  res.json({ name: pg.name, address: pg.address });
});

export const requestJoin = asyncHandler(async (req, res) => {
  const pg = await Pg.findOne({ inviteToken: req.params.token });
  if (!pg) throw new ApiError(404, "This invite link is no longer valid");
  if (["pending", "active"].includes(req.user.status)) {
    throw new ApiError(409, "You already have a PG or a pending request");
  }
  req.user.pg = pg._id;
  req.user.status = "pending";
  await req.user.save();
  res.json({ ok: true });
});