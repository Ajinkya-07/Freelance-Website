const bcrypt = require("bcrypt");
const User = require("../models/User");
const Job = require("../models/Job");
const Project = require("../models/Project");
const { asyncHandler } = require("../middleware/errorHandler");
const { NotFoundError, ForbiddenError, ValidationError, ConflictError } = require("../utils/errors");

/**
 * Check if user is admin
 */
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    throw new ForbiddenError("Admin access required");
  }
  next();
};

/**
 * Get admin dashboard stats
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  const userStats = User.getStats();
  
  // Get job stats
  const jobStats = {
    total: Job.count({}),
    open: Job.count({ status: "open" }),
  };

  // Get project stats
  const projectStats = Project.getStats ? Project.getStats() : { total: 0 };

  res.json({
    success: true,
    stats: {
      users: userStats,
      jobs: jobStats,
      projects: projectStats,
    },
  });
});

/**
 * Get all users with filtering
 */
const getUsers = asyncHandler(async (req, res) => {
  const { role, search, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const users = User.findAll({
    role,
    search,
    limit: parseInt(limit),
    offset,
  });

  const total = User.count({ role, search });

  res.json({
    success: true,
    users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

/**
 * Get single user
 */
const getUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = User.findById(id);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  res.json({
    success: true,
    user,
  });
});

/**
 * Create new user (admin)
 */
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    throw new ValidationError("Name, email, and password are required");
  }

  // Check for existing email
  const existing = User.findByEmail(email.toLowerCase().trim());
  if (existing) {
    throw new ConflictError("Email already registered");
  }

  // Valid roles
  const validRoles = ["client", "editor", "admin"];
  const userRole = validRoles.includes(role) ? role : "client";

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  const newUser = User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    role: userRole,
  });

  res.status(201).json({
    success: true,
    message: "User created successfully",
    user: newUser,
  });
});

/**
 * Update user
 */
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, role } = req.body;

  const user = User.findById(id);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  // If updating email, check for duplicates
  if (email && email !== user.email) {
    const existing = User.findByEmail(email.toLowerCase().trim());
    if (existing) {
      throw new ConflictError("Email already in use");
    }
  }

  const updatedUser = User.update(id, {
    name: name?.trim(),
    email: email?.toLowerCase().trim(),
    role,
  });

  res.json({
    success: true,
    message: "User updated successfully",
    user: updatedUser,
  });
});

/**
 * Delete user
 */
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Prevent self-deletion
  if (parseInt(id) === req.user.id) {
    throw new ValidationError("You cannot delete your own account");
  }

  const user = User.findById(id);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  User.delete(id);

  res.json({
    success: true,
    message: `User "${user.name}" deleted successfully`,
  });
});

module.exports = {
  requireAdmin,
  getDashboardStats,
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
};
