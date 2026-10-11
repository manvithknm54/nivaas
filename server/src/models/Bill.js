import mongoose from "mongoose";

const billSchema = new mongoose.Schema(
  {
    pg: { type: mongoose.Schema.Types.ObjectId, ref: "Pg", required: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    amount: { type: Number, min: 0 },
    expiresOn: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    remindDaysBefore: { type: Number, default: 3, min: 0, max: 30 },
    lastRemindedOn: { type: String, default: null },
    history: [{ _id: false, renewedOn: String, expiresOn: String, amount: Number }],
  },
  { timestamps: true }
);
billSchema.index({ pg: 1, expiresOn: 1 });

export default mongoose.model("Bill", billSchema);