import test from "node:test";
import assert from "node:assert/strict";
import { tally, pollState } from "./mealService.js";

const t = (name, diet) => ({ _id: name, name, diet });

test("non-voters follow their diet", () => {
  const r = tally("egg", [t("A", "veg"), t("B", "nonveg")], new Map());
  assert.deepEqual([r.veg, r.special, r.voted], [1, 1, 0]);
  assert.deepEqual(r.pending, ["A", "B"]);
});

test("a vote overrides the diet", () => {
  const r = tally("nonveg", [t("A", "nonveg")], new Map([["A", "veg"]]));
  assert.deepEqual([r.veg, r.special, r.voted], [1, 0, 1]);
  assert.deepEqual(r.pending, []);
});

test("poll states", () => {
  assert.equal(pollState({ date: "2999-01-01", locked: false }, "08:00"), "upcoming");
  assert.equal(pollState({ date: "2000-01-01", locked: false }, "08:00"), "closed");
  assert.equal(pollState({ date: "2999-01-01", locked: true }, "08:00"), "locked");
});