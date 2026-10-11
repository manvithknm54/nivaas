import { z } from "zod";
import MealPoll from "../models/MealPoll.js";
import MealVote from "../models/MealVote.js";
import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { upcomingPolls, pollState, tally } from "../services/mealService.js";
import { awayOn } from "../services/leaveService.js";

/* ---------- Owner ---------- */
export const listMeals = asyncHandler(async (req, res) => {
  const polls = await upcomingPolls(req.pg);
  const everyone = await User.find({ pg: req.pg._id, role: "tenant", status: "active" }).select("name diet");
  const votes = await MealVote.find({ poll: { $in: polls.map((p) => p._id) } });
  const byPoll = new Map();
  for (const v of votes) {
    const k = String(v.poll);
    if (!byPoll.has(k)) byPoll.set(k, new Map());
    byPoll.get(k).set(String(v.tenant), v.choice);
  }
  const out = [];
  for (const p of polls) {
    const away = await awayOn(req.pg._id, p.date);
    const present = everyone.filter((t) => !away.has(String(t._id)));
    out.push({
      id: p._id, date: p.date, option: p.option, locked: p.locked,
      state: pollState(p, req.pg.mealCutoff), away: everyone.length - present.length,
      ...tally(p.option, present, byPoll.get(String(p._id)) ?? new Map()),
    });
  }
  res.json({ cutoff: req.pg.mealCutoff, polls: out });
});

export const setLock = asyncHandler(async (req, res) => {
  const { locked } = z.object({ locked: z.boolean() }).parse(req.body);
  const poll = await MealPoll.findOne({ _id: req.params.id, pg: req.pg._id });
  if (!poll) throw new ApiError(404, "Poll not found");
  poll.locked = locked;
  await poll.save();
  res.json({ ok: true });
});

/* ---------- Tenant (routes are behind requireActive) ---------- */
export const myMeals = asyncHandler(async (req, res) => {
  const polls = await upcomingPolls(req.pg);
  const votes = await MealVote.find({ tenant: req.user._id, poll: { $in: polls.map((p) => p._id) } });
  const mine = new Map(votes.map((v) => [String(v.poll), v.choice]));
  const out = [];
  for (const p of polls) {
    out.push({
      id: p._id, date: p.date, option: p.option, state: pollState(p, req.pg.mealCutoff),
      myChoice: mine.get(String(p._id)) ?? null,
      away: (await awayOn(req.pg._id, p.date)).has(String(req.user._id)),
    });
  }
  res.json({ diet: req.user.diet, cutoff: req.pg.mealCutoff, polls: out });
});

export const vote = asyncHandler(async (req, res) => {
  const { choice } = z.object({ choice: z.enum(["veg", "egg", "nonveg"]) }).parse(req.body);
  const poll = await MealPoll.findOne({ _id: req.params.id, pg: req.pg._id });
  if (!poll) throw new ApiError(404, "Poll not found");
  if (pollState(poll, req.pg.mealCutoff) !== "open") throw new ApiError(409, "Voting is closed for this meal");
  if (choice !== "veg" && choice !== poll.option) throw new ApiError(400, "Invalid choice for this meal");
  if ((await awayOn(req.pg._id, poll.date)).has(String(req.user._id))) throw new ApiError(409, "You're on approved leave that day");
  await MealVote.findOneAndUpdate({ poll: poll._id, tenant: req.user._id }, { $set: { choice, pg: req.pg._id } }, { upsert: true });
  res.json({ ok: true });
});

export const setDiet = asyncHandler(async (req, res) => {
  const { diet } = z.object({ diet: z.enum(["veg", "nonveg"]) }).parse(req.body);
  req.user.diet = diet;
  await req.user.save();
  res.json({ diet });
});