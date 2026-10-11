import Pg from "../models/Pg.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const requireActive = asyncHandler(async (req, _res, next) => {
  if (req.user.status !== "active" || !req.user.pg) throw new ApiError(403, "Available once you've joined a PG");
  req.pg = await Pg.findById(req.user.pg);
  if (!req.pg) throw new ApiError(404, "PG not found");
  next();
});