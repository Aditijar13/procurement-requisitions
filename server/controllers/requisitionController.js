const Requisition = require("../models/Requisition");
const LineItem = require("../models/LineItem");
const logHistory = require("../utils/historyLogger");
const AlertDismissal = require("../models/AlertDismissal");

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
  const { search, status, department, overdue, sort, page = 1, limit = 10, owner, assigned } = req.query;

  let query = { is_archived: req.query.archived === "true" ? true : false };

  if (req.user.role === "requester") {
    query.requester = req.user._id;
  }

  if (status) query.status = status;
  if (department) query.department = department;

  if (overdue === "true") {
    query.needed_by = { $lt: new Date() };
    query.status = { $in: ["ordered", "approved"] };
  }

  // Filter by specific requester (owner) — approvers can use this to view one person's requisitions
  if (owner) query.requester = owner;

  // Filter to only requisitions assigned to the current approver
  if (assigned === "true" && req.user.role === "approver") {
    query.assigned_approvers = req.user._id;
  }

  if (search) {
    query.$text = { $search: search };
  }

  let sortOption = { createdAt: -1 };
if (sort === "total_asc") sortOption = { total: 1 };
if (sort === "total_desc") sortOption = { total: -1 };
if (sort === "date_asc") sortOption = { createdAt: 1 };
if (sort === "needed_by") sortOption = { needed_by: 1 };
if (sort === "status") sortOption = { status: 1 };

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [requisitions, total] = await Promise.all([
    Requisition.find(query)
      .populate("requester", "name email department")
      .populate("assigned_approvers", "name email")
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit)),
    Requisition.countDocuments(query),
  ]);

  res.status(200).json({
    requisitions,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
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

  // If needed_by date changed, delete all dismissal records so alerts re-surface
  if (needed_by && new Date(needed_by).getTime() !== requisition.needed_by.getTime()) {
    await AlertDismissal.deleteMany({ requisition: requisition._id });
  }

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

exports.extendNeededBy = async (req, res) => {
  const requisition = await Requisition.findById(req.params.id);

  if (!requisition) {
    return res.status(404).json({ message: "Requisition not found" });
  }

  if (requisition.status !== "ordered") {
    return res.status(400).json({ message: "Can only extend needed-by date on ordered requisitions" });
  }

  const { needed_by } = req.body;

  if (!needed_by) {
    return res.status(400).json({ message: "needed_by date is required" });
  }

  const oldDate = requisition.needed_by;

  // If date is extended and new date has passed, delete dismissals so alert re-surfaces
  await AlertDismissal.deleteMany({ requisition: requisition._id });

  await Requisition.findByIdAndUpdate(req.params.id, { needed_by });

  await logHistory({
    requisition: requisition._id,
    actor: req.user._id,
    action: "comment",
    comment: `Needed-by date extended from ${oldDate.toISOString().split("T")[0]} to ${new Date(needed_by).toISOString().split("T")[0]}`,
    snapshot: { old_needed_by: oldDate, new_needed_by: needed_by },
  });

  res.status(200).json({ message: "Needed-by date extended" });
};