const HistoryEntry = require("../models/HistoryEntry");

exports.getHistory = async (req, res) => {
  const history = await HistoryEntry.find({ requisition: req.params.id })
    .populate("actor", "name email role")
    .sort({ created_at: 1 });

  res.status(200).json({ history });
};