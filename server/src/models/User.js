import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["owner", "tenant"], required: true },
    pg: { type: mongoose.Schema.Types.ObjectId, ref: "Pg", default: null },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", default: null },
    diet: { type: String, enum: ["veg", "nonveg"], default: "veg" },
    status: { type: String, enum: ["unassigned", "pending", "active", "left"], default: "unassigned" },
    joinedOn: Date,
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.matches = function (plain) {
  return bcrypt.compare(plain, this.password);
};

export default mongoose.model("User", userSchema);