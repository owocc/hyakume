import type { AppItem, ReviewItem, CategoryItem } from "./types";
import type { D1Database } from "@cloudflare/workers-types";
import { getCloudflareEnv } from "./cf-env";
import fs from "node:fs";
import path from "node:path";

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: "apps", name: "App", icon: "AppWindow", sort_order: 1 },
  { id: "games", name: "游戏", icon: "Gamepad2", sort_order: 2 },
  { id: "web", name: "WEB", icon: "Globe", sort_order: 3 },
  { id: "tools", name: "工具", icon: "Wrench", sort_order: 4 },
  { id: "ai", name: "AI", icon: "Sparkles", sort_order: 5 },
];

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
export function extractDomain(inputUrl: string): { hostname: string; cleanDomain: string } {
  let url = (inputUrl || "").trim();
  if (!url) return { hostname: "", cleanDomain: "" };
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const cleanDomain = hostname.replace(/^www\./, "");
    return { hostname, cleanDomain };
  } catch {
    const raw = (inputUrl || "").trim().toLowerCase();
    const noProto = raw.replace(/^https?:\/\//, "");
    const hostOnly = noProto.split("/")[0].split("?")[0].split(":")[0];
    return { hostname: hostOnly, cleanDomain: hostOnly.replace(/^www\./, "") };
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
      primary_color TEXT,
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

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    );
  `);

  try {
    db.exec("ALTER TABLE apps ADD COLUMN categories TEXT;");
  } catch {
    // column already exists
  }
  try {
    db.exec("ALTER TABLE apps ADD COLUMN primary_color TEXT;");
  } catch {
    // column already exists
  }
  try {
    for (const cat of DEFAULT_CATEGORIES) {
      db.prepare(
        `INSERT OR IGNORE INTO categories (id, name, icon, sort_order, created_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run(cat.id, cat.name, cat.icon || "", cat.sort_order || 0, Date.now());
    }
  } catch {
    // ignore
  }
  try {
    const rows = db.prepare("SELECT id, url FROM apps").all() as Array<{ id: string; url: string }>;
    const seen = new Set<string>();
    for (const r of rows) {
      const targetId = extractDomain(r.url).hostname;
      if (!targetId) continue;
      if (seen.has(targetId) || (r.id !== targetId && seen.has(r.id))) {
        db.prepare("DELETE FROM apps WHERE id = ?").run(r.id);
      } else {
        seen.add(targetId);
        if (r.id !== targetId) {
          db.prepare("UPDATE apps SET id = ? WHERE id = ?").run(targetId, r.id);
        }
      }
    }
  } catch {
    // ignore
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
          primary_color TEXT,
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

    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          icon TEXT,
          sort_order INTEGER DEFAULT 0,
          created_at INTEGER NOT NULL
        )`
      )
      .run();

    for (const cat of DEFAULT_CATEGORIES) {
      await db
        .prepare(
          `INSERT OR IGNORE INTO categories (id, name, icon, sort_order, created_at)
           VALUES (?, ?, ?, ?, ?)`
        )
        .bind(cat.id, cat.name, cat.icon || "", cat.sort_order || 0, Date.now())
        .run();
    }
    try {
      await db.prepare("ALTER TABLE apps ADD COLUMN categories TEXT").run();
    } catch {
      // column already exists
    }
    try {
      await db.prepare("ALTER TABLE apps ADD COLUMN primary_color TEXT").run();
    } catch {
      // column already exists
    }
    try {
      const rows = await db.prepare("SELECT id, url FROM apps").all<{ id: string; url: string }>();
      if (rows.results) {
        const seen = new Set<string>();
        for (const r of rows.results) {
          const targetId = extractDomain(r.url).hostname;
          if (!targetId) continue;
          if (seen.has(targetId) || (r.id !== targetId && seen.has(r.id))) {
            await db.prepare("DELETE FROM apps WHERE id = ?").bind(r.id).run();
          } else {
            seen.add(targetId);
            if (r.id !== targetId) {
              await db.prepare("UPDATE apps SET id = ? WHERE id = ?").bind(targetId, r.id).run();
            }
          }
        }
      }
    } catch {
      // ignore
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
    primary_color: row.primary_color ? String(row.primary_color) : undefined,
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

export function getCategoryTerms(cat: string): string[] {
  const clean = (cat || "").trim().toLowerCase();
  if (clean === "web") return ["WEB", "web"];
  if (clean === "games" || clean === "游戏") return ["游戏", "games"];
  if (clean === "tools" || clean === "工具") return ["工具", "tools"];
  if (clean === "ai") return ["AI", "ai"];
  if (clean === "apps" || clean === "app") return ["App", "apps"];
  return [cat];
}

export async function getCategories(): Promise<CategoryItem[]> {
  const env = await getCloudflareEnv();
  if (env && env.DB) {
    await ensureD1Initialized(env.DB);
    try {
      const res = await env.DB.prepare(
        "SELECT * FROM categories ORDER BY sort_order ASC, created_at ASC"
      ).all<CategoryItem>();
      if (res.results && res.results.length > 0) return res.results;
    } catch {
      // fallback
    }
  }

  try {
    const db = getLocalDatabase();
    const rows = db
      .prepare("SELECT * FROM categories ORDER BY sort_order ASC, created_at ASC")
      .all() as unknown as CategoryItem[];
    if (rows && rows.length > 0) return rows;
  } catch {
    // fallback
  }

  return DEFAULT_CATEGORIES;
}

export async function getCategoryById(idOrName: string): Promise<CategoryItem | null> {
  const clean = decodeURIComponent(idOrName || "").trim().toLowerCase();
  if (!clean) return null;

  const categories = await getCategories();
  const found = categories.find(
    (c) =>
      c.id.toLowerCase() === clean ||
      c.name.toLowerCase() === clean ||
      (clean === "all" && (c.id === "apps" || c.name === "App"))
  );
  if (found) return found;

  return (
    DEFAULT_CATEGORIES.find(
      (c) => c.id.toLowerCase() === clean || c.name.toLowerCase() === clean
    ) || null
  );
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
      const terms = getCategoryTerms(options.category);
      const conditions = terms.map(() => "(category = ? OR categories LIKE ?)").join(" OR ");
      query += ` AND (${conditions})`;
      for (const t of terms) {
        params.push(t, `%"${t}"%`);
      }
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
    const terms = getCategoryTerms(options.category);
    const conditions = terms.map(() => "(category = ? OR categories LIKE ?)").join(" OR ");
    query += ` AND (${conditions})`;
    for (const t of terms) {
      params.push(t, `%"${t}"%`);
    }
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
  const rawId = (id || "").trim();
  const decodedId = decodeURIComponent(rawId).toLowerCase();

  if (env && env.DB) {
    await ensureD1Initialized(env.DB);
    const row = await env.DB.prepare("SELECT * FROM apps WHERE id = ? OR id = ?").bind(rawId, decodedId).first<Record<string, unknown>>();
    if (row) return rowToApp(row);

    const byDomain = await getAppByDomain(decodedId);
    if (byDomain) return byDomain;

    return null;
  }

  const db = getLocalDatabase();
  const row = db.prepare("SELECT * FROM apps WHERE id = ? OR id = ?").get(rawId, decodedId) as Record<string, unknown> | undefined;
  if (row) return rowToApp(row);

  const byDomain = await getAppByDomain(decodedId);
  if (byDomain) return byDomain;

  return null;
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

/**
 * Find an existing app by its domain/hostname.
 * Subdomains like docs.google.com and www.google.com are treated as separate domains.
 * www.google.com and google.com match each other.
 */
export async function getAppByDomain(targetUrl: string): Promise<AppItem | null> {
  const { hostname, cleanDomain } = extractDomain(targetUrl);
  if (!hostname && !cleanDomain) return null;

  const env = await getCloudflareEnv();
  const pattern1 = `%${cleanDomain}%`;
  const pattern2 = `%${hostname}%`;

  if (env && env.DB) {
    await ensureD1Initialized(env.DB);
    const res = await env.DB.prepare(`
      SELECT * FROM apps
      WHERE developer_id = ? OR developer_id = ? OR url LIKE ? OR url LIKE ?
      ORDER BY updated_at DESC, created_at DESC
    `).bind(cleanDomain, hostname, pattern1, pattern2).all<Record<string, unknown>>();

    const candidates = (res.results || []).map(rowToApp);
    for (const app of candidates) {
      const appDomain = extractDomain(app.url);
      if (
        appDomain.cleanDomain === cleanDomain ||
        appDomain.hostname === hostname ||
        (app.developer_id && (app.developer_id === cleanDomain || app.developer_id === hostname))
      ) {
        return app;
      }
    }
    return null;
  }

  const db = getLocalDatabase();
  const rows = db.prepare(`
    SELECT * FROM apps
    WHERE developer_id = ? OR developer_id = ? OR url LIKE ? OR url LIKE ?
    ORDER BY updated_at DESC, created_at DESC
  `).all(cleanDomain, hostname, pattern1, pattern2) as Record<string, unknown>[];

  const candidates = rows.map(rowToApp);
  for (const app of candidates) {
    const appDomain = extractDomain(app.url);
    if (
      appDomain.cleanDomain === cleanDomain ||
      appDomain.hostname === hostname ||
      (app.developer_id && (app.developer_id === cleanDomain || app.developer_id === hostname))
    ) {
      return app;
    }
  }

  return null;
}

export async function deleteApp(id: string): Promise<boolean> {
  const env = await getCloudflareEnv();
  if (env && env.DB) {
    await ensureD1Initialized(env.DB);
    await env.DB.prepare("DELETE FROM apps WHERE id = ?").bind(id).run();
    return true;
  }
  const db = getLocalDatabase();
  db.prepare("DELETE FROM apps WHERE id = ?").run(id);
  return true;
}

export async function insertApp(app: AppItem): Promise<AppItem> {
  const env = await getCloudflareEnv();

  // Deduplicate by domain: if an app with the same domain exists, reuse its ID to prevent duplicate rows
  const existingApp = await getAppByDomain(app.url);
  if (existingApp && existingApp.id !== app.id) {
    app.id = existingApp.id;
    app.created_at = existingApp.created_at || app.created_at;
  }

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
    app.primary_color || "",
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
        icon_url, cover_url, primary_color, seo_image, screenshots, preview_features,
        description, rating, rating_count, ranking, age_rating,
        price, size, compatibility, languages, version, version_date,
        release_notes, privacy_linked, privacy_not_linked, events, related_topics,
        featured, trending, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?
      )
    `).bind(...values).run();
    return app;
  }

  const db = getLocalDatabase();
  db.prepare(`
    INSERT OR REPLACE INTO apps (
      id, name, tagline, url, category, categories, developer, developer_id,
      icon_url, cover_url, primary_color, seo_image, screenshots, preview_features,
      description, rating, rating_count, ranking, age_rating,
      price, size, compatibility, languages, version, version_date,
      release_notes, privacy_linked, privacy_not_linked, events, related_topics,
      featured, trending, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?
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
