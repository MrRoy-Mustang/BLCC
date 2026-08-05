-- BLCC V2 Database Schema (SQLite)
-- Run this to initialize the database

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    reference TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    pass_type TEXT NOT NULL DEFAULT 'STANDARD' CHECK(pass_type IN ('STANDARD', 'REGULAR_VIP', 'CARRE_BRONZE', 'CARRE_OR', 'CARRE_DIAMANT')),
    amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'PAID', 'FAILED', 'EXPIRED')),
    notchpay_trxref TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    ticket_code TEXT UNIQUE NOT NULL,
    transaction_id TEXT UNIQUE NOT NULL,
    qr_hash TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'ISSUED' CHECK(status IN ('ISSUED', 'USED', 'REVOKED')),
    scanned_at INTEGER,
    scanned_by TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    tier TEXT NOT NULL DEFAULT 'STANDARD' CHECK(tier IN ('STANDARD', 'REGULAR_VIP', 'CARRE_BRONZE', 'CARRE_OR', 'CARRE_DIAMANT')),
    price_fcfa INTEGER NOT NULL DEFAULT 0,
    package_details TEXT,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE RESTRICT
);

-- Create bouncers table
CREATE TABLE IF NOT EXISTS bouncers (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    access_pin TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_customer_phone ON transactions(customer_phone);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
