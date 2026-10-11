import mongoose from "mongoose";

const rentDueSchema = new mongoose.Schema(
  {
    pg: { type: mongoose.Schema.Types.ObjectId, ref: "Pg", required: true },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    month: { type: String, required: true, match: /^\d{4}-(0[1-9]|1[0-2])$/ },
    amount: { type: Number, required: true, min: 0 },
    dueOn: { type: String, required: true },
    extendedUntil: { type: String, default: null }, // used in Phase 5
    lastReminderAt: { type: Date, default: null },
  },
  { timestamps: true }
);

rentDueSchema.index({ tenant: 1, month: 1 }, { unique: true });
rentDueSchema.index({ pg: 1, month: 1 });

export default mongoose.model("RentDue", rentDueSchema);