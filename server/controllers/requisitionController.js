const Requisition = require("../models/Requisition");
const LineItem = require("../models/LineItem");
const logHistory = require("../utils/historyLogger");

const computeAndSaveTotal = async (requisitionId) => {
  const items = await LineItem.find({ requisition: requisitionId });
  const total = items.reduce((sum, item) => {
    return sum + parseFloat(item.unit_price.toString()) * item.quantity;
  }, 0);
  await Requisition.findByIdAndUpdate(requisitionId, { total });
  return total;
};

exports.createRequisition = async (req, res) => {
  const { title, vendor, department, needed_by, line_items } = req.body;

  const requisition = await Requisition.create({
    title,
    vendor,
    department,
    needed_by,
    requester: req.user._id,
    status: "draft",
  });

  if (line_items && line_items.length > 0) {
    const items = line_items.map((item) => ({
      ...item,
      requisition: requisition._id,
    }));
    await LineItem.insertMany(items);
    await computeAndSaveTotal(requisition._id);
  }

  await logHistory({
    requisition: requisition._id,
    actor: req.user._id,
    action: "created",
    snapshot: { status: "draft", title },
  });

  const populated = await Requisition.findById(requisition._id).populate(
    "requester",
    "name email department"
  );

  res.status(201).json({ requisition: populated });
};

exports.getRequisitions = async (req, res) => {
  let query = { is_archived: false };

  // Requesters only see their own; approvers see all
  if (req.user.role === "requester") {
    query.requester = req.user._id;
  }

  const requisitions = await Requisition.find(query)
    .populate("requester", "name email department")
    .populate("assigned_approvers", "name email")
    .sort({ createdAt: -1 });

  res.status(200).json({ requisitions });
};

exports.getRequisition = async (req, res) => {
  const requisition = await Requisition.findById(req.params.id)
    .populate("requester", "name email department")
    .populate("assigned_approvers", "name email approval_limit");

  if (!requisition) {
    return res.status(404).json({ message: "Requisition not found" });
  }

  const lineItems = await LineItem.find({ requisition: requisition._id });

  res.status(200).json({ requisition, lineItems });
};

exports.updateRequisition = async (req, res) => {
  const requisition = await Requisition.findById(req.params.id);

  if (!requisition) {
    return res.status(404).json({ message: "Requisition not found" });
  }

  if (requisition.status !== "draft") {
    return res.status(400).json({ message: "Only draft requisitions can be edited" });
  }

  if (requisition.requester.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not authorized" });
  }

  const { title, vendor, department, needed_by } = req.body;

  const updated = await Requisition.findByIdAndUpdate(
    req.params.id,
    { title, vendor, department, needed_by },
    { new: true }
  ).populate("requester", "name email department");

  res.status(200).json({ requisition: updated });
};

exports.archiveRequisition = async (req, res) => {
  const requisition = await Requisition.findById(req.params.id);

  if (!requisition) {
    return res.status(404).json({ message: "Requisition not found" });
  }

  if (requisition.requester.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not authorized" });
  }

  await Requisition.findByIdAndUpdate(req.params.id, { is_archived: true });

  await logHistory({
    requisition: requisition._id,
    actor: req.user._id,
    action: "archived",
    snapshot: { status: requisition.status },
  });

  res.status(200).json({ message: "Requisition archived" });
};

exports.restoreRequisition = async (req, res) => {
  const requisition = await Requisition.findById(req.params.id);

  if (!requisition) {
    return res.status(404).json({ message: "Requisition not found" });
  }

  await Requisition.findByIdAndUpdate(req.params.id, { is_archived: false });

  await logHistory({
    requisition: requisition._id,
    actor: req.user._id,
    action: "restored",
    snapshot: { status: requisition.status },
  });

  res.status(200).json({ message: "Requisition restored" });
};