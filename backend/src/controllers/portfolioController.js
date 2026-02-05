const Portfolio = require("../models/Portfolio");
const logger = require("../config/logger");
const { asyncHandler } = require("../middleware/errorHandler");
const {
  ValidationError,
  NotFoundError,
  AuthorizationError,
} = require("../utils/errors");

/**
 * @swagger
 * /portfolio:
 *   get:
 *     tags: [Portfolio]
 *     summary: Get all portfolio items
 *     description: Get public portfolio items from all editors
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of portfolio items
 */
const getAllPortfolioItems = asyncHandler(async (req, res) => {
  const { category, limit = 50, offset = 0 } = req.query;
  
  const items = Portfolio.findAll({
    category,
    limit: parseInt(limit),
    offset: parseInt(offset),
  });

  res.json({
    success: true,
    count: items.length,
    items,
  });
});

/**
 * @swagger
 * /portfolio/editors:
 *   get:
 *     tags: [Portfolio]
 *     summary: Get all editors
 *     description: Get list of all editors with portfolio counts
 *     responses:
 *       200:
 *         description: List of editors
 */
const getAllEditors = asyncHandler(async (req, res) => {
  const { limit = 20, offset = 0 } = req.query;
  
  const editors = Portfolio.getAllEditors({
    limit: parseInt(limit),
    offset: parseInt(offset),
  });

  res.json({
    success: true,
    count: editors.length,
    editors,
  });
});

/**
 * @swagger
 * /portfolio/editor/{editorId}:
 *   get:
 *     tags: [Portfolio]
 *     summary: Get editor profile with portfolio
 *     description: Get detailed editor profile including portfolio items and stats
 *     parameters:
 *       - in: path
 *         name: editorId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Editor profile with portfolio
 *       404:
 *         description: Editor not found
 */
const getEditorProfile = asyncHandler(async (req, res) => {
  const { editorId } = req.params;
  
  const profile = Portfolio.getEditorProfile(parseInt(editorId));
  
  if (!profile) {
    throw new NotFoundError("Editor not found");
  }

  res.json({
    success: true,
    profile,
  });
});

/**
 * @swagger
 * /portfolio/my:
 *   get:
 *     tags: [Portfolio]
 *     summary: Get my portfolio items
 *     description: Get portfolio items for the authenticated editor
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of portfolio items
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only editors can have portfolios
 */
const getMyPortfolio = asyncHandler(async (req, res) => {
  if (req.user.role !== "editor") {
    throw new AuthorizationError("Only editors can have portfolios");
  }

  const items = Portfolio.findByEditorId(req.user.id);

  res.json({
    success: true,
    count: items.length,
    items,
  });
});

/**
 * @swagger
 * /portfolio:
 *   post:
 *     tags: [Portfolio]
 *     summary: Create portfolio item
 *     description: Add a new portfolio item (editors only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               thumbnailUrl:
 *                 type: string
 *               videoUrl:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Portfolio item created
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only editors can create portfolio items
 */
const createPortfolioItem = asyncHandler(async (req, res) => {
  if (req.user.role !== "editor") {
    throw new AuthorizationError("Only editors can create portfolio items");
  }

  const { title, description, category, thumbnailUrl, videoUrl, tags } = req.body;

  if (!title || !description) {
    throw new ValidationError("Title and description are required");
  }

  const item = Portfolio.create({
    editorId: req.user.id,
    title: title.trim(),
    description: description.trim(),
    category: category?.trim() || null,
    thumbnailUrl: thumbnailUrl?.trim() || null,
    videoUrl: videoUrl?.trim() || null,
    tags: tags || [],
  });

  logger.info(`Portfolio item created: ${item.id} by editor ${req.user.id}`);

  res.status(201).json({
    success: true,
    message: "Portfolio item created successfully",
    item,
  });
});

/**
 * @swagger
 * /portfolio/{id}:
 *   get:
 *     tags: [Portfolio]
 *     summary: Get portfolio item by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Portfolio item details
 *       404:
 *         description: Portfolio item not found
 */
const getPortfolioItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const item = Portfolio.findById(parseInt(id));
  
  if (!item) {
    throw new NotFoundError("Portfolio item not found");
  }

  res.json({
    success: true,
    item,
  });
});

