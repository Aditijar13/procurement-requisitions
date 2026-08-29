const express = require("express");
const router = express.Router();
const {
  createRequisition,
  getRequisitions,
  getRequisition,
  updateRequisition,
  archiveRequisition,
  restoreRequisition,
} = require("../controllers/requisitionController");
const {
  addLineItem,
  updateLineItem,
  deleteLineItem,
} = require("../controllers/lineItemController");
const { protect, requireRole } = require("../middleware/auth");

router.use(protect);

router.get("/", getRequisitions);
router.post("/", requireRole("requester"), createRequisition);
router.get("/:id", getRequisition);
router.put("/:id", requireRole("requester"), updateRequisition);
router.patch("/:id/archive", archiveRequisition);
router.patch("/:id/restore", archiveRequisition);

router.post("/:id/items", requireRole("requester"), addLineItem);
router.put("/:id/items/:itemId", requireRole("requester"), updateLineItem);
router.delete("/:id/items/:itemId", requireRole("requester"), deleteLineItem);

module.exports = router;