-- Cloudflare D1 Database Schema for Web App Store

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS apps (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT,
  url TEXT NOT NULL,
  category TEXT NOT NULL,
  developer TEXT NOT NULL,
  developer_id TEXT,
  icon_url TEXT NOT NULL,
  cover_url TEXT NOT NULL,
  primary_color TEXT,
  seo_image TEXT,
  screenshots TEXT,             -- JSON array of screenshot URLs
  preview_features TEXT,        -- JSON array of titles for the 3 search preview cards
  description TEXT NOT NULL,
  rating REAL DEFAULT 4.5,
  rating_count TEXT DEFAULT '1000+',
  ranking TEXT,
  age_rating TEXT DEFAULT '12+',
  price TEXT DEFAULT '免费 · Web App',
  size TEXT DEFAULT 'Web App',
  compatibility TEXT DEFAULT '现代 Web 浏览器 / iOS / Android / macOS / Windows',
  languages TEXT DEFAULT '简体中文和英语',
  version TEXT DEFAULT '1.0.0',
  version_date TEXT DEFAULT '近期更新',
  release_notes TEXT,
  privacy_linked TEXT,          -- JSON array of data types
  privacy_not_linked TEXT,      -- JSON array of data types
  events TEXT,                  -- JSON array of events
  related_topics TEXT,          -- JSON array of related editorial topics
  featured INTEGER DEFAULT 0,
  trending INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  rating INTEGER DEFAULT 5,
  date TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_apps_category ON apps(category);
CREATE INDEX IF NOT EXISTS idx_apps_featured ON apps(featured);
CREATE INDEX IF NOT EXISTS idx_apps_trending ON apps(trending);
CREATE INDEX IF NOT EXISTS idx_reviews_app_id ON reviews(app_id);
