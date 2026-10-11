import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { list, readAll, readOne } from "../controllers/notification.controller.js";

const r = Router();
r.use(protect);
r.get("/", list);
r.post("/read", readAll);
r.post("/:id/read", readOne);
export default r;