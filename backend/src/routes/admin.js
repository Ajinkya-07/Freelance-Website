const express = require("express");
const { authRequired } = require("../middleware/authMiddleware");
const {
  requireAdmin,
  getDashboardStats,
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/adminController");

const router = express.Router();

// All admin routes require authentication + admin role
router.use(authRequired);
router.use(requireAdmin);

// Dashboard stats
router.get("/stats", getDashboardStats);

// User management
router.get("/users", getUsers);
router.get("/users/:id", getUser);
router.post("/users", createUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

module.exports = router;
