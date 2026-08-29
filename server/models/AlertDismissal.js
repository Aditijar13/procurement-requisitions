const mongoose = require("mongoose");

const alertDismissalSchema = new mongoose.Schema({
  requisition: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Requisition",
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  dismissed_at: {
    type: Date,
    default: Date.now,
  },
});

alertDismissalSchema.index({ requisition: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("AlertDismissal", alertDismissalSchema);