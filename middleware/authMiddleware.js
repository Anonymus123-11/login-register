const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token invalid, access denied!" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    req.user = decoded.user; 
    next();
  } catch (err) {
    return res.status(403).json({ message: "Token invalid" });
  }
};

const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

const selfOrAdminMiddleware = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  const userId = req.params.id;
  if (req.user.role === "admin" || req.user.id === userId) {
    return next();
  }
  return res.status(403).json({ message: "Access denied" });
};

module.exports = { authMiddleware, adminMiddleware, selfOrAdminMiddleware };