/**
 * @swagger
 * /portfolio/{id}:
 *   put:
 *     tags: [Portfolio]
 *     summary: Update portfolio item
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               thumbnailUrl:
 *                 type: string
 *               videoUrl:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Portfolio item updated
 *       404:
 *         description: Portfolio item not found
 *       403:
 *         description: Not authorized to update this item
 */
const updatePortfolioItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const item = Portfolio.findById(parseInt(id));
  
  if (!item) {
    throw new NotFoundError("Portfolio item not found");
  }

  if (item.editor_id !== req.user.id) {
    throw new AuthorizationError("Not authorized to update this portfolio item");
  }

  const { title, description, category, thumbnailUrl, videoUrl, tags } = req.body;

  const updated = Portfolio.update(parseInt(id), {
    title: title?.trim(),
    description: description?.trim(),
    category: category?.trim(),
    thumbnailUrl: thumbnailUrl?.trim(),
    videoUrl: videoUrl?.trim(),
    tags,
  });

  logger.info(`Portfolio item updated: ${id} by editor ${req.user.id}`);

  res.json({
    success: true,
    message: "Portfolio item updated successfully",
  });
});

/**
 * @swagger
 * /portfolio/{id}:
 *   delete:
 *     tags: [Portfolio]
 *     summary: Delete portfolio item
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Portfolio item deleted
 *       404:
 *         description: Portfolio item not found
 *       403:
 *         description: Not authorized to delete this item
 */
const deletePortfolioItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const item = Portfolio.findById(parseInt(id));
  
  if (!item) {
    throw new NotFoundError("Portfolio item not found");
  }

  if (item.editor_id !== req.user.id) {
    throw new AuthorizationError("Not authorized to delete this portfolio item");
  }

  Portfolio.delete(parseInt(id));

  logger.info(`Portfolio item deleted: ${id} by editor ${req.user.id}`);

  res.json({
    success: true,
    message: "Portfolio item deleted successfully",
  });
});

/**
 * @swagger
 * /portfolio/search/editors:
 *   get:
 *     tags: [Portfolio]
 *     summary: Search editors with filters
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *       - in: query
 *         name: minProjects
 *         schema:
 *           type: integer
 *       - in: query
 *         name: hasPortfolio
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [completed_projects, portfolio_count, average_rating, review_count, created_at]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 */
const searchEditors = asyncHandler(async (req, res) => {
  const {
    q: query,
    minRating,
    minProjects,
    hasPortfolio,
    category,
    sortBy = 'completed_projects',
    sortOrder = 'DESC',
    page = 1,
    limit = 20
  } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);

  const searchParams = {
    query,
    minRating: minRating ? parseFloat(minRating) : null,
    minProjects: minProjects ? parseInt(minProjects) : null,
    hasPortfolio: hasPortfolio === 'true',
    category,
    sortBy,
    sortOrder,
    limit: parseInt(limit),
    offset
  };

  const editors = Portfolio.searchEditors(searchParams);
  const { total } = Portfolio.searchEditorsCount(searchParams);
  const categories = Portfolio.getCategories();

  res.json({
    success: true,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    },
    availableCategories: categories,
    count: editors.length,
    editors
  });
});

/**
 * @swagger
 * /portfolio/search/items:
 *   get:
 *     tags: [Portfolio]
 *     summary: Search portfolio items with filters
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: editorId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated tags
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [created_at, views, title]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 */
const searchPortfolioItems = asyncHandler(async (req, res) => {
  const {
    q: query,
    category,
    editorId,
    tags,
    sortBy = 'created_at',
    sortOrder = 'DESC',
    page = 1,
    limit = 20
  } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const tagList = tags ? tags.split(',').map(t => t.trim()) : null;

  const searchParams = {
    query,
    category,
    editorId: editorId ? parseInt(editorId) : null,
    tags: tagList,
    sortBy,
    sortOrder,
    limit: parseInt(limit),
    offset
  };

  const items = Portfolio.searchPortfolioItems(searchParams);
  const categories = Portfolio.getCategories();

  res.json({
    success: true,
    availableCategories: categories,
    count: items.length,
    items
  });
});

/**
 * @swagger
 * /portfolio/categories:
 *   get:
 *     tags: [Portfolio]
 *     summary: Get all portfolio categories with counts
 */
const getCategories = asyncHandler(async (req, res) => {
  const categories = Portfolio.getCategories();

  res.json({
    success: true,
    count: categories.length,
    categories
  });
});

module.exports = {
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
};
