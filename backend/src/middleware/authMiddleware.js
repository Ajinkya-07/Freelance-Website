const jwt = require("jsonwebtoken");
const User = require("../models/User");
const config = require("../config/env");
const logger = require("../config/logger");
const { AuthenticationError, AuthorizationError } = require("../utils/errors");

/**
 * Middleware to verify JWT token and authenticate user
 */
function authRequired(req, res, next) {
  const authHeader = req.headers.authorization || "";

  // Expect: Authorization: Bearer <token>
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(
      new AuthenticationError("Missing or invalid Authorization header")
    );
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret);

    const user = User.findById(payload.userId);
    if (!user) {
      return next(new AuthenticationError("User not found"));
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new AuthenticationError("Token expired"));
    }
    if (err.name === "JsonWebTokenError") {
      return next(new AuthenticationError("Invalid token"));
    }
    logger.error("Auth error: ", err);
    return next(new AuthenticationError("Authentication failed"));
  }
}

/**
 * Middleware to check if user has required role
 * @param {string[]} roles - Array of allowed roles
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError("Authentication required"));
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(
        `User ${req.user.email} attempted to access ${req.originalUrl} without proper role`
      );
      return next(
        new AuthorizationError(
          `Access denied. Required role: ${roles.join(" or ")}`
        )
      );
    }

    next();
  };
}

module.exports = { authRequired, requireRole };
