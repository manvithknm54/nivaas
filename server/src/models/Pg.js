import mongoose from "mongoose";
import crypto from "crypto";

const roomTypeSchema = new mongoose.Schema(
  {
    key: { type: String, enum: ["hall", "shared_bath", "attached_bath"], required: true },
    label: { type: String, required: true },
    monthlyFee: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const mealDaySchema = new mongoose.Schema(
  {
    weekday: { type: Number, min: 0, max: 6, required: true }, // 0 = Sunday
    option: { type: String, enum: ["egg", "nonveg"], required: true },
  },
  { _id: false }
);

const pgSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    roomTypes: [roomTypeSchema],
    leaveRatePerWeek: { type: Number, default: 250, min: 0 },
    rentDueDay: { type: Number, default: 1, min: 1, max: 28 },
    mealDays: { type: [mealDaySchema], default: () => [{ weekday: 3, option: "egg" }, { weekday: 0, option: "nonveg" }] },
    mealCutoff: { type: String, default: "08:00", match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    inviteToken: { type: String, unique: true, default: () => crypto.randomBytes(16).toString("hex") },
  },
  { timestamps: true }
);

export default mongoose.model("Pg", pgSchema);