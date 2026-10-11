import { Router } from "express";
import { protect, allow } from "../middleware/auth.js";
import { requirePg } from "../middleware/requirePg.js";
import { createPg, getMyPg, updatePg, getInvite, rotateInvite } from "../controllers/pg.controller.js";
import { createRoom, listRooms, deleteRoom } from "../controllers/room.controller.js";
import { listTenants, approveTenant, rejectTenant, removeTenant } from "../controllers/tenant.controller.js";
import { listMonth, generate, detail, addEntry, reverseEntry } from "../controllers/rent.controller.js";
import { listMeals, setLock } from "../controllers/meal.controller.js";
import { listLeaves, approveLeave, rejectLeave, ownerCancel } from "../controllers/leave.controller.js";
import { listExtensions, decideExtension, extendDue } from "../controllers/extension.controller.js";
import { listBills, createBill, renewBill, deleteBill } from "../controllers/bill.controller.js";
import { listComplaints, setStatus } from "../controllers/complaint.controller.js";
import { summary } from "../controllers/summary.controller.js";

const r = Router();
r.use(protect, allow("owner"));
r.post("/pg", createPg);

r.use(requirePg);
r.get("/pg", getMyPg);
r.patch("/pg", updatePg);
r.get("/pg/invite", getInvite);
r.post("/pg/invite/rotate", rotateInvite);
r.get("/summary", summary);

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
r.post("/rent/:id/extend", extendDue);
r.post("/rent/entries/:id/reverse", reverseEntry);

r.get("/extensions", listExtensions);
r.post("/extensions/:id/decide", decideExtension);

r.get("/meals", listMeals);
r.post("/meals/:id/lock", setLock);

r.get("/leaves", listLeaves);
r.post("/leaves/:id/approve", approveLeave);
r.post("/leaves/:id/reject", rejectLeave);
r.post("/leaves/:id/cancel", ownerCancel);

r.get("/bills", listBills);
r.post("/bills", createBill);
r.post("/bills/:id/renew", renewBill);
r.delete("/bills/:id", deleteBill);

r.get("/complaints", listComplaints);
r.post("/complaints/:id/status", setStatus);
export default r;