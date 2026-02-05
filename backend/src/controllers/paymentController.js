const Payment = require("../models/Payment");
const Project = require("../models/Project");
const logger = require("../config/logger");
const { asyncHandler } = require("../middleware/errorHandler");
const {
  ValidationError,
  NotFoundError,
  AuthorizationError,
} = require("../utils/errors");

/**
 * @swagger
 * /payments/create:
 *   post:
 *     tags: [Payments]
 *     summary: Create a payment
 *     description: Create a new payment for a project (demo mode)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectId
 *               - amount
 *             properties:
 *               projectId:
 *                 type: integer
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
const createPayment = asyncHandler(async (req, res) => {
  const { projectId, amount, description } = req.body;

  if (!projectId || !amount) {
    throw new ValidationError("Project ID and amount are required");
  }

  if (amount <= 0) {
    throw new ValidationError("Amount must be greater than 0");
  }

  // Get project details
  const project = Project.findById(projectId);
  if (!project) {
    throw new NotFoundError("Project not found");
  }

  // Only client can create payment
  if (project.client_id !== req.user.id) {
    throw new AuthorizationError("Only the client can create payments for this project");
  }

  const payment = Payment.create({
    projectId,
    payerId: req.user.id,
    payeeId: project.editor_id,
    amount: parseFloat(amount),
    currency: "USD",
    description: description || `Payment for project #${projectId}`,
  });

  logger.info(`Payment created: ${payment.transactionId} for project ${projectId}`);

  res.status(201).json({
    success: true,
    message: "Payment created successfully",
    payment,
  });
});

/**
 * @swagger
 * /payments/{id}/process:
 *   post:
 *     tags: [Payments]
 *     summary: Process a payment
 *     description: Process a pending payment (demo mode - simulates payment gateway)
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
 *               paymentMethod:
 *                 type: string
 *                 enum: [demo_card, demo_bank, demo_wallet]
 *                 default: demo_card
 *               cardNumber:
 *                 type: string
 *                 description: Demo card number (any 16 digits)
 *     responses:
 *       200:
 *         description: Payment processed
 *       400:
 *         description: Payment already processed
 *       404:
 *         description: Payment not found
 */
const processPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { paymentMethod = "demo_card", cardNumber } = req.body;

  const payment = Payment.findById(parseInt(id));
  if (!payment) {
    throw new NotFoundError("Payment not found");
  }

  // Only payer can process payment
  if (payment.payer_id !== req.user.id) {
    throw new AuthorizationError("Only the payer can process this payment");
  }

  // Simulate card validation (demo)
  if (paymentMethod === "demo_card" && cardNumber) {
    const cleanCard = cardNumber.replace(/\s/g, "");
    if (cleanCard.length !== 16 || !/^\d+$/.test(cleanCard)) {
      throw new ValidationError("Invalid card number format (demo: use any 16 digits)");
    }
  }

  const result = Payment.processPayment(parseInt(id), { paymentMethod });

  if (!result.success && result.error) {
    throw new ValidationError(result.error);
  }

  logger.info(`Payment processed: ${result.transactionId} - ${result.status}`);

  res.json({
    success: result.success,
    message: result.message,
    transactionId: result.transactionId,
    status: result.status,
  });
});

/**
 * @swagger
 * /payments/my:
 *   get:
 *     tags: [Payments]
 *     summary: Get my payments
 *     description: Get all payments for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [all, payer, payee]
 *           default: all
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, refunded]
 *     responses:
 *       200:
 *         description: List of payments
 */
const getMyPayments = asyncHandler(async (req, res) => {
  const { role = "all", status, limit = 50, offset = 0 } = req.query;

  const payments = Payment.findByUserId(req.user.id, {
    role,
    status,
    limit: parseInt(limit),
    offset: parseInt(offset),
  });

  res.json({
    success: true,
    count: payments.length,
    payments,
  });
});

/**
 * @swagger
 * /payments/{id}:
 *   get:
 *     tags: [Payments]
 *     summary: Get payment by ID
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
 *         description: Payment details
 *       404:
 *         description: Payment not found
 */
const getPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const payment = Payment.findById(parseInt(id));
  if (!payment) {
    throw new NotFoundError("Payment not found");
  }

  // Check authorization
  if (payment.payer_id !== req.user.id && payment.payee_id !== req.user.id) {
    throw new AuthorizationError("Not authorized to view this payment");
  }

  res.json({
    success: true,
    payment,
  });
});

