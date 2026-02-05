-- EditFlow Database Schema
-- SQLite3 Migration Script
-- Version: 1.0.0
-- Description: Initial database schema for EditFlow freelance marketplace

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- =============================================================================
-- USERS TABLE
-- Stores user accounts (clients, editors, admins)
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('client', 'editor', 'admin')) DEFAULT 'client',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    CONSTRAINT email_unique UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- =============================================================================
-- JOBS TABLE
-- Stores job postings created by clients
-- =============================================================================
CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    duration_minutes INTEGER,
    budget_min REAL,
    budget_max REAL,
    status TEXT NOT NULL CHECK (status IN ('open', 'closed', 'in_progress')) DEFAULT 'open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_jobs_client_id ON jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);

-- =============================================================================
-- PROPOSALS TABLE
-- Stores editor proposals for jobs
-- =============================================================================
CREATE TABLE IF NOT EXISTS proposals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    editor_id INTEGER NOT NULL,
    cover_letter TEXT NOT NULL,
    proposed_price REAL NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (editor_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Unique constraint: one proposal per editor per job
    UNIQUE(job_id, editor_id)
);

CREATE INDEX IF NOT EXISTS idx_proposals_job_id ON proposals(job_id);
CREATE INDEX IF NOT EXISTS idx_proposals_editor_id ON proposals(editor_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);

-- =============================================================================
-- PROJECTS TABLE
-- Stores active projects (accepted proposals)
-- =============================================================================
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    proposal_id INTEGER NOT NULL,
    client_id INTEGER NOT NULL,
    editor_id INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    
    -- Foreign key constraints
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (editor_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_editor_id ON projects(editor_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- =============================================================================
-- PROJECT_FILES TABLE
-- Stores files uploaded for projects
-- =============================================================================
CREATE TABLE IF NOT EXISTS project_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    uploader_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_uploader_id ON project_files(uploader_id);

-- =============================================================================
-- TRIGGERS
-- Automatically update updated_at timestamp
-- =============================================================================

-- Users table trigger
CREATE TRIGGER IF NOT EXISTS users_updated_at 
AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Jobs table trigger
CREATE TRIGGER IF NOT EXISTS jobs_updated_at 
AFTER UPDATE ON jobs
BEGIN
    UPDATE jobs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Proposals table trigger
CREATE TRIGGER IF NOT EXISTS proposals_updated_at 
AFTER UPDATE ON proposals
BEGIN
    UPDATE proposals SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Projects table trigger
CREATE TRIGGER IF NOT EXISTS projects_updated_at 
AFTER UPDATE ON projects
BEGIN
    UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- =============================================================================
-- SAMPLE DATA (Optional - for development/testing)
-- Uncomment to insert sample data
-- =============================================================================

-- Sample Client User (password: Client123)
-- INSERT INTO users (name, email, password_hash, role) 
-- VALUES ('John Client', 'client@example.com', '$2b$12$hashed_password_here', 'client');

-- Sample Editor User (password: Editor123)
-- INSERT INTO users (name, email, password_hash, role) 
-- VALUES ('Jane Editor', 'editor@example.com', '$2b$12$hashed_password_here', 'editor');

-- =============================================================================
-- VIEWS
-- Useful views for common queries
-- =============================================================================

-- View: Active jobs with client details
CREATE VIEW IF NOT EXISTS v_active_jobs AS
SELECT 
    j.*,
    u.name as client_name,
    u.email as client_email,
    (SELECT COUNT(*) FROM proposals WHERE job_id = j.id) as proposal_count
FROM jobs j
JOIN users u ON j.client_id = u.id
WHERE j.status = 'open';

-- View: Projects with full details
CREATE VIEW IF NOT EXISTS v_project_details AS
SELECT 
    p.*,
    j.title as job_title,
    c.name as client_name,
    c.email as client_email,
    e.name as editor_name,
    e.email as editor_email,
    pr.proposed_price
FROM projects p
JOIN jobs j ON p.job_id = j.id
JOIN users c ON p.client_id = c.id
JOIN users e ON p.editor_id = e.id
JOIN proposals pr ON p.proposal_id = pr.id;

-- =============================================================================
-- DATABASE VERSION
-- Track schema version for migrations
-- =============================================================================
CREATE TABLE IF NOT EXISTS schema_version (
    version TEXT PRIMARY KEY,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

INSERT OR IGNORE INTO schema_version (version, description) 
VALUES ('1.0.0', 'Initial schema with users, jobs, proposals, projects, and files');

-- =============================================================================
-- PORTFOLIO ITEMS TABLE
-- Stores editor portfolio/showcase items
-- =============================================================================
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

CREATE INDEX IF NOT EXISTS idx_portfolio_editor_id ON portfolio_items(editor_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_category ON portfolio_items(category);

-- =============================================================================
-- WALLETS TABLE
-- Stores user wallet balances
-- =============================================================================
CREATE TABLE IF NOT EXISTS wallets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    balance REAL DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);

-- =============================================================================
-- WALLET TRANSACTIONS TABLE
-- Stores wallet transaction history
-- =============================================================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
    amount REAL NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet_id ON wallet_transactions(wallet_id);

-- =============================================================================
-- PAYMENTS TABLE
-- Stores payment transactions
-- =============================================================================
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

CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_project_id ON payments(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_payer_id ON payments(payer_id);
CREATE INDEX IF NOT EXISTS idx_payments_payee_id ON payments(payee_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Update schema version
INSERT OR REPLACE INTO schema_version (version, description) 
VALUES ('1.1.0', 'Added portfolio, wallet, and payment tables');

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
