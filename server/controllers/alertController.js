const Requisition = require("../models/Requisition");
const AlertDismissal = require("../models/AlertDismissal");

exports.getOverdueAlerts = async (req, res) => {
  // Find requisitions this approver is assigned to that are overdue
  const overdueRequisitions = await Requisition.find({
    assigned_approvers: req.user._id,
    status: "ordered",
    needed_by: { $lt: new Date() },
    is_archived: false,
  }).select("_id title vendor needed_by status total department");

  if (overdueRequisitions.length === 0) {
    return res.status(200).json({ alerts: [], count: 0 });
  }

  // Filter out ones this approver already dismissed
  const requisitionIds = overdueRequisitions.map((r) => r._id);
  const dismissals = await AlertDismissal.find({
    user: req.user._id,
    requisition: { $in: requisitionIds },
  });

  const dismissedIds = new Set(dismissals.map((d) => d.requisition.toString()));

  const alerts = overdueRequisitions.filter(
    (r) => !dismissedIds.has(r._id.toString())
  );

  res.status(200).json({ alerts, count: alerts.length });
};

exports.dismissAlert = async (req, res) => {
  const { requisitionId } = req.body;

  const requisition = await Requisition.findById(requisitionId);

  if (!requisition) {
    return res.status(404).json({ message: "Requisition not found" });
  }

  // unique index on requisition + user prevents duplicate dismissals
  await AlertDismissal.findOneAndUpdate(
    { requisition: requisitionId, user: req.user._id },
    { dismissed_at: new Date() },
    { upsert: true }
  );

  res.status(200).json({ message: "Alert dismissed" });
};