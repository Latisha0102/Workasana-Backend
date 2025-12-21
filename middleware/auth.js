const jwt = require("jsonwebtoken");
const NewUser = require("../models/user.model");

const JWT_SECRET = process.env.JWT_SECRET;

const authenticateToken = async (req, res, next) => {
  // 1. Get the full header (e.g., "Bearer eyJhbG...")
  const authHeader =
    req.headers["authorization"] || req.headers["Authorization"];

  // 2. Extract the token by removing "Bearer "
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Ensure the payload contains 'id' as signed in index.js
    const user = await NewUser.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = user;
    next();
  } catch (error) {
    // If verification fails, it returns 403
    console.error("JWT Verification Error:", error.message);
    res.status(403).json({ message: "Invalid token" });
  }
};

module.exports = { authenticateToken };
