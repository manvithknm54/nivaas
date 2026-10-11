import mongoose from "mongoose";

const ymd = { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ };
const ref = (name, required = true) => ({ type: mongoose.Schema.Types.ObjectId, ref: name, required });

const leaveSchema = new mongoose.Schema(
  {
    pg: ref("Pg"),
    tenant: ref("User"),
    leaveOn: ymd, // first day away
    returnOn: ymd, // day he is back
    note: { type: String, trim: true, maxlength: 200 },
    status: { type: String, enum: ["pending", "approved", "rejected", "cancelled"], default: "pending" },
    ratePerWeek: { type: Number, default: 0 },
    days: { type: Number, default: 0 },
    creditTotal: { type: Number, default: 0 },
    creditApplied: { type: Number, default: 0 },
    decidedBy: ref("User", false),
  },
  { timestamps: true }
);
leaveSchema.index({ tenant: 1, status: 1 });
leaveSchema.index({ pg: 1, status: 1 });

export default mongoose.model("LeaveRequest", leaveSchema);