const express = require("express");
const router = express.Router();
const { authRequired, roleRequired } = require("../middleware/authMiddleware");
const {
  getAllPortfolioItems,
  getAllEditors,
  getEditorProfile,
  getMyPortfolio,
  createPortfolioItem,
  getPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  searchEditors,
  searchPortfolioItems,
  getCategories,
} = require("../controllers/portfolioController");

/**
 * @swagger
 * tags:
 *   name: Portfolio
 *   description: Editor portfolio management
 */

// Search and filter routes (must be before parameterized routes)
router.get("/search/editors", searchEditors);
router.get("/search/items", searchPortfolioItems);
router.get("/categories", getCategories);

// Public routes
router.get("/", getAllPortfolioItems);
router.get("/editors", getAllEditors);
router.get("/editor/:editorId", getEditorProfile);
router.get("/item/:id", getPortfolioItem);

// Protected routes (editors only)
router.get("/my", authRequired, getMyPortfolio);
router.post("/", authRequired, createPortfolioItem);
router.put("/:id", authRequired, updatePortfolioItem);
router.delete("/:id", authRequired, deletePortfolioItem);

module.exports = router;
