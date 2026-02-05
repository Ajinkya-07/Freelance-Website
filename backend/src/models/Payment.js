const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

class Payment {
  /**
   * Create a new payment
   */
  static create({ projectId, payerId, payeeId, amount, currency = "USD", description }) {
    const transactionId = `PAY-${uuidv4().substring(0, 8).toUpperCase()}`;
    
    const stmt = db.prepare(`
      INSERT INTO payments (transaction_id, project_id, payer_id, payee_id, amount, currency, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `);
    const info = stmt.run(transactionId, projectId, payerId, payeeId, amount, currency, description);
    
    return { 
      id: info.lastInsertRowid, 
      transactionId,
      projectId, 
      payerId, 
      payeeId, 
      amount, 
      currency, 
      description,
      status: 'pending'
    };
  }

  /**
   * Find payment by ID
   */
  static findById(id) {
    const stmt = db.prepare(`
      SELECT p.*,
        payer.name as payer_name,
        payee.name as payee_name,
        proj.id as project_id
      FROM payments p
      JOIN users payer ON p.payer_id = payer.id
      JOIN users payee ON p.payee_id = payee.id
      LEFT JOIN projects proj ON p.project_id = proj.id
      WHERE p.id = ?
    `);
    return stmt.get(id);
  }

  /**
   * Find payment by transaction ID
   */
  static findByTransactionId(transactionId) {
    const stmt = db.prepare(`
      SELECT p.*,
        payer.name as payer_name,
        payee.name as payee_name
      FROM payments p
      JOIN users payer ON p.payer_id = payer.id
      JOIN users payee ON p.payee_id = payee.id
      WHERE p.transaction_id = ?
    `);
    return stmt.get(transactionId);
  }

  /**
   * Find payments by user (as payer or payee)
   */
  static findByUserId(userId, { role = 'all', status = null, limit = 50, offset = 0 } = {}) {
    let query = `
      SELECT p.*,
        payer.name as payer_name,
        payee.name as payee_name,
        j.title as job_title
      FROM payments p
      JOIN users payer ON p.payer_id = payer.id
      JOIN users payee ON p.payee_id = payee.id
      LEFT JOIN projects proj ON p.project_id = proj.id
      LEFT JOIN jobs j ON proj.job_id = j.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (role === 'payer') {
      query += ` AND p.payer_id = ?`;
      params.push(userId);
    } else if (role === 'payee') {
      query += ` AND p.payee_id = ?`;
      params.push(userId);
    } else {
      query += ` AND (p.payer_id = ? OR p.payee_id = ?)`;
      params.push(userId, userId);
    }
    
    if (status) {
      query += ` AND p.status = ?`;
      params.push(status);
    }
    
    query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const stmt = db.prepare(query);
    return stmt.all(...params);
  }

  /**
   * Find payments by project
   */
  static findByProjectId(projectId) {
    const stmt = db.prepare(`
      SELECT p.*,
        payer.name as payer_name,
        payee.name as payee_name
      FROM payments p
      JOIN users payer ON p.payer_id = payer.id
      JOIN users payee ON p.payee_id = payee.id
      WHERE p.project_id = ?
      ORDER BY p.created_at DESC
    `);
    return stmt.all(projectId);
  }

  /**
   * Process payment (Demo - simulates payment processing)
   */
  static processPayment(id, { paymentMethod = 'demo_card' } = {}) {
    // Simulate payment processing delay and success
    // In production, this would integrate with Stripe, PayPal, etc.
    
    const payment = this.findById(id);
    if (!payment) return null;
    
    if (payment.status !== 'pending') {
      return { success: false, error: 'Payment already processed' };
    }

    // Demo: 95% success rate simulation
    const isSuccessful = Math.random() < 0.95;
    
    const stmt = db.prepare(`
      UPDATE payments
      SET status = ?,
          payment_method = ?,
          processed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const newStatus = isSuccessful ? 'completed' : 'failed';
    stmt.run(newStatus, paymentMethod, id);

    // If successful, update wallet balance
    if (isSuccessful) {
      this.updateWalletBalance(payment.payee_id, payment.amount, 'credit');
      this.updateWalletBalance(payment.payer_id, payment.amount, 'debit');
    }

    return { 
      success: isSuccessful, 
      status: newStatus,
      transactionId: payment.transaction_id,
      message: isSuccessful ? 'Payment processed successfully' : 'Payment failed - please try again'
    };
  }

