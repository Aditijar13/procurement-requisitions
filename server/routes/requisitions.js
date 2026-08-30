const express = require("express");
const router = express.Router();
const {
  createRequisition,
  getRequisitions,
  getRequisition,
  updateRequisition,
  archiveRequisition,
  restoreRequisition,
  extendNeededBy,
} = require("../controllers/requisitionController");
const {
  addLineItem,
  updateLineItem,
  deleteLineItem,
} = require("../controllers/lineItemController");
const { getHistory } = require("../controllers/historyController");
const { protect, requireRole } = require("../middleware/auth");

router.use(protect);

router.get("/", getRequisitions);
router.post("/", requireRole("requester"), createRequisition);
router.get("/:id", getRequisition);
router.put("/:id", requireRole("requester"), updateRequisition);
router.patch("/:id/archive", archiveRequisition);
router.patch("/:id/restore", restoreRequisition);
router.patch("/:id/extend", requireRole("approver"), extendNeededBy);

// Line items
router.post("/:id/items", requireRole("requester"), addLineItem);
router.put("/:id/items/:itemId", requireRole("requester"), updateLineItem);
router.delete("/:id/items/:itemId", requireRole("requester"), deleteLineItem);

// Audit trail
router.get("/:id/history", getHistory);

module.exports = router;