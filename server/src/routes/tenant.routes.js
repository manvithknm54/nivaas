import { Router } from "express";
import { protect, allow } from "../middleware/auth.js";
import { requireActive } from "../middleware/requireActive.js";
import { myRent } from "../controllers/rent.controller.js";
import { myMeals, vote, setDiet } from "../controllers/meal.controller.js";
import { myLeaves, requestLeave, tenantCancel } from "../controllers/leave.controller.js";
import { requestExtension } from "../controllers/extension.controller.js";
import { myComplaints, raiseComplaint } from "../controllers/complaint.controller.js";

const r = Router();
r.use(protect, allow("tenant"));
r.get("/rent", myRent); // returns an empty list for tenants who haven't joined
r.patch("/profile", setDiet);

r.use(requireActive); // everything below needs an approved stay
r.post("/rent/:id/extension", requestExtension);
r.get("/meals", myMeals);
r.post("/meals/:id/vote", vote);
r.get("/leaves", myLeaves);
r.post("/leaves", requestLeave);
r.post("/leaves/:id/cancel", tenantCancel);
r.get("/complaints", myComplaints);
r.post("/complaints", raiseComplaint);
export default r;