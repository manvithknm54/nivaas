import mongoose from "mongoose";

const ref = (name) => ({ type: mongoose.Schema.Types.ObjectId, ref: name, required: true });

const schema = new mongoose.Schema(
  {
    pg: ref("Pg"),
    tenant: ref("User"),
    due: ref("RentDue"),
    requestedUntil: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    reason: { type: String, trim: true, maxlength: 200 },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    decidedAt: Date,
  },
  { timestamps: true }
);
schema.index({ due: 1 }, { unique: true, partialFilterExpression: { status: "pending" } }); // one open request per due
schema.index({ pg: 1, status: 1 });

export default mongoose.model("ExtensionRequest", schema);