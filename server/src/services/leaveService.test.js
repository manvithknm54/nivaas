import test from "node:test";
import assert from "node:assert/strict";
import { leaveDays, leaveCredit } from "./leaveService.js";

test("days away", () => {
  assert.equal(leaveDays("2026-10-10", "2026-10-17"), 7);
  assert.equal(leaveDays("2026-10-30", "2026-11-02"), 3);
});

test("credit is prorated per day from the weekly rate", () => {
  assert.equal(leaveCredit(7, 250), 250);
  assert.equal(leaveCredit(3, 250), 107.14);
  assert.equal(leaveCredit(14, 250), 500);
});