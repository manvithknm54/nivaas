import mongoose from "mongoose";

const mealVoteSchema = new mongoose.Schema(
  {
    poll: { type: mongoose.Schema.Types.ObjectId, ref: "MealPoll", required: true },
    pg: { type: mongoose.Schema.Types.ObjectId, ref: "Pg", required: true },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    choice: { type: String, enum: ["veg", "egg", "nonveg"], required: true },
  },
  { timestamps: true }
);

mealVoteSchema.index({ poll: 1, tenant: 1 }, { unique: true }); // one vote per tenant per poll

export default mongoose.model("MealVote", mealVoteSchema);