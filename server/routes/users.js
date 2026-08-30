const express = require("express");
const router = express.Router();
const { getUsers, getApprovers } = require("../controllers/userController");
const { protect, requireRole } = require("../middleware/auth");

router.use(protect);

router.get("/", getUsers);
router.get("/approvers", getApprovers);

module.exports = router;