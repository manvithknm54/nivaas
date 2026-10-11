import { Router } from "express";
import { protect, allow } from "../middleware/auth.js";
import { requirePg } from "../middleware/requirePg.js";
import { createPg, getMyPg, updatePg, getInvite, rotateInvite } from "../controllers/pg.controller.js";
import { createRoom, listRooms, deleteRoom } from "../controllers/room.controller.js";
import { listTenants, approveTenant, rejectTenant, removeTenant } from "../controllers/tenant.controller.js";
import { listMonth, generate, detail, addEntry, reverseEntry } from "../controllers/rent.controller.js";

const r = Router();
r.use(protect, allow("owner"));
r.post("/pg", createPg);

r.use(requirePg);
r.get("/pg", getMyPg);
r.patch("/pg", updatePg);
r.get("/pg/invite", getInvite);
r.post("/pg/invite/rotate", rotateInvite);

r.get("/rooms", listRooms);
r.post("/rooms", createRoom);
r.delete("/rooms/:id", deleteRoom);

r.get("/tenants", listTenants);
r.post("/tenants/:id/approve", approveTenant);
r.post("/tenants/:id/reject", rejectTenant);
r.post("/tenants/:id/remove", removeTenant);

r.get("/rent", listMonth);
r.post("/rent/generate", generate);
r.get("/rent/:id", detail);
r.post("/rent/:id/entries", addEntry);
r.post("/rent/entries/:id/reverse", reverseEntry);
export default r;