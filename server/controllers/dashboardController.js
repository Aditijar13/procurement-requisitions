const Requisition = require("../models/Requisition");

exports.getDashboard = async (req, res) => {
  const now = new Date();
  const eightWeeksAgo = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const [
    statusBreakdown,
    departmentBreakdown,
    weeklyReceived,
    totalCommitted,
    overdueCount,
    receivedThisWeek,
  ] = await Promise.all([
    Requisition.aggregate([
      { $match: { is_archived: false } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),

    Requisition.aggregate([
      { $match: { is_archived: false, status: { $nin: ["draft", "rejected"] } } },
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
          is_archived: false,
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
      status: "ordered",
      needed_by: { $lt: now },
      is_archived: false,
    }),

    // Received this week
    Requisition.countDocuments({
      status: "received",
      updatedAt: { $gte: startOfWeek },
      is_archived: false,
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