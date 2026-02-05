const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware to check validation results
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

/**
 * Validation rules for user registration
 */
const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['client', 'editor', 'admin'])
    .withMessage('Role must be either client, editor, or admin'),
  validate,
];

/**
 * Validation rules for user login
 */
const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password').trim().notEmpty().withMessage('Password is required'),
  validate,
];

/**
 * Validation rules for creating a job
 */
const createJobValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 10, max: 200 })
    .withMessage('Title must be between 10 and 200 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 50 })
    .withMessage('Description must be at least 50 characters'),
  body('duration_minutes')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer'),
  body('budget_min')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum budget must be a positive number'),
  body('budget_max')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum budget must be a positive number')
    .custom((value, { req }) => {
      if (req.body.budget_min && value < req.body.budget_min) {
        throw new Error('Maximum budget must be greater than minimum budget');
      }
      return true;
    }),
  validate,
];

/**
 * Validation rules for creating a proposal
 */
const createProposalValidation = [
  body('job_id')
    .notEmpty()
    .withMessage('Job ID is required')
    .isInt({ min: 1 })
    .withMessage('Job ID must be a valid integer'),
  body('cover_letter')
    .trim()
    .notEmpty()
    .withMessage('Cover letter is required')
    .isLength({ min: 100 })
    .withMessage('Cover letter must be at least 100 characters'),
  body('proposed_price')
    .notEmpty()
    .withMessage('Proposed price is required')
    .isFloat({ min: 0 })
    .withMessage('Proposed price must be a positive number'),
  validate,
];

/**
 * Validation rules for ID parameters
 */
const idParamValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID must be a valid positive integer'),
  validate,
];

/**
 * Validation rules for pagination
 */
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  validate,
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  createJobValidation,
  createProposalValidation,
  idParamValidation,
  paginationValidation,
};
