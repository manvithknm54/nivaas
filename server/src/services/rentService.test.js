import test from "node:test";
import assert from "node:assert/strict";
import { summarize } from "./rentService.js";

const due = { amount: 7000, dueOn: "2999-01-05", extendedUntil: null };
const e = (type, amount, extra = {}) => ({ type, amount, ...extra });

test("unpaid due", () => {
  const s = summarize(due, []);
  assert.equal(s.balance, 7000);
  assert.equal(s.status, "unpaid");
});

test("partial then full payment", () => {
  assert.equal(summarize(due, [e("payment", 3000)]).status, "partial");
  assert.equal(summarize(due, [e("payment", 3000), e("payment", 4000)]).status, "paid");
});

test("credit reduces the balance", () => {
  assert.equal(summarize(due, [e("credit", 250)]).balance, 6750);
});

test("reversal restores the balance", () => {
  const s = summarize(due, [e("payment", 7000), e("reversal", 7000, { reversedType: "payment" })]);
  assert.equal(s.balance, 7000);
  assert.equal(s.status, "unpaid");
});

test("overdue only when unpaid past the due date", () => {
  assert.equal(summarize({ ...due, dueOn: "2000-01-01" }, []).overdue, true);
  assert.equal(summarize({ ...due, dueOn: "2000-01-01" }, [e("payment", 7000)]).overdue, false);
  assert.equal(summarize(due, []).overdue, false);
});