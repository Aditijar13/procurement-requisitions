const User = require("../models/User");

exports.getUsers = async (req, res) => {
  const users = await User.find().select("name email role department approval_limit");
  res.status(200).json({ users });
};

exports.getApprovers = async (req, res) => {
  const approvers = await User.find({ role: "approver" }).select(
    "name email department approval_limit"
  );
  res.status(200).json({ approvers });
};