const HistoryEntry = require("../models/HistoryEntry");

const sanitizeSnapshot = (snapshot) => {
  return JSON.parse(JSON.stringify(snapshot, (key, value) => {
    if (value && value.$numberDecimal) {
      return parseFloat(value.$numberDecimal);
    }
    return value;
  }));
};

const logHistory = async ({ requisition, actor, action, comment = "", snapshot = {} }) => {
  await HistoryEntry.create({
    requisition,
    actor,
    action,
    comment,
    snapshot: sanitizeSnapshot(snapshot),
  });
};

module.exports = logHistory;