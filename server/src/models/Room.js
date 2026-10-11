import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    pg: { type: mongoose.Schema.Types.ObjectId, ref: "Pg", required: true },
    number: { type: String, required: true, trim: true },
    type: { type: String, enum: ["hall", "shared_bath", "attached_bath"], required: true },
    beds: { type: Number, required: true, min: 1, max: 20, default: 1 },
  },
  { timestamps: true }
);

roomSchema.index({ pg: 1, number: 1 }, { unique: true });

export default mongoose.model("Room", roomSchema);