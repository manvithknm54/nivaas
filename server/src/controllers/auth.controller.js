import jwt from "jsonwebtoken";
import { z } from "zod";
import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const lower = z.string().email().transform((s) => s.toLowerCase());

const registerSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: lower,
  phone: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["owner", "tenant"]),
});

export const shape = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  status: u.status,
  pg: u.pg?._id ?? null,
  pgName: u.pg?.name ?? null,
});

const sendUser = async (res, user, code = 200) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 3600 * 1000,
  });
  await user.populate("pg", "name");
  res.status(code).json(shape(user));
};

export const register = asyncHandler(async (req, res) => {
  const data = registerSchema.parse(req.body);
  if (await User.findOne({ email: data.email })) throw new ApiError(409, "Email already registered");
  const user = await User.create({ ...data, status: data.role === "owner" ? "active" : "unassigned" });
  await sendUser(res, user, 201);
});

export const login = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").toLowerCase();
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.matches(String(req.body.password || "")))) {
    throw new ApiError(401, "Invalid email or password");
  }
  await sendUser(res, user);
});

export const me = asyncHandler(async (req, res) => {
  await req.user.populate("pg", "name");
  res.json(shape(req.user));
});

export const logout = (_req, res) => {
  res.clearCookie("token");
  res.json({ ok: true });
};