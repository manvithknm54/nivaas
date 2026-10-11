import { Router } from "express";
import rateLimit from "express-rate-limit";
import { register, login, logout, me } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.js";

const attempts = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true, // only failed attempts count
  message: { message: "Too many attempts. Please try again in a few minutes." },
});

const r = Router();
r.post("/register", attempts, register);
r.post("/login", attempts, login);
r.post("/logout", logout);
r.get("/me", protect, me);
export default r;