/**
 * @swagger
 * /payments/project/{projectId}:
 *   get:
 *     tags: [Payments]
 *     summary: Get payments for a project
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of payments for the project
 */
const getProjectPayments = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = Project.findById(parseInt(projectId));
  if (!project) {
    throw new NotFoundError("Project not found");
  }

  // Check authorization
  if (project.client_id !== req.user.id && project.editor_id !== req.user.id) {
    throw new AuthorizationError("Not authorized to view payments for this project");
  }

  const payments = Payment.findByProjectId(parseInt(projectId));

  res.json({
    success: true,
    count: payments.length,
    payments,
  });
});

/**
 * @swagger
 * /payments/{id}/refund:
 *   post:
 *     tags: [Payments]
 *     summary: Refund a payment
 *     description: Refund a completed payment (demo mode)
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
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment refunded
 *       400:
 *         description: Payment cannot be refunded
 */
const refundPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const payment = Payment.findById(parseInt(id));
  if (!payment) {
    throw new NotFoundError("Payment not found");
  }

  // Only payer can request refund
  if (payment.payer_id !== req.user.id) {
    throw new AuthorizationError("Only the payer can request a refund");
  }

  const result = Payment.refundPayment(parseInt(id), { reason });

  if (!result.success) {
    throw new ValidationError(result.error);
  }

  logger.info(`Payment refunded: ${result.transactionId}`);

  res.json({
    success: true,
    message: result.message,
    transactionId: result.transactionId,
  });
});

/**
 * @swagger
 * /payments/wallet:
 *   get:
 *     tags: [Payments]
 *     summary: Get wallet balance
 *     description: Get the current wallet balance for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet balance
 */
const getWalletBalance = asyncHandler(async (req, res) => {
  const wallet = Payment.getWalletBalance(req.user.id);

  res.json({
    success: true,
    wallet: {
      balance: wallet.balance || 0,
      currency: wallet.currency || "USD",
    },
  });
});

/**
 * @swagger
 * /payments/wallet/transactions:
 *   get:
 *     tags: [Payments]
 *     summary: Get wallet transactions
 *     description: Get transaction history for the authenticated user's wallet
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of wallet transactions
 */
const getWalletTransactions = asyncHandler(async (req, res) => {
  const { limit = 50, offset = 0 } = req.query;

  const transactions = Payment.getWalletTransactions(req.user.id, {
    limit: parseInt(limit),
    offset: parseInt(offset),
  });

  res.json({
    success: true,
    count: transactions.length,
    transactions,
  });
});

/**
 * @swagger
 * /payments/stats:
 *   get:
 *     tags: [Payments]
 *     summary: Get payment statistics
 *     description: Get payment statistics for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment statistics
 */
const getPaymentStats = asyncHandler(async (req, res) => {
  const stats = Payment.getUserPaymentStats(req.user.id);

  res.json({
    success: true,
    stats: {
      totalPaid: stats.total_paid || 0,
      totalReceived: stats.total_received || 0,
      paymentsMade: stats.payments_made || 0,
      paymentsReceived: stats.payments_received || 0,
      pendingPayments: stats.pending_payments || 0,
    },
  });
});

/**
 * @swagger
 * /payments/wallet/add-funds:
 *   post:
 *     tags: [Payments]
 *     summary: Add funds to wallet (Demo)
 *     description: Add demo funds to wallet for testing
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 10000
 *     responses:
 *       200:
 *         description: Funds added successfully
 */
const addFundsToWallet = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    throw new ValidationError("Amount must be greater than 0");
  }

  if (amount > 10000) {
    throw new ValidationError("Maximum amount is $10,000 per transaction (demo)");
  }

  const newBalance = Payment.updateWalletBalance(req.user.id, parseFloat(amount), "credit");

  logger.info(`Demo funds added: $${amount} to user ${req.user.id}`);

  res.json({
    success: true,
    message: `$${amount} added to wallet successfully (Demo)`,
    newBalance,
  });
});

module.exports = {
  createPayment,
  processPayment,
  getMyPayments,
  getPayment,
  getProjectPayments,
  refundPayment,
  getWalletBalance,
  getWalletTransactions,
  getPaymentStats,
  addFundsToWallet,
};
