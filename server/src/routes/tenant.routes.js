import { Router } from "express";
import { protect, allow } from "../middleware/auth.js";
import { myRent } from "../controllers/rent.controller.js";
import { myMeals, vote, setDiet } from "../controllers/meal.controller.js";

const r = Router();
r.use(protect, allow("tenant"));
r.get("/rent", myRent);
r.get("/meals", myMeals);
r.post("/meals/:id/vote", vote);
r.patch("/profile", setDiet);
export default r;