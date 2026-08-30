const express = require("express");
const router = express.Router();
const { getOverdueAlerts, dismissAlert } = require("../controllers/alertController");
const { protect, requireRole } = require("../middleware/auth");

router.use(protect);

// Only approvers see and dismiss alerts
router.get("/", requireRole("approver"), getOverdueAlerts);
router.post("/dismiss", requireRole("approver"), dismissAlert);

module.exports = router;