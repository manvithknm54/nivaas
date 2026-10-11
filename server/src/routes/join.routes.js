import { Router } from "express";
import { protect, allow } from "../middleware/auth.js";
import { joinInfo, requestJoin } from "../controllers/join.controller.js";

const r = Router();
r.get("/:token", joinInfo);
r.post("/:token", protect, allow("tenant"), requestJoin);
export default r;