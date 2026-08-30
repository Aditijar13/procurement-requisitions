const express = require("express");
const router = express.Router();
const { bulkApprove, exportCSV } = require("../controllers/bulkController");
const { protect, requireRole } = require("../middleware/auth");

router.use(protect);

// Both actions are approver only
router.post("/approve", requireRole("approver"), bulkApprove);
router.get("/export", requireRole("approver"), exportCSV);

module.exports = router;