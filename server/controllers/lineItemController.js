const LineItem = require("../models/LineItem");
const Requisition = require("../models/Requisition");

const computeAndSaveTotal = async (requisitionId) => {
  const items = await LineItem.find({ requisition: requisitionId });
  const total = items.reduce((sum, item) => {
    return sum + parseFloat(item.unit_price.toString()) * item.quantity;
  }, 0);
  await Requisition.findByIdAndUpdate(requisitionId, { total });
  return total;
};

exports.addLineItem = async (req, res) => {
  const requisition = await Requisition.findById(req.params.id);

  if (!requisition) {
    return res.status(404).json({ message: "Requisition not found" });
  }

  if (requisition.status !== "draft") {
    return res.status(400).json({ message: "Cannot add items to a non-draft requisition" });
  }

  const { description, quantity, unit_price } = req.body;

  const lineItem = await LineItem.create({
    requisition: requisition._id,
    description,
    quantity,
    unit_price,
  });

  const total = await computeAndSaveTotal(requisition._id);

  res.status(201).json({ lineItem, total });
};

exports.updateLineItem = async (req, res) => {
  const lineItem = await LineItem.findById(req.params.itemId);

  if (!lineItem) {
    return res.status(404).json({ message: "Line item not found" });
  }

  const requisition = await Requisition.findById(lineItem.requisition);

  if (requisition.status !== "draft") {
    return res.status(400).json({ message: "Cannot edit items on a non-draft requisition" });
  }

  const { description, quantity, unit_price } = req.body;

  const updated = await LineItem.findByIdAndUpdate(
    req.params.itemId,
    { description, quantity, unit_price },
    { new: true }
  );

  const total = await computeAndSaveTotal(lineItem.requisition);

  res.status(200).json({ lineItem: updated, total });
};

exports.deleteLineItem = async (req, res) => {
  const lineItem = await LineItem.findById(req.params.itemId);

  if (!lineItem) {
    return res.status(404).json({ message: "Line item not found" });
  }

  const requisition = await Requisition.findById(lineItem.requisition);

  if (requisition.status !== "draft") {
    return res.status(400).json({ message: "Cannot delete items from a non-draft requisition" });
  }

  await LineItem.findByIdAndDelete(req.params.itemId);

  const total = await computeAndSaveTotal(lineItem.requisition);

  res.status(200).json({ message: "Line item deleted", total });
};