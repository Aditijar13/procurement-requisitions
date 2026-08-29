const mongoose = require("mongoose");

const ACTIONS = [
  "created",
  "submitted",
  "approved",
  "rejected",
  "ordered",
  "received",
  "partially_received",
  "comment",
  "approver_added",
  "approver_removed",
  "archived",
  "restored",
  "reopened",
];

const historyEntrySchema = new mongoose.Schema({
  requisition: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Requisition",
    required: true,
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  action: {
    type: String,
    enum: ACTIONS,
    required: true,
  },
  comment: {
    type: String,
    trim: true,
    default: "",
  },
  snapshot: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  created_at: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
});

historyEntrySchema.index({ requisition: 1, created_at: 1 });

historyEntrySchema.set("toJSON", {
  transform(doc, ret) {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("HistoryEntry", historyEntrySchema);