  /**
   * Update wallet balance
   */
  static updateWalletBalance(userId, amount, type) {
    // Check if wallet exists
    const walletStmt = db.prepare(`SELECT * FROM wallets WHERE user_id = ?`);
    let wallet = walletStmt.get(userId);
    
    if (!wallet) {
      // Create wallet
      const createStmt = db.prepare(`INSERT INTO wallets (user_id, balance) VALUES (?, 0)`);
      createStmt.run(userId);
      wallet = { user_id: userId, balance: 0 };
    }
    
    const newBalance = type === 'credit' 
      ? wallet.balance + amount 
      : wallet.balance - amount;
    
    const updateStmt = db.prepare(`
      UPDATE wallets SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?
    `);
    updateStmt.run(newBalance, userId);
    
    // Record transaction
    const txStmt = db.prepare(`
      INSERT INTO wallet_transactions (wallet_id, type, amount, description)
      VALUES ((SELECT id FROM wallets WHERE user_id = ?), ?, ?, ?)
    `);
    txStmt.run(userId, type, amount, type === 'credit' ? 'Payment received' : 'Payment sent');
    
    return newBalance;
  }

  /**
   * Get wallet balance
   */
  static getWalletBalance(userId) {
    const stmt = db.prepare(`
      SELECT w.*, u.name as user_name
      FROM wallets w
      JOIN users u ON w.user_id = u.id
      WHERE w.user_id = ?
    `);
    let wallet = stmt.get(userId);
    
    if (!wallet) {
      // Create wallet if doesn't exist
      const createStmt = db.prepare(`INSERT INTO wallets (user_id, balance) VALUES (?, 0)`);
      createStmt.run(userId);
      return { user_id: userId, balance: 0, currency: 'USD' };
    }
    
    return wallet;
  }

  /**
   * Get wallet transactions
   */
  static getWalletTransactions(userId, { limit = 50, offset = 0 } = {}) {
    const stmt = db.prepare(`
      SELECT wt.*
      FROM wallet_transactions wt
      JOIN wallets w ON wt.wallet_id = w.id
      WHERE w.user_id = ?
      ORDER BY wt.created_at DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(userId, limit, offset);
  }

  /**
   * Refund payment
   */
  static refundPayment(id, { reason = 'Customer requested refund' } = {}) {
    const payment = this.findById(id);
    if (!payment) return null;
    
    if (payment.status !== 'completed') {
      return { success: false, error: 'Only completed payments can be refunded' };
    }

    const stmt = db.prepare(`
      UPDATE payments
      SET status = 'refunded',
          refund_reason = ?,
          refunded_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(reason, id);

    // Reverse wallet balances
    this.updateWalletBalance(payment.payee_id, payment.amount, 'debit');
    this.updateWalletBalance(payment.payer_id, payment.amount, 'credit');

    return { 
      success: true, 
      message: 'Payment refunded successfully',
      transactionId: payment.transaction_id
    };
  }

  /**
   * Get payment statistics for a user
   */
  static getUserPaymentStats(userId) {
    const stmt = db.prepare(`
      SELECT 
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payer_id = ? AND status = 'completed') as total_paid,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payee_id = ? AND status = 'completed') as total_received,
        (SELECT COUNT(*) FROM payments WHERE payer_id = ? AND status = 'completed') as payments_made,
        (SELECT COUNT(*) FROM payments WHERE payee_id = ? AND status = 'completed') as payments_received,
        (SELECT COUNT(*) FROM payments WHERE (payer_id = ? OR payee_id = ?) AND status = 'pending') as pending_payments
    `);
    return stmt.get(userId, userId, userId, userId, userId, userId);
  }
}

module.exports = Payment;
