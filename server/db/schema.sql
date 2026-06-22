-- Create Database
CREATE DATABASE IF NOT EXISTS givehope_db;
USE givehope_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('donor', 'admin') DEFAULT 'donor',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  goal_amount DECIMAL(10, 2) NOT NULL,
  raised_amount DECIMAL(10, 2) DEFAULT 0.00,
  image_url VARCHAR(1000) DEFAULT '',
  status ENUM('active', 'completed', 'paused') DEFAULT 'active',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Donations Table
CREATE TABLE IF NOT EXISTS donations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  campaign_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  message TEXT,
  payment_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  stripe_payment_id VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

-- 4. Receipts Table
CREATE TABLE IF NOT EXISTS receipts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  donation_id INT NOT NULL,
  email_sent_at TIMESTAMP NULL DEFAULT NULL,
  receipt_number VARCHAR(100) UNIQUE NOT NULL,
  FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE
);

-- 5. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  user_email VARCHAR(255) NULL,
  action_category VARCHAR(100) NOT NULL,
  action_details TEXT NOT NULL,
  ip_address VARCHAR(45) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_donations_campaign_id ON donations(campaign_id);
CREATE INDEX idx_donations_user_id ON donations(user_id);
CREATE INDEX idx_audit_logs_category ON audit_logs(action_category);

-- 6. Success Stories Table
CREATE TABLE IF NOT EXISTS success_stories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  image_url VARCHAR(1000) DEFAULT '',
  video_url VARCHAR(1000) DEFAULT '',
  likes_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Comments Table
CREATE TABLE IF NOT EXISTS comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  story_id INT NOT NULL,
  user_id INT NULL, -- NULL if posted by guest
  guest_name VARCHAR(100) NULL, -- NULL if posted by authenticated user
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (story_id) REFERENCES success_stories(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_comments_story_id ON comments(story_id);
