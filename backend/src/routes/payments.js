const express = require("express");
const router = express.Router();
const { authRequired } = require("../middleware/authMiddleware");
const {
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
} = require("../controllers/paymentController");

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment management (Demo Mode)
 */

// All payment routes require authentication
router.use(authRequired);

// Wallet routes
router.get("/wallet", getWalletBalance);
router.get("/wallet/transactions", getWalletTransactions);
router.post("/wallet/add-funds", addFundsToWallet);

// Payment routes
router.post("/create", createPayment);
router.post("/:id/process", processPayment);
router.post("/:id/refund", refundPayment);

// Get routes
router.get("/my", getMyPayments);
router.get("/stats", getPaymentStats);
router.get("/project/:projectId", getProjectPayments);
router.get("/:id", getPayment);

module.exports = router;
