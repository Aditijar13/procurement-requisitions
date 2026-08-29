const mongoose = require("mongoose");

const requisitionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    vendor: {
      type: String,
      required: [true, "Vendor is required"],
      trim: true,
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
    },
    needed_by: {
      type: Date,
      required: [true, "Needed-by date is required"],
    },
    status: {
      type: String,
      enum: ["draft", "submitted", "approved", "rejected", "ordered", "received"],
      default: "draft",
    },
    total: {
      type: mongoose.Decimal128,
      default: 0,
    },
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assigned_approvers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    is_archived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

requisitionSchema.index({ title: "text", vendor: "text" });
requisitionSchema.index({ status: 1 });
requisitionSchema.index({ department: 1 });
requisitionSchema.index({ needed_by: 1 });
requisitionSchema.index({ is_archived: 1 });

requisitionSchema.set("toJSON", {
  transform(doc, ret) {
    if (ret.total) {
      ret.total = parseFloat(ret.total.toString());
    }
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Requisition", requisitionSchema);