const express = require("express");
const router = express.Router();
const {
  submitRequisition,
  approveRequisition,
  rejectRequisition,
  reopenRequisition,
  markOrdered,
  receiveItems,
   addComment,
} = require("../controllers/lifecycleController");
const {
  addApprover,
  removeApprover,
} = require("../controllers/approverController");
const { protect, requireRole } = require("../middleware/auth");

router.use(protect);

// Requester actions
router.patch("/:id/submit", requireRole("requester"), submitRequisition);
router.patch("/:id/reopen", requireRole("requester"), reopenRequisition);

// Approver actions
router.patch("/:id/approve", requireRole("approver"), approveRequisition);
router.patch("/:id/reject", requireRole("approver"), rejectRequisition);
router.patch("/:id/order", requireRole("approver"), markOrdered);
router.patch("/:id/receive", requireRole("approver"), receiveItems);

// Approver assignment - any approver can add or remove another
router.patch("/:id/approvers/add", requireRole("approver"), addApprover);
router.patch("/:id/approvers/remove", requireRole("approver"), removeApprover);
router.post("/:id/comment", addComment);

module.exports = router;