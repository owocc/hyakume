-- PostgreSQL Database Schema for Web App Store (Drizzle ORM)

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0 NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS apps (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT DEFAULT '',
  url TEXT NOT NULL,
  category TEXT NOT NULL,
  categories TEXT,
  developer TEXT NOT NULL,
  developer_id TEXT,
  icon_url TEXT NOT NULL,
  cover_url TEXT NOT NULL,
  primary_color TEXT,
  seo_image TEXT,
  screenshots TEXT,             -- JSON array of screenshot URLs
  preview_features TEXT,        -- JSON array of titles for the 3 search preview cards
  description TEXT NOT NULL,
  rating DOUBLE PRECISION DEFAULT 4.5 NOT NULL,
  rating_count TEXT DEFAULT '1000+' NOT NULL,
  ranking TEXT,
  age_rating TEXT DEFAULT '12+' NOT NULL,
  price TEXT DEFAULT '免费 · Web App' NOT NULL,
  size TEXT DEFAULT 'Web App' NOT NULL,
  compatibility TEXT DEFAULT '现代 Web 浏览器 / iOS / Android / macOS / Windows' NOT NULL,
  languages TEXT DEFAULT '简体中文和英语' NOT NULL,
  version TEXT DEFAULT '1.0.0' NOT NULL,
  version_date TEXT DEFAULT '近期更新' NOT NULL,
  release_notes TEXT DEFAULT '',
  privacy_linked TEXT,          -- JSON array of data types
  privacy_not_linked TEXT,      -- JSON array of data types
  events TEXT,                  -- JSON array of events
  related_topics TEXT,          -- JSON array of related editorial topics
  featured BOOLEAN DEFAULT FALSE NOT NULL,
  trending BOOLEAN DEFAULT FALSE NOT NULL,
  user_id TEXT DEFAULT 'system' NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  rating INTEGER DEFAULT 5 NOT NULL,
  date TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_apps_category ON apps(category);
CREATE INDEX IF NOT EXISTS idx_apps_featured ON apps(featured);
CREATE INDEX IF NOT EXISTS idx_apps_trending ON apps(trending);
CREATE INDEX IF NOT EXISTS idx_apps_user_id ON apps(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_app_id ON reviews(app_id);

CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  slug TEXT,
  title TEXT NOT NULL,
  summary TEXT DEFAULT '',
  tag TEXT DEFAULT '精选推荐' NOT NULL,
  content TEXT NOT NULL,
  cover_image TEXT DEFAULT '',
  github_url TEXT,
  x_url TEXT,
  source_url TEXT,
  links TEXT,
  author TEXT DEFAULT 'AppStore 精选编辑部' NOT NULL,
  read_time TEXT DEFAULT '3 分钟阅读' NOT NULL,
  views INTEGER DEFAULT 0 NOT NULL,
  likes INTEGER DEFAULT 0 NOT NULL,
  user_id TEXT DEFAULT 'system' NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_articles_app_id ON articles(app_id);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at);
CREATE INDEX IF NOT EXISTS idx_articles_user_id ON articles(user_id);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  url TEXT NOT NULL,
  domain TEXT,
  status TEXT DEFAULT 'processing' NOT NULL,
  step INTEGER DEFAULT 1 NOT NULL,
  step_name TEXT DEFAULT '页面渲染与快照截取' NOT NULL,
  progress INTEGER DEFAULT 20 NOT NULL,
  app_id TEXT,
  article_id TEXT,
  error TEXT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
