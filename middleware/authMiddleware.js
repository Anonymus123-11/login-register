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

const multer = require("multer");

// Cấu hình storage cho avatar
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/avatars/"); // folder lưu avatar
  },
  filename: function (req, file, cb) {
    const ext = file.mimetype.split("/")[1]; // lấy extension
    cb(null, req.user.id + "." + ext); // đặt tên file theo userId
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 2 }, // giới hạn 2MB
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed!"));
  },
});

module.exports = { authMiddleware, adminMiddleware, selfOrAdminMiddleware, upload };

