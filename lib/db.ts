import type { AppItem, ReviewItem } from "./types";
import type { D1Database } from "@cloudflare/workers-types";
import { getCloudflareEnv } from "./cf-env";
import fs from "node:fs";
import path from "node:path";

export const FIXED_CATEGORIES: string[] = ["工具", "WEB", "AI"];

interface SqliteDatabase {
  exec(sql: string): void;
  prepare(sql: string): {
    run(...args: unknown[]): unknown;
    get(...args: unknown[]): unknown;
    all(...args: unknown[]): unknown[];
  };
}

let localDbInstance: SqliteDatabase | null = null;

function getLocalDatabase(): SqliteDatabase {
  if (localDbInstance) return localDbInstance;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { DatabaseSync } = require("node:sqlite") as {
      DatabaseSync: new (path: string) => SqliteDatabase;
    };
    const dataDir = path.join(process.cwd(), ".data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const dbPath = path.join(dataDir, "appstore.sqlite");
    const db = new DatabaseSync(dbPath);
    initSqliteTables(db);
    localDbInstance = db;
    return db;
  } catch (err) {
    console.error("Failed to initialize node:sqlite file, falling back to memory:", err);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { DatabaseSync } = require("node:sqlite") as {
      DatabaseSync: new (path: string) => SqliteDatabase;
    };
    const db = new DatabaseSync(":memory:");
    initSqliteTables(db);
    localDbInstance = db;
    return db;
  }
}

