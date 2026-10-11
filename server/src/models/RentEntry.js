import mongoose from "mongoose";

const rentEntrySchema = new mongoose.Schema(
  {
    pg: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pg",
      required: true,
    },

    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    due: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RentDue",
      required: true,
    },

    type: {
      type: String,
      enum: ["payment", "credit", "reversal"],
      required: true,
    },

    reversedType: {
      type: String,
      enum: ["payment", "credit"],
    },

    reverses: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RentEntry",
    },

    // Links a rent ledger entry to its leave request.
    leave: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeaveRequest",
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    method: {
      type: String,
      enum: ["cash", "upi", "bank", "other"],
      default: "cash",
    },

    note: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

rentEntrySchema.index({ due: 1 });

rentEntrySchema.index(
  { reverses: 1 },
  { unique: true, sparse: true }
); // An entry can be reversed only once.

export default mongoose.model("RentEntry", rentEntrySchema);