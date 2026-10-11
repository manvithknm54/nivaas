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

const pgSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    roomTypes: [roomTypeSchema],
    leaveRatePerWeek: { type: Number, default: 250, min: 0 },
    rentDueDay: { type: Number, default: 1, min: 1, max: 28 },
    inviteToken: { type: String, unique: true, default: () => crypto.randomBytes(16).toString("hex") },
  },
  { timestamps: true }
);

export default mongoose.model("Pg", pgSchema);