import { z } from "zod";
import Pg from "../models/Pg.js";
import MealPoll from "../models/MealPoll.js";
import MealVote from "../models/MealVote.js";
import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { upcomingPolls, pollState, tally } from "../services/mealService.js";

/* ---------- Owner ---------- */

export const listMeals = asyncHandler(async (req, res) => {
  const polls = await upcomingPolls(req.pg);
  const tenants = await User.find({ pg: req.pg._id, role: "tenant", status: "active" }).select("name diet");
  const votes = await MealVote.find({ poll: { $in: polls.map((p) => p._id) } });

  const byPoll = new Map();
  for (const v of votes) {
    const k = String(v.poll);
    if (!byPoll.has(k)) byPoll.set(k, new Map());
    byPoll.get(k).set(String(v.tenant), v.choice);
  }

  res.json({
    cutoff: req.pg.mealCutoff,
    polls: polls.map((p) => ({
      id: p._id,
      date: p.date,
      option: p.option,
      locked: p.locked,
      state: pollState(p, req.pg.mealCutoff),
      ...tally(p.option, tenants, byPoll.get(String(p._id)) ?? new Map()),
    })),
  });
});

export const setLock = asyncHandler(async (req, res) => {
  const { locked } = z.object({ locked: z.boolean() }).parse(req.body);
  const poll = await MealPoll.findOne({ _id: req.params.id, pg: req.pg._id });
  if (!poll) throw new ApiError(404, "Poll not found");
  poll.locked = locked;
  await poll.save();
  res.json({ ok: true });
});

/* ---------- Tenant ---------- */

const activePg = async (user) => {
  if (user.status !== "active" || !user.pg) throw new ApiError(403, "Meals are available once you've joined a PG");
  const pg = await Pg.findById(user.pg);
  if (!pg) throw new ApiError(404, "PG not found");
  return pg;
};

export const myMeals = asyncHandler(async (req, res) => {
  const pg = await activePg(req.user);
  const polls = await upcomingPolls(pg);
  const votes = await MealVote.find({ tenant: req.user._id, poll: { $in: polls.map((p) => p._id) } });
  const mine = new Map(votes.map((v) => [String(v.poll), v.choice]));

  res.json({
    diet: req.user.diet,
    cutoff: pg.mealCutoff,
    polls: polls.map((p) => ({
      id: p._id,
      date: p.date,
      option: p.option,
      state: pollState(p, pg.mealCutoff),
      myChoice: mine.get(String(p._id)) ?? null,
    })),
  });
});

export const vote = asyncHandler(async (req, res) => {
  const { choice } = z.object({ choice: z.enum(["veg", "egg", "nonveg"]) }).parse(req.body);
  const pg = await activePg(req.user);
  const poll = await MealPoll.findOne({ _id: req.params.id, pg: pg._id });
  if (!poll) throw new ApiError(404, "Poll not found");
  if (pollState(poll, pg.mealCutoff) !== "open") throw new ApiError(409, "Voting is closed for this meal");
  if (choice !== "veg" && choice !== poll.option) throw new ApiError(400, "Invalid choice for this meal");

  await MealVote.findOneAndUpdate(
    { poll: poll._id, tenant: req.user._id },
    { $set: { choice, pg: pg._id } },
    { upsert: true }
  );
  res.json({ ok: true });
});

export const setDiet = asyncHandler(async (req, res) => {
  const { diet } = z.object({ diet: z.enum(["veg", "nonveg"]) }).parse(req.body);
  req.user.diet = diet;
  await req.user.save();
  res.json({ diet });
});