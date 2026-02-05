const express = require("express");
const { register, login, getCurrentUser } = require("../controllers/authController");
const { registerValidation, loginValidation } = require("../middleware/validation");
const { authRequired } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and authorization
 */

// Register new user
router.post("/register", registerValidation, register);

// Login
router.post("/login", loginValidation, login);

// Get current user
router.get("/me", authRequired, getCurrentUser);

module.exports = router;
