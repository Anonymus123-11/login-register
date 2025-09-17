const jwt = require("jsonwebtoken");

const adminAuth = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
        
        if (decoded.user.role !== 'admin') {
            return res.status(403).json({ message: "Access denied. Admin role required." });
        }
        
        req.user = decoded.user; // Attach user info to the request
        next();
    } catch (err) {
        return res.status(403).json({ message: "Invalid token." });
    }
};

module.exports = adminAuth;
