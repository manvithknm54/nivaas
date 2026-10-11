import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    pg: { type: mongoose.Schema.Types.ObjectId, ref: "Pg", required: true },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 1000 },
    category: { type: String, enum: ["water", "electricity", "wifi", "food", "cleaning", "furniture", "other"], default: "other" },
    status: { type: String, enum: ["open", "in_progress", "resolved"], default: "open" },
    resolution: { note: String, at: Date },
    timeline: [{ _id: false, status: String, note: String, at: { type: Date, default: Date.now } }],
  },
  { timestamps: true }
);
complaintSchema.index({ pg: 1, status: 1 });
complaintSchema.index({ tenant: 1 });

export default mongoose.model("Complaint", complaintSchema);