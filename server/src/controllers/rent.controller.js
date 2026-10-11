import { z } from "zod";
import RentDue from "../models/RentDue.js";
import RentEntry from "../models/RentEntry.js";
import ExtensionRequest from "../models/ExtensionRequest.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { currentMonth, monthRe } from "../utils/dates.js";
import {
  generateDuesForPg,
  summarize,
  groupEntries,
  rowOf,
  entryViews,
  r2,
} from "../services/rentService.js";

const monthSchema = z.object({
  month: z.string().regex(monthRe, "Invalid month").optional(),
});

const tenantInfo = (t) => ({
  id: t?._id,
  name: t?.name,
  phone: t?.phone,
  room: t?.room?.number,
});

const populateTenant = {
  path: "tenant",
  select: "name phone room",
  populate: {
    path: "room",
    select: "number",
  },
};

// Owner: list rent dues for a particular month
export const listMonth = asyncHandler(async (req, res) => {
  const month = monthSchema.parse(req.query).month ?? currentMonth();

  const dues = await RentDue.find({
    pg: req.pg._id,
    month,
  }).populate(populateTenant);

  const entries = await RentEntry.find({
    due: { $in: dues.map((d) => d._id) },
  });

  const by = groupEntries(entries);

  const rows = dues
    .map((d) => ({
      ...rowOf(d, by.get(String(d._id)) || []),
      tenant: tenantInfo(d.tenant),
    }))
    .sort((a, b) =>
      (a.tenant.name || "").localeCompare(b.tenant.name || "")
    );

  const sum = (k) =>
    r2(rows.reduce((s, r) => s + r[k], 0));

  res.json({
    month,
    rows,
    totals: {
      expected: sum("amount"),
      collected: sum("paid"),
      credits: sum("credits"),
      outstanding: sum("balance"),
      overdueCount: rows.filter((r) => r.overdue).length,
    },
  });
});

// Owner: generate rent dues
export const generate = asyncHandler(async (req, res) => {
  const month =
    monthSchema.parse(req.body ?? {}).month ?? currentMonth();

  if (month > currentMonth()) {
    throw new ApiError(
      400,
      "You can't generate dues for a future month"
    );
  }

  res.json(await generateDuesForPg(req.pg, month));
});

// Owner: get rent due details
export const detail = asyncHandler(async (req, res) => {
  const due = await RentDue.findOne({
    _id: req.params.id,
    pg: req.pg._id,
  }).populate(populateTenant);

  if (!due) {
    throw new ApiError(404, "Due not found");
  }

  const entries = await RentEntry.find({
    due: due._id,
  });

  res.json({
    ...rowOf(due, entries),
    tenant: tenantInfo(due.tenant),
    entries: entryViews(entries),
  });
});

// Owner: record a payment or credit
export const addEntry = asyncHandler(async (req, res) => {
  const data = z
    .object({
      type: z.enum(["payment", "credit"]),
      amount: z.number().positive("Amount must be more than 0"),
      method: z
        .enum(["cash", "upi", "bank", "other"])
        .default("cash"),
      note: z.string().max(200).optional(),
    })
    .parse(req.body);

  if (data.type === "credit" && !data.note?.trim()) {
    throw new ApiError(
      400,
      "Add a note explaining the credit"
    );
  }

  const due = await RentDue.findOne({
    _id: req.params.id,
    pg: req.pg._id,
  });

  if (!due) {
    throw new ApiError(404, "Due not found");
  }

  const { balance } = summarize(
    due,
    await RentEntry.find({ due: due._id })
  );

  if (data.amount > balance) {
    throw new ApiError(
      409,
      `Only ₹${balance} is pending for this month`
    );
  }

  await RentEntry.create({
    ...data,
    pg: req.pg._id,
    tenant: due.tenant,
    due: due._id,
    recordedBy: req.user._id,
  });

  res.status(201).json({ ok: true });
});

// Owner: reverse a payment or credit
export const reverseEntry = asyncHandler(async (req, res) => {
  const { note } = z
    .object({
      note: z
        .string()
        .min(3, "Please give a reason")
        .max(200),
    })
    .parse(req.body);

  const entry = await RentEntry.findOne({
    _id: req.params.id,
    pg: req.pg._id,
  });

  if (!entry) {
    throw new ApiError(404, "Entry not found");
  }

  if (entry.type === "reversal") {
    throw new ApiError(
      400,
      "A reversal can't be reversed"
    );
  }

  if (await RentEntry.exists({ reverses: entry._id })) {
    throw new ApiError(
      409,
      "This entry is already reversed"
    );
  }

  await RentEntry.create({
    pg: req.pg._id,
    tenant: entry.tenant,
    due: entry.due,
    type: "reversal",
    reversedType: entry.type,
    reverses: entry._id,
    amount: entry.amount,
    method: "other",
    note,
    recordedBy: req.user._id,
  });

  res.status(201).json({ ok: true });
});

// Tenant: retrieve their own rent dues and extension requests
export const myRent = asyncHandler(async (req, res) => {
  const dues = await RentDue.find({
    tenant: req.user._id,
  })
    .sort({ month: -1 })
    .limit(24);

  const ids = dues.map((d) => d._id);

  const by = groupEntries(
    await RentEntry.find({
      due: { $in: ids },
    })
  );

  const latest = new Map(
    (
      await ExtensionRequest.find({
        due: { $in: ids },
      }).sort({ createdAt: 1 })
    ).map((e) => [
      String(e.due),
      {
        status: e.status,
        requestedUntil: e.requestedUntil,
        reason: e.reason,
      },
    ])
  );

  res.json(
    dues.map((d) => ({
      ...rowOf(d, by.get(String(d._id)) || []),

      entries: entryViews(
        by.get(String(d._id)) || []
      ),

      extension:
        latest.get(String(d._id)) ?? null,
    }))
  );
});