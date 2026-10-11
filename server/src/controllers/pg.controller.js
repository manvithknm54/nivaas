import QRCode from "qrcode";
import crypto from "crypto";
import { z } from "zod";

import Pg from "../models/Pg.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const DEFAULT_TYPES = [
  { key: "hall", label: "Bed in hall", monthlyFee: 5800 },
  { key: "shared_bath", label: "Room, shared bathroom", monthlyFee: 6300 },
  { key: "attached_bath", label: "Room, attached bathroom", monthlyFee: 7000 },
];

export const createPg = asyncHandler(async (req, res) => {
  const data = z
    .object({
      name: z.string().min(2, "PG name is too short"),
      address: z.string().optional(),
    })
    .parse(req.body);

  if (await Pg.findOne({ owner: req.user._id })) {
    throw new ApiError(409, "You already have a PG");
  }

  const pg = await Pg.create({
    ...data,
    owner: req.user._id,
    roomTypes: DEFAULT_TYPES,
  });

  req.user.pg = pg._id;
  await req.user.save();

  res.status(201).json(pg);
});

export const getMyPg = (req, res) => res.json(req.pg);

export const updatePg = asyncHandler(async (req, res) => {
  const data = z
    .object({
      name: z.string().min(2).optional(),

      address: z.string().optional(),

      leaveRatePerWeek: z.number().min(0).optional(),

      rentDueDay: z.number().int().min(1).max(28).optional(),

      fees: z.record(z.string(), z.number().min(0)).optional(),

      mealCutoff: z
        .string()
        .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time")
        .optional(),

      mealDays: z
        .array(
          z.object({
            weekday: z.number().int().min(0).max(6),
            option: z.enum(["egg", "nonveg"]),
          })
        )
        .max(7)
        .refine(
          (days) =>
            new Set(days.map((day) => day.weekday)).size === days.length,
          "Each day can only appear once"
        )
        .optional(),
    })
    .parse(req.body);

  const { fees, ...rest } = data;

  // Update PG details and meal settings.
  Object.assign(req.pg, rest);

  // Update monthly fees for existing room types.
  if (fees) {
    req.pg.roomTypes.forEach((type) => {
      if (fees[type.key] != null) {
        type.monthlyFee = fees[type.key];
      }
    });
  }

  await req.pg.save();

  res.json(req.pg);
});

const inviteFor = async (pg) => {
  const link = `${process.env.CLIENT_URL}/join/${pg.inviteToken}`;

  const qr = await QRCode.toDataURL(link, {
    margin: 1,
    width: 320,
    color: {
      dark: "#0b1020",
      light: "#ffffff",
    },
  });

  return { link, qr };
};

export const getInvite = asyncHandler(async (req, res) => {
  res.json(await inviteFor(req.pg));
});

export const rotateInvite = asyncHandler(async (req, res) => {
  req.pg.inviteToken = crypto.randomBytes(16).toString("hex");

  await req.pg.save();

  res.json(await inviteFor(req.pg));
});