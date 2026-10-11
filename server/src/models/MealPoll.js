import mongoose from "mongoose";

const mealPollSchema = new mongoose.Schema(
  {
    pg: { type: mongoose.Schema.Types.ObjectId, ref: "Pg", required: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    option: { type: String, enum: ["egg", "nonveg"], required: true }, // the special item that day
    locked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

mealPollSchema.index({ pg: 1, date: 1 }, { unique: true });

export default mongoose.model("MealPoll", mealPollSchema);