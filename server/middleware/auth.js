const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verifies the JWT token on every protected route
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  const token = authHeader.split(" ")[1];

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  // Attach the full user object to req so controllers can access it
  req.user = await User.findById(decoded.id).select("-password");
  next();
};

// Role-based access — pass allowed roles as arguments e.g. requireRole("approver")
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};

module.exports = { protect, requireRole };