function initSqliteTables(db: SqliteDatabase): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS apps (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      tagline TEXT,
      url TEXT NOT NULL,
      category TEXT NOT NULL,
      categories TEXT,
      developer TEXT NOT NULL,
      developer_id TEXT,
      icon_url TEXT NOT NULL,
      cover_url TEXT NOT NULL,
      seo_image TEXT,
      screenshots TEXT,
      preview_features TEXT,
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
      privacy_linked TEXT,
      privacy_not_linked TEXT,
      events TEXT,
      related_topics TEXT,
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
      created_at INTEGER NOT NULL
    );
  `);

  try {
    db.exec("ALTER TABLE apps ADD COLUMN categories TEXT;");
  } catch {
    // column already exists
  }
}

async function ensureD1Initialized(db: D1Database): Promise<void> {
  try {
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS apps (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          tagline TEXT,
          url TEXT NOT NULL,
          category TEXT NOT NULL,
          categories TEXT,
          developer TEXT NOT NULL,
          developer_id TEXT,
          icon_url TEXT NOT NULL,
          cover_url TEXT NOT NULL,
          seo_image TEXT,
          screenshots TEXT,
          preview_features TEXT,
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
          privacy_linked TEXT,
          privacy_not_linked TEXT,
          events TEXT,
          related_topics TEXT,
          featured INTEGER DEFAULT 0,
          trending INTEGER DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )`
      )
      .run();

    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS reviews (
          id TEXT PRIMARY KEY,
          app_id TEXT NOT NULL,
          title TEXT NOT NULL,
          author TEXT NOT NULL,
          rating INTEGER DEFAULT 5,
          date TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at INTEGER NOT NULL
        )`
      )
      .run();

    try {
      await db.prepare("ALTER TABLE apps ADD COLUMN categories TEXT").run();
    } catch {
      // column already exists
    }
  } catch (err) {
    console.error("Error initializing D1 tables:", err);
  }
}

function parseJsonArray<T>(str: unknown, fallback: T[]): T[] {
  if (!str) return fallback;
  if (Array.isArray(str)) return str as T[];
  if (typeof str !== "string") return fallback;
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function rowToApp(row: Record<string, unknown>): AppItem {
  const rawCategories = parseJsonArray<string>(row.categories, []);
  const primaryCat = String(row.category || "WEB");
  const categories =
    rawCategories.length > 0 ? rawCategories : [primaryCat];

  return {
    id: String(row.id || ""),
    name: String(row.name || ""),
    tagline: String(row.tagline || ""),
    url: String(row.url || ""),
    category: categories[0] || primaryCat,
    categories,
    developer: String(row.developer || ""),
    developer_id: String(row.developer_id || ""),
    icon_url: String(row.icon_url || ""),
    cover_url: String(row.cover_url || ""),
    seo_image: row.seo_image ? String(row.seo_image) : undefined,
    screenshots: parseJsonArray<string>(row.screenshots, []),
    preview_features: parseJsonArray<string>(row.preview_features, []),
    description: String(row.description || ""),
    rating: Number(row.rating) || 4.5,
    rating_count: String(row.rating_count || "1000+"),
    ranking: row.ranking ? String(row.ranking) : undefined,
    age_rating: String(row.age_rating || "12+"),
    price: String(row.price || "免费 · Web App"),
    size: String(row.size || "Web App"),
    compatibility: String(row.compatibility || "现代浏览器"),
    languages: String(row.languages || "简体中文和英语"),
    version: String(row.version || "1.0.0"),
    version_date: String(row.version_date || "近期更新"),
    release_notes: String(row.release_notes || ""),
    privacy_linked: parseJsonArray<string>(row.privacy_linked, []),
    privacy_not_linked: parseJsonArray<string>(row.privacy_not_linked, []),
    events: parseJsonArray<{ badge: string; tag: string; title: string; desc: string; image: string }>(
      row.events,
      []
    ),
    related_topics: parseJsonArray<{ tag: string; title: string; desc: string; image: string }>(
      row.related_topics,
      []
    ),
    featured: Boolean(row.featured),
    trending: Boolean(row.trending),
    created_at: Number(row.created_at) || Date.now(),
    updated_at: Number(row.updated_at) || Date.now(),
  };
}

/**
 * Fixed categories: Only 工具, WEB, AI
 */
export async function getCategories(): Promise<Array<{ id: string; name: string }>> {
  return FIXED_CATEGORIES.map((cat: string) => ({
    id: cat,
    name: cat,
  }));
}

export async function getAllApps(options?: {
  category?: string;
  featured?: boolean;
  trending?: boolean;
  limit?: number;
}): Promise<AppItem[]> {
  const env = await getCloudflareEnv();

  if (env && env.DB) {
    await ensureD1Initialized(env.DB);
    let query = "SELECT * FROM apps WHERE 1=1";
    const params: (string | number)[] = [];

    if (
      options?.category &&
      options.category !== "类别" &&
      options.category !== "all" &&
      options.category !== "全部"
    ) {
      query += " AND (category = ? OR categories LIKE ?)";
      params.push(options.category, `%"${options.category}"%`);
    }
    if (options?.featured !== undefined) {
      query += " AND featured = ?";
      params.push(options.featured ? 1 : 0);
    }
    if (options?.trending !== undefined) {
      query += " AND trending = ?";
      params.push(options.trending ? 1 : 0);
    }
    query += " ORDER BY created_at DESC";
    if (options?.limit) {
      query += " LIMIT ?";
      params.push(options.limit);
    }

    const stmt = env.DB.prepare(query);
    const result = await stmt.bind(...params).all<Record<string, unknown>>();
    return (result.results || []).map(rowToApp);
  }

  const db = getLocalDatabase();
  let query = "SELECT * FROM apps WHERE 1=1";
  const params: (string | number)[] = [];

  if (
    options?.category &&
    options.category !== "类别" &&
    options.category !== "all" &&
    options.category !== "全部"
  ) {
    query += " AND (category = ? OR categories LIKE ?)";
    params.push(options.category, `%"${options.category}"%`);
  }
  if (options?.featured !== undefined) {
    query += " AND featured = ?";
    params.push(options.featured ? 1 : 0);
  }
  if (options?.trending !== undefined) {
    query += " AND trending = ?";
    params.push(options.trending ? 1 : 0);
  }
  query += " ORDER BY created_at DESC";
  if (options?.limit) {
    query += " LIMIT ?";
    params.push(options.limit);
  }

  const stmt = db.prepare(query);
  const rows = stmt.all(...params) as Record<string, unknown>[];
  return rows.map(rowToApp);
}

export async function getAppById(id: string): Promise<AppItem | null> {
  const env = await getCloudflareEnv();

  if (env && env.DB) {
    await ensureD1Initialized(env.DB);
    const row = await env.DB.prepare("SELECT * FROM apps WHERE id = ?").bind(id).first<Record<string, unknown>>();
    return row ? rowToApp(row) : null;
  }

  const db = getLocalDatabase();
  const row = db.prepare("SELECT * FROM apps WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  return row ? rowToApp(row) : null;
}

export async function searchApps(query: string): Promise<AppItem[]> {
  const trimmed = (query || "").trim().toLowerCase();
  if (!trimmed) return getAllApps();

  const env = await getCloudflareEnv();
  const pattern = `%${trimmed}%`;

  if (env && env.DB) {
    await ensureD1Initialized(env.DB);
    const res = await env.DB.prepare(`
      SELECT * FROM apps
      WHERE LOWER(name) LIKE ? OR LOWER(tagline) LIKE ? OR LOWER(description) LIKE ? OR LOWER(category) LIKE ? OR LOWER(categories) LIKE ?
      ORDER BY rating DESC, created_at DESC
    `).bind(pattern, pattern, pattern, pattern, pattern).all<Record<string, unknown>>();
    return (res.results || []).map(rowToApp);
  }

  const db = getLocalDatabase();
  const rows = db.prepare(`
    SELECT * FROM apps
    WHERE LOWER(name) LIKE ? OR LOWER(tagline) LIKE ? OR LOWER(description) LIKE ? OR LOWER(category) LIKE ? OR LOWER(categories) LIKE ?
    ORDER BY rating DESC, created_at DESC
  `).all(pattern, pattern, pattern, pattern, pattern) as Record<string, unknown>[];
  return rows.map(rowToApp);
}

export async function insertApp(app: AppItem): Promise<AppItem> {
  const env = await getCloudflareEnv();

  // Normalize categories: an app can belong to multiple categories: ["工具", "WEB", "AI"]
  const categories =
    Array.isArray(app.categories) && app.categories.length > 0
      ? app.categories
      : [app.category || "WEB"];

  const primaryCategory = categories[0] || "WEB";
  app.category = primaryCategory;
  app.categories = categories;

  const values: (string | number)[] = [
    app.id,
    app.name,
    app.tagline || "",
    app.url,
    primaryCategory,
    JSON.stringify(categories),
    app.developer,
    app.developer_id || "",
    app.icon_url,
    app.cover_url,
    app.seo_image || "",
    JSON.stringify(app.screenshots || []),
    JSON.stringify(app.preview_features || []),
    app.description,
    app.rating || 4.8,
    app.rating_count || "100+",
    app.ranking || "",
    app.age_rating || "12+",
    app.price || "免费 · Web App",
    app.size || "Web App",
    app.compatibility || "全平台现代浏览器",
    app.languages || "简体中文和英语",
    app.version || "1.0.0",
    app.version_date || "刚刚",
    app.release_notes || "初始版本发布",
    JSON.stringify(app.privacy_linked || []),
    JSON.stringify(app.privacy_not_linked || []),
    JSON.stringify(app.events || []),
    JSON.stringify(app.related_topics || []),
    app.featured ? 1 : 0,
    app.trending ? 1 : 0,
    app.created_at || Date.now(),
    app.updated_at || Date.now(),
  ];

  if (env && env.DB) {
    await ensureD1Initialized(env.DB);
    await env.DB.prepare(`
      INSERT OR REPLACE INTO apps (
        id, name, tagline, url, category, categories, developer, developer_id,
        icon_url, cover_url, seo_image, screenshots, preview_features,
        description, rating, rating_count, ranking, age_rating,
        price, size, compatibility, languages, version, version_date,
        release_notes, privacy_linked, privacy_not_linked, events, related_topics,
        featured, trending, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?
      )
    `).bind(...values).run();
    return app;
  }

  const db = getLocalDatabase();
  db.prepare(`
    INSERT OR REPLACE INTO apps (
      id, name, tagline, url, category, categories, developer, developer_id,
      icon_url, cover_url, seo_image, screenshots, preview_features,
      description, rating, rating_count, ranking, age_rating,
      price, size, compatibility, languages, version, version_date,
      release_notes, privacy_linked, privacy_not_linked, events, related_topics,
      featured, trending, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?
    )
  `).run(...values);

  return app;
}

export async function getReviews(appId: string): Promise<ReviewItem[]> {
  const env = await getCloudflareEnv();

  if (env && env.DB) {
    await ensureD1Initialized(env.DB);
    const res = await env.DB.prepare("SELECT * FROM reviews WHERE app_id = ? ORDER BY created_at DESC").bind(appId).all<ReviewItem>();
    return res.results || [];
  }

  const db = getLocalDatabase();
  return db.prepare("SELECT * FROM reviews WHERE app_id = ? ORDER BY created_at DESC").all(appId) as unknown as ReviewItem[];
}

export async function insertReview(review: ReviewItem): Promise<ReviewItem> {
  const env = await getCloudflareEnv();

  if (env && env.DB) {
    await ensureD1Initialized(env.DB);
    await env.DB.prepare(`
      INSERT INTO reviews (id, app_id, title, author, rating, date, content, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      review.id,
      review.app_id,
      review.title,
      review.author,
      review.rating,
      review.date,
      review.content,
      review.created_at
    ).run();
    return review;
  }

  const db = getLocalDatabase();
  db.prepare(`
    INSERT INTO reviews (id, app_id, title, author, rating, date, content, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    review.id,
    review.app_id,
    review.title,
    review.author,
    review.rating,
    review.date,
    review.content,
    review.created_at
  );

  return review;
}
