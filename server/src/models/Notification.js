import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  kind: String,
  key: String, // same key = update the existing notification instead of adding a new one
  title: { type: String, required: true },
  body: String,
  link: String,
  read: { type: Boolean, default: false },
  at: { type: Date, default: Date.now },
});
notificationSchema.index({ user: 1, at: -1 });
notificationSchema.index({ user: 1, key: 1 }, { unique: true, partialFilterExpression: { key: { $type: "string" } } });

export default mongoose.model("Notification", notificationSchema);