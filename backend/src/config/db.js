// src/config/db.js
const Database = require("better-sqlite3");
const path = require("path");

// DB file will be created in project root as editconnect.db
const dbPath = path.join(__dirname, "../../editconnect.db");

const db = new Database(dbPath);

// Run basic migrations (create tables if they don't exist)
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('client', 'editor', 'admin')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS jobs(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    duration_minutes INTEGER,
    budget_min INTEGER,
    budget_max INTEGER,
    status TEXT DEFAULT 'open',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS proposals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL,
  editor_id INTEGER NOT NULL,
  price INTEGER,
  estimated_days INTEGER,
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id),
  FOREIGN KEY (editor_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS projects(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    client_id INTEGER NOT NULL,
    editor_id INTEGER NOT NULL,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'under_review', 'revision_requested', 'completed', 'cancelled', 'on_hold')),
    escrow_amount INTEGER DEFAULT 0,
    revision_count INTEGER DEFAULT 0,
    revision_notes TEXT,
    hold_reason TEXT,
    cancellation_reason TEXT,
    completed_at DATETIME,
    cancelled_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id),
    FOREIGN KEY (client_id) REFERENCES users(id),
    FOREIGN KEY (editor_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS project_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    uploaded_by INTEGER NOT NULL,
    file_type TEXT CHECK (file_type IN ('draft', 'final')) NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
  );

  -- Portfolio items table for editor showcase
  CREATE TABLE IF NOT EXISTS portfolio_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    editor_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT,
    thumbnail_url TEXT,
    video_url TEXT,
    tags TEXT DEFAULT '[]',
    views INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (editor_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Wallets table for user balances
  CREATE TABLE IF NOT EXISTS wallets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    balance REAL DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Wallet transactions table
  CREATE TABLE IF NOT EXISTS wallet_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
    amount REAL NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
  );

  -- Payments table for transactions
  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id TEXT NOT NULL UNIQUE,
    project_id INTEGER,
    payer_id INTEGER NOT NULL,
    payee_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    description TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
    payment_method TEXT,
    processed_at DATETIME,
    refund_reason TEXT,
    refunded_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (payer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (payee_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Reviews table for user ratings
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    reviewer_id INTEGER NOT NULL,
    reviewee_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT,
    category TEXT DEFAULT 'general' CHECK (category IN ('general', 'communication', 'quality', 'timeliness', 'professionalism')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Milestones table for project tracking
  CREATE TABLE IF NOT EXISTS milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    due_date DATE,
    display_order INTEGER DEFAULT 0,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  -- Project activities table for activity logging
  CREATE TABLE IF NOT EXISTS project_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN (
      'project_created', 'status_changed', 'milestone_added', 'milestone_completed',
      'file_uploaded', 'file_approved', 'message_sent', 'payment_made',
      'review_submitted', 'project_completed', 'project_cancelled'
    )),
    description TEXT NOT NULL,
    metadata TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Create index for faster activity queries
  CREATE INDEX IF NOT EXISTS idx_project_activities_project_id ON project_activities(project_id);
  CREATE INDEX IF NOT EXISTS idx_project_activities_created_at ON project_activities(created_at);
  
`);

// Run migrations to add missing columns to existing tables
const migrations = [
  { table: 'projects', column: 'revision_count', sql: "ALTER TABLE projects ADD COLUMN revision_count INTEGER DEFAULT 0" },
  { table: 'projects', column: 'revision_notes', sql: "ALTER TABLE projects ADD COLUMN revision_notes TEXT" },
  { table: 'projects', column: 'hold_reason', sql: "ALTER TABLE projects ADD COLUMN hold_reason TEXT" },
  { table: 'projects', column: 'cancellation_reason', sql: "ALTER TABLE projects ADD COLUMN cancellation_reason TEXT" },
  { table: 'projects', column: 'completed_at', sql: "ALTER TABLE projects ADD COLUMN completed_at DATETIME" },
  { table: 'projects', column: 'cancelled_at', sql: "ALTER TABLE projects ADD COLUMN cancelled_at DATETIME" },
  { table: 'projects', column: 'updated_at', sql: "ALTER TABLE projects ADD COLUMN updated_at DATETIME" },
];

migrations.forEach(({ table, column, sql }) => {
  try {
    // Check if column exists
    const tableInfo = db.prepare(`PRAGMA table_info(${table})`).all();
    const columnExists = tableInfo.some(col => col.name === column);
    
    if (!columnExists) {
      db.exec(sql);
      console.log(`Migration: Added column ${column} to ${table}`);
    }
  } catch (err) {
    // Column might already exist or other error - ignore
    console.log(`Migration note: ${column} - ${err.message}`);
  }
});

module.exports = db;
