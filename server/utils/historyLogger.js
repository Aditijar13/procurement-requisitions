const HistoryEntry = require("../models/HistoryEntry");

const logHistory = async ({ requisition, actor, action, comment = "", snapshot = {} }) => {
  await HistoryEntry.create({
    requisition,
    actor,
    action,
    comment,
    snapshot,
  });
};

module.exports = logHistory;