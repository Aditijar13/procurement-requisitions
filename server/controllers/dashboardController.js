const Requisition = require("../models/Requisition");

exports.getDashboard = async (req, res) => {
  const now = new Date();
  const eightWeeksAgo = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000);

  const [statusBreakdown, departmentBreakdown, weeklyReceived, totalCommitted] =
    await Promise.all([
      // Count of requisitions grouped by status
      Requisition.aggregate([
        { $match: { is_archived: false } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      // Count and total value grouped by department
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

      // Requisitions received per week for last 8 weeks
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

      // Total money committed — approved and ordered only
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
    ]);

  // Format status breakdown as a clean object
  const statusMap = {};
  statusBreakdown.forEach((s) => {
    statusMap[s._id] = s.count;
  });

  res.status(200).json({
    status_breakdown: statusMap,
    department_breakdown: departmentBreakdown,
    weekly_received: weeklyReceived,
    committed: {
      total: totalCommitted[0]?.total || 0,
      count: totalCommitted[0]?.count || 0,
    },
  });
};