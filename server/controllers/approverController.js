const Requisition = require("../models/Requisition");
const User = require("../models/User");
const logHistory = require("../utils/historyLogger");

exports.addApprover = async (req, res) => {
  const requisition = await Requisition.findById(req.params.id);

  if (!requisition) {
    return res.status(404).json({ message: "Requisition not found" });
  }

  const { userId } = req.body;

  const userToAdd = await User.findById(userId);

  if (!userToAdd || userToAdd.role !== "approver") {
    return res.status(400).json({ message: "User is not a valid approver" });
  }

  const alreadyAssigned = requisition.assigned_approvers.some(
    (id) => id.toString() === userId
  );

  if (alreadyAssigned) {
    return res.status(400).json({ message: "Approver already assigned" });
  }

  await Requisition.findByIdAndUpdate(req.params.id, {
    $push: { assigned_approvers: userId },
  });

  await logHistory({
    requisition: requisition._id,
    actor: req.user._id,
    action: "approver_added",
    comment: `${userToAdd.name} added as approver`,
    snapshot: { added_approver: userToAdd.name },
  });

  res.status(200).json({ message: `${userToAdd.name} added as approver` });
};

exports.removeApprover = async (req, res) => {
  const requisition = await Requisition.findById(req.params.id);

  if (!requisition) {
    return res.status(404).json({ message: "Requisition not found" });
  }

  const { userId } = req.body;

  const userToRemove = await User.findById(userId);

  if (!userToRemove) {
    return res.status(404).json({ message: "User not found" });
  }

  await Requisition.findByIdAndUpdate(req.params.id, {
    $pull: { assigned_approvers: userId },
  });

  await logHistory({
    requisition: requisition._id,
    actor: req.user._id,
    action: "approver_removed",
    comment: `${userToRemove.name} removed as approver`,
    snapshot: { removed_approver: userToRemove.name },
  });

  res.status(200).json({ message: `${userToRemove.name} removed as approver` });
};