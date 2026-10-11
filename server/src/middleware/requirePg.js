import Pg from "../models/Pg.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const requirePg = asyncHandler(async (req, _res, next) => {
  const pg = await Pg.findOne({ owner: req.user._id });
  if (!pg) throw new ApiError(404, "Create your PG first");
  req.pg = pg;
  next();
});