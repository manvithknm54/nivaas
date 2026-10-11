import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const protect = asyncHandler(async (req, _res, next) => {
  const token = req.cookies.token;
  if (!token) throw new ApiError(401, "Please log in");
  const { id } = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(id);
  if (!user) throw new ApiError(401, "Account not found");
  req.user = user;
  next();
});

export const allow =
  (...roles) =>
  (req, _res, next) =>
    roles.includes(req.user.role) ? next() : next(new ApiError(403, "Not allowed"));