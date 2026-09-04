const Requisition = require("../models/Requisition");
const mongoose = require("mongoose");

exports.getDashboard = async (req, res) => {
  const now = new Date();
  const eightWeeksAgo = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const isRequester = req.user.role === "requester";
  const baseMatch = isRequester
    ? { is_archived: false, requester: new mongoose.Types.ObjectId(req.user._id) }
    : { is_archived: false };

  const [
    statusBreakdown,
    departmentBreakdown,
    weeklyReceived,
    totalCommitted,
    overdueCount,
    receivedThisWeek,
  ] = await Promise.all([
    Requisition.aggregate([
      { $match: baseMatch },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),

    Requisition.aggregate([
      { $match: { ...baseMatch, status: { $nin: ["draft", "rejected"] } } },
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 },
          total: { $sum: { $toDouble: "$total" } },
        },
      },
      { $sort: { total: -1 } },
    ]),

    Requisition.aggregate([
      {
        $match: {
          ...baseMatch,
          status: "received",
          updatedAt: { $gte: eightWeeksAgo },
        },
      },
      {
        $group: {
          _id: {
            week: { $week: "$updatedAt" },
            year: { $year: "$updatedAt" },
          },
          count: { $sum: 1 },
          total: { $sum: { $toDouble: "$total" } },
        },
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } },
    ]),

    Requisition.aggregate([
      {
        $match: {
          ...baseMatch,
          status: { $in: ["approved", "ordered"] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $toDouble: "$total" } },
          count: { $sum: 1 },
        },
      },
    ]),

    // Overdue — ordered requisitions past needed_by date
    Requisition.countDocuments({
      ...baseMatch,
      status: "ordered",
      needed_by: { $lt: now },
    }),

    // Received this week
    Requisition.countDocuments({
      ...baseMatch,
      status: "received",
      updatedAt: { $gte: startOfWeek },
    }),
  ]);

  const statusMap = {};
  statusBreakdown.forEach((s) => {
    statusMap[s._id] = s.count;
  });

  res.status(200).json({
    headline: {
      awaiting_approval: statusMap["submitted"] || 0,
      open_commitments_value: totalCommitted[0]?.total || 0,
      overdue: overdueCount,
      received_this_week: receivedThisWeek,
    },
    status_breakdown: statusMap,
    department_breakdown: departmentBreakdown,
    weekly_received: weeklyReceived,
    committed: {
      total: totalCommitted[0]?.total || 0,
      count: totalCommitted[0]?.count || 0,
    },
  });
};