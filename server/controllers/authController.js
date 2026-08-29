const jwt = require("jsonwebtoken");
const User = require("../models/User");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.register = async (req, res) => {
  const { name, email, password, role, department, approval_limit } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "Email already registered" });
  }

  // approval_limit is only relevant for approvers
  const user = await User.create({
    name,
    email,
    password,
    role,
    department,
    approval_limit: role === "approver" ? approval_limit : null,
  });

  const token = signToken(user._id);

  res.status(201).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      approval_limit: user.approval_limit
        ? parseFloat(user.approval_limit.toString())
        : null,
    },
  });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  // Explicitly select password since we set select: false on the schema
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signToken(user._id);

  res.status(200).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      approval_limit: user.approval_limit
        ? parseFloat(user.approval_limit.toString())
        : null,
    },
  });
};

exports.getMe = async (req, res) => {
  // req.user is already attached by the protect middleware
  res.status(200).json({ user: req.user });
};
