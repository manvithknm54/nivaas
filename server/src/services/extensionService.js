import { ApiError } from "../utils/ApiError.js";
import { addDays } from "../utils/dates.js";

export const checkUntil = (due, until) => {
  if (until <= (due.extendedUntil || due.dueOn)) throw new ApiError(400, "Pick a date after the current due date");
  if (until > addDays(due.dueOn, 45)) throw new ApiError(400, "Extensions can be at most 45 days past the original due date");
};

export const applyExtension = async (due, until) => {
  due.extendedUntil = until;
  due.lastReminderAt = null; // reminders pause, then resume from the new date
  await due.save();
};