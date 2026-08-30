const Requisition = require("../models/Requisition");
const User = require("../models/User");
const logHistory = require("../utils/historyLogger");

exports.bulkApprove = async (req, res) => {
  const { requisitionIds } = req.body;

  if (!requisitionIds || requisitionIds.length === 0) {
    return res.status(400).json({ message: "No requisitions selected" });
  }

  // Fetch approver's limit fresh from DB
  const approver = await User.findById(req.user._id);
  const limit = parseFloat(approver.approval_limit.toString());

  const results = [];

  for (const id of requisitionIds) {
    const requisition = await Requisition.findById(id);

    if (!requisition) {
      results.push({ id, success: false, message: "Requisition not found" });
      continue;
    }

    if (requisition.status !== "submitted") {
      results.push({ id, success: false, message: "Not in submitted status" });
      continue;
    }

    const isAssigned = requisition.assigned_approvers.some(
      (approverId) => approverId.toString() === req.user._id.toString()
    );

    if (!isAssigned) {
      results.push({ id, success: false, message: "Not assigned to this requisition" });
      continue;
    }

    const total = parseFloat(requisition.total.toString());

    if (total > limit) {
      results.push({
        id,
        success: false,
        message: `Total ₹${total} exceeds your approval limit ₹${limit}`,
      });
      continue;
    }

    await Requisition.findByIdAndUpdate(id, { status: "approved" });

    await logHistory({
      requisition: id,
      actor: req.user._id,
      action: "approved",
      comment: "Approved via bulk action",
      snapshot: { status: "approved", total, approver_limit: limit },
    });

    results.push({ id, success: true, message: "Approved successfully" });
  }

  res.status(200).json({ results });
};

exports.exportCSV = async (req, res) => {
  // Open commitments = ordered requisitions
  const requisitions = await Requisition.find({
    status: "ordered",
    is_archived: false,
  }).populate("requester", "name department");

  const rows = [
    ["ID", "Title", "Vendor", "Department", "Total", "Requester", "Needed By"],
  ];

  for (const r of requisitions) {
    rows.push([
      r._id.toString(),
      r.title,
      r.vendor,
      r.department,
      parseFloat(r.total.toString()),
      r.requester.name,
      r.needed_by.toISOString().split("T")[0],
    ]);
  }

  const csv = rows.map((row) => row.join(",")).join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=open-commitments.csv");
  res.status(200).send(csv);
};