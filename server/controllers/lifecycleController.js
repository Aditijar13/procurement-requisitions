const Requisition = require("../models/Requisition");
const LineItem = require("../models/LineItem");
const User = require("../models/User");
const logHistory = require("../utils/historyLogger");

exports.submitRequisition = async (req, res) => {
  const requisition = await Requisition.findById(req.params.id);

  if (!requisition) {
    return res.status(404).json({ message: "Requisition not found" });
  }

  if (requisition.requester.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Only the requester can submit" });
  }

  if (requisition.status !== "draft") {
    return res.status(400).json({ message: "Only draft requisitions can be submitted" });
  }

  const lineItems = await LineItem.find({ requisition: requisition._id });
  if (lineItems.length === 0) {
    return res.status(400).json({ message: "Add at least one line item before submitting" });
  }

  await Requisition.findByIdAndUpdate(req.params.id, { status: "submitted" });

  await logHistory({
    requisition: requisition._id,
    actor: req.user._id,
    action: "submitted",
    snapshot: { status: "submitted", total: requisition.total },
  });

  res.status(200).json({ message: "Requisition submitted successfully" });
};

exports.approveRequisition = async (req, res) => {
  const requisition = await Requisition.findById(req.params.id);

  if (!requisition) {
    return res.status(404).json({ message: "Requisition not found" });
  }

  if (requisition.status !== "submitted") {
    return res.status(400).json({ message: "Only submitted requisitions can be approved" });
  }

  const isAssigned = requisition.assigned_approvers.some(
    (approverId) => approverId.toString() === req.user._id.toString()
  );

  if (!isAssigned) {
    return res.status(403).json({ message: "You are not assigned to this requisition" });
  }

  // Always fetch limit fresh from DB — never trust the token
  const approver = await User.findById(req.user._id);
  const limit = parseFloat(approver.approval_limit.toString());
  const total = parseFloat(requisition.total.toString());

  if (total > limit) {
    return res.status(403).json({
      message: `Requisition total (₹${total}) exceeds your approval limit (₹${limit})`,
    });
  }

  await Requisition.findByIdAndUpdate(req.params.id, { status: "approved" });

  await logHistory({
    requisition: requisition._id,
    actor: req.user._id,
    action: "approved",
    snapshot: { status: "approved", total, approver_limit: limit },
  });

  res.status(200).json({ message: "Requisition approved" });
};

exports.rejectRequisition = async (req, res) => {
  const requisition = await Requisition.findById(req.params.id);

  if (!requisition) {
    return res.status(404).json({ message: "Requisition not found" });
  }

  if (requisition.status !== "submitted") {
    return res.status(400).json({ message: "Only submitted requisitions can be rejected" });
  }

  const isAssigned = requisition.assigned_approvers.some(
    (approverId) => approverId.toString() === req.user._id.toString()
  );

  if (!isAssigned) {
    return res.status(403).json({ message: "You are not assigned to this requisition" });
  }

  const { comment } = req.body;

  if (!comment) {
    return res.status(400).json({ message: "Rejection reason is required" });
  }

  await Requisition.findByIdAndUpdate(req.params.id, { status: "rejected" });

  await logHistory({
    requisition: requisition._id,
    actor: req.user._id,
    action: "rejected",
    comment,
    snapshot: { status: "rejected" },
  });

  res.status(200).json({ message: "Requisition rejected" });
};

exports.reopenRequisition = async (req, res) => {
  const requisition = await Requisition.findById(req.params.id);

  if (!requisition) {
    return res.status(404).json({ message: "Requisition not found" });
  }

  if (requisition.requester.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Only the requester can reopen" });
  }

  if (requisition.status !== "rejected") {
    return res.status(400).json({ message: "Only rejected requisitions can be reopened" });
  }

  await Requisition.findByIdAndUpdate(req.params.id, { status: "draft" });

  await logHistory({
    requisition: requisition._id,
    actor: req.user._id,
    action: "reopened",
    snapshot: { status: "draft" },
  });

  res.status(200).json({ message: "Requisition reopened" });
};

exports.markOrdered = async (req, res) => {
  const requisition = await Requisition.findById(req.params.id);

  if (!requisition) {
    return res.status(404).json({ message: "Requisition not found" });
  }

  if (requisition.status !== "approved") {
    return res.status(400).json({ message: "Only approved requisitions can be marked as ordered" });
  }

  const isAssigned = requisition.assigned_approvers.some(
    (approverId) => approverId.toString() === req.user._id.toString()
  );

  if (!isAssigned) {
    return res.status(403).json({ message: "You are not assigned to this requisition" });
  }

  await Requisition.findByIdAndUpdate(req.params.id, { status: "ordered" });

  await logHistory({
    requisition: requisition._id,
    actor: req.user._id,
    action: "ordered",
    snapshot: { status: "ordered" },
  });

  res.status(200).json({ message: "Requisition marked as ordered" });
};

exports.receiveItems = async (req, res) => {
  const requisition = await Requisition.findById(req.params.id);

  if (!requisition) {
    return res.status(404).json({ message: "Requisition not found" });
  }

  if (requisition.status !== "ordered") {
    return res.status(400).json({ message: "Only ordered requisitions can be received" });
  }

  const isAssigned = requisition.assigned_approvers.some(
    (approverId) => approverId.toString() === req.user._id.toString()
  );

  if (!isAssigned) {
    return res.status(403).json({ message: "You are not assigned to this requisition" });
  }

  // received_updates is an array of { itemId, received_qty }
  const { received_updates } = req.body;

  for (const update of received_updates) {
    const item = await LineItem.findById(update.itemId);
    if (!item) continue;

    const newReceivedQty = Math.min(update.received_qty, item.quantity);
    await LineItem.findByIdAndUpdate(update.itemId, { received_qty: newReceivedQty });
  }

  // Check if all items are fully received
  const allItems = await LineItem.find({ requisition: requisition._id });
  const allReceived = allItems.every((item) => item.received_qty >= item.quantity);

  if (allReceived) {
    await Requisition.findByIdAndUpdate(req.params.id, { status: "received" });
    await logHistory({
      requisition: requisition._id,
      actor: req.user._id,
      action: "received",
      snapshot: { status: "received" },
    });
    return res.status(200).json({ message: "All items received — requisition complete" });
  }

  await logHistory({
    requisition: requisition._id,
    actor: req.user._id,
    action: "partially_received",
    snapshot: { status: "ordered" },
  });

  res.status(200).json({ message: "Partial receipt recorded" });
};