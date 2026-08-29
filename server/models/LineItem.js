const mongoose = require("mongoose");

const lineItemSchema = new mongoose.Schema(
  {
    requisition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Requisition",
      required: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    unit_price: {
      type: mongoose.Decimal128,
      required: [true, "Unit price is required"],
    },
    received_qty: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

lineItemSchema.set("toJSON", {
  transform(doc, ret) {
    if (ret.unit_price) {
      ret.unit_price = parseFloat(ret.unit_price.toString());
    }
    ret.subtotal = ret.unit_price * ret.quantity;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("LineItem", lineItemSchema);