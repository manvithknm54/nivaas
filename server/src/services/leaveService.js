import LeaveRequest from "../models/LeaveRequest.js";
import { daysBetween } from "../utils/dates.js";
import { r2 } from "./rentService.js";

export const leaveDays = (leaveOn, returnOn) => daysBetween(leaveOn, returnOn);
export const leaveCredit = (days, ratePerWeek) => r2((days * ratePerWeek) / 7);

// Tenants on approved leave on a date: leaveOn <= date < returnOn
export const awayOn = async (pgId, date) =>
  new Set(
    (await LeaveRequest.find({ pg: pgId, status: "approved", leaveOn: { $lte: date }, returnOn: { $gt: date } }).select("tenant"))
      .map((l) => String(l.tenant))
  );