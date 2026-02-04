const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { name } = require("../config/db");

const JWT_SECRET = process.env.JWT_SECRET || "devsecret_change_me";

function authRequired(req, res, next) {
  const authHeader = req.headers.authorization || "";

  //Expect: Authorization: Bearer <token>
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res
      .status(401)
      .json({ error: "Missing or invalid Authorization header" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    const user = User.findById(payload.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (err) {
    console.error("Auth error: ", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { authRequired };
