import { Router } from "express";
import { protect, allow } from "../middleware/auth.js";
import { myRent } from "../controllers/rent.controller.js";

const r = Router();
r.use(protect, allow("tenant"));
r.get("/rent", myRent);
export default r;