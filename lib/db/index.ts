import "dotenv/config";
import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle as drizzleNeon, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { eq, or, and, ilike, desc, asc, type SQL } from "drizzle-orm";
import pg from "pg";
import type { AppItem, ReviewItem, CategoryItem } from "../types";
import * as schema from "./schema";
import { appsTable, reviewsTable, categoriesTable } from "./schema";

const { Pool } = pg;

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: "apps", name: "App", icon: "AppWindow", sort_order: 1 },
  { id: "games", name: "游戏", icon: "Gamepad2", sort_order: 2 },
  { id: "web", name: "WEB", icon: "Globe", sort_order: 3 },
  { id: "tools", name: "工具", icon: "Wrench", sort_order: 4 },
  { id: "ai", name: "AI", icon: "Sparkles", sort_order: 5 },
];

export const FIXED_CATEGORIES: string[] = ["工具", "WEB", "AI"];

export type DrizzleDatabase = NeonHttpDatabase<typeof schema> | NodePgDatabase<typeof schema>;

let poolInstance: pg.Pool | null = null;
let neonSqlInstance: NeonQueryFunction<false, false> | null = null;
let dbInstance: DrizzleDatabase | null = null;
let initializationPromise: Promise<void> | null = null;

function isNeonDatabase(url: string): boolean {
  return url.includes("neon.tech") || url.includes("neondb");
}

export function getDatabaseUrl(): string | undefined {
  if (typeof process !== "undefined" && process.env?.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  const root = globalThis as {
    __env__?: Record<string, string>;
    env?: Record<string, string>;
  };
  return root.__env__?.DATABASE_URL || root.env?.DATABASE_URL;
}

export function getPool(): pg.Pool | null {
  if (poolInstance) return poolInstance;

  const connectionString = getDatabaseUrl();
  if (!connectionString || isNeonDatabase(connectionString)) return null;

  const requiresSsl =
    connectionString.includes("sslmode=require") ||
    connectionString.includes("supabase.co") ||
    connectionString.includes("render.com") ||
    process.env.PGSSLMODE === "require" ||
    process.env.DATABASE_SSL === "true";

  poolInstance = new Pool({
    connectionString,
    ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
  });

  return poolInstance;
}

export function getDb(): DrizzleDatabase | null {
  if (dbInstance) return dbInstance;

  const connectionString = getDatabaseUrl();
  if (!connectionString) return null;

  if (isNeonDatabase(connectionString)) {
    neonSqlInstance = neon(connectionString);
    dbInstance = drizzleNeon(neonSqlInstance, { schema });
    return dbInstance;
  }

  const pool = getPool();
  if (!pool) return null;

  dbInstance = drizzlePg(pool, { schema });
  return dbInstance;
}
export const db: DrizzleDatabase = new Proxy({} as DrizzleDatabase, {
  get(_target, prop) {
    const database = getDb();
    if (!database) {
      throw new Error("DATABASE_URL is not set or PostgreSQL connection pool is uninitialized.");
    }
    const val = (database as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === "function" ? (val as (...args: unknown[]) => unknown).bind(database) : val;
  },
});

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

export function getCategoryTerms(cat: string): string[] {
  const clean = (cat || "").trim().toLowerCase();
  if (clean === "web") return ["WEB", "web"];
  if (clean === "games" || clean === "游戏") return ["游戏", "games"];
  if (clean === "tools" || clean === "工具") return ["工具", "tools"];
  if (clean === "ai") return ["AI", "ai"];
  if (clean === "apps" || clean === "app") return ["App", "apps"];
  return [cat];
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

function rowToApp(row: schema.AppSelect | Record<string, unknown>): AppItem {
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
    developer_id: row.developer_id ? String(row.developer_id) : undefined,
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
    compatibility: String(row.compatibility || "现代 Web 浏览器 / iOS / Android / macOS / Windows"),
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

export async function ensureTablesInitialized(): Promise<void> {
  if (initializationPromise) return initializationPromise;

  const connectionString = getDatabaseUrl();
  if (!connectionString) return;

  initializationPromise = (async () => {
    try {
      const initStatements = [
        `CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          icon TEXT DEFAULT '',
          sort_order INTEGER DEFAULT 0 NOT NULL,
          created_at BIGINT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS apps (
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
          screenshots TEXT,
          preview_features TEXT,
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
          privacy_linked TEXT,
          privacy_not_linked TEXT,
          events TEXT,
          related_topics TEXT,
          featured BOOLEAN DEFAULT FALSE NOT NULL,
          trending BOOLEAN DEFAULT FALSE NOT NULL,
          created_at BIGINT NOT NULL,
          updated_at BIGINT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS reviews (
          id TEXT PRIMARY KEY,
          app_id TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          author TEXT NOT NULL,
          rating INTEGER DEFAULT 5 NOT NULL,
          date TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at BIGINT NOT NULL
        )`,
        `CREATE INDEX IF NOT EXISTS idx_apps_category ON apps(category)`,
        `CREATE INDEX IF NOT EXISTS idx_apps_featured ON apps(featured)`,
        `CREATE INDEX IF NOT EXISTS idx_apps_trending ON apps(trending)`,
        `CREATE INDEX IF NOT EXISTS idx_reviews_app_id ON reviews(app_id)`,
      ];

      if (isNeonDatabase(connectionString)) {
        if (!neonSqlInstance) {
          neonSqlInstance = neon(connectionString);
        }
        for (const stmt of initStatements) {
          await neonSqlInstance.query(stmt);
        }
        for (const cat of DEFAULT_CATEGORIES) {
          await neonSqlInstance.query(
            `INSERT INTO categories (id, name, icon, sort_order, created_at)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id) DO NOTHING`,
            [cat.id, cat.name, cat.icon || "", cat.sort_order || 0, Date.now()]
          );
        }
        return;
      }

      const pool = getPool();
      if (!pool) return;

      const client = await pool.connect();
      try {
        for (const stmt of initStatements) {
          await client.query(stmt);
        }
        for (const cat of DEFAULT_CATEGORIES) {
          await client.query(
            `INSERT INTO categories (id, name, icon, sort_order, created_at)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id) DO NOTHING`,
            [cat.id, cat.name, cat.icon || "", cat.sort_order || 0, Date.now()]
          );
        }
      } finally {
        client.release();
      }
    } catch (err) {
      console.error("Failed to ensure PostgreSQL tables initialized:", err);
    }
  })();

  return initializationPromise;
}

export async function getCategories(): Promise<CategoryItem[]> {
  try {
    const database = getDb();
    if (!database) return DEFAULT_CATEGORIES;
    await ensureTablesInitialized();

    const rows = await (database as NeonHttpDatabase<typeof schema>)
      .select()
      .from(categoriesTable)
      .orderBy(asc(categoriesTable.sort_order), asc(categoriesTable.created_at));

    if (rows && rows.length > 0) {
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        icon: r.icon || undefined,
        sort_order: r.sort_order,
        created_at: Number(r.created_at),
      }));
    }
  } catch (err) {
    console.error("Error in getCategories:", err);
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
  try {
    const database = getDb();
    if (!database) return [];
    await ensureTablesInitialized();

    const conditions: (SQL | undefined)[] = [];

    if (
      options?.category &&
      options.category !== "类别" &&
      options.category !== "all" &&
      options.category !== "全部"
    ) {
      const terms = getCategoryTerms(options.category);
      const termConditions = terms.map((t) =>
        or(
          eq(appsTable.category, t),
          ilike(appsTable.categories, `%"${t}"%`),
          ilike(appsTable.categories, `%${t}%`)
        )
      );
      conditions.push(or(...termConditions));
    }

    if (options?.featured !== undefined) {
      conditions.push(eq(appsTable.featured, options.featured));
    }

    if (options?.trending !== undefined) {
      conditions.push(eq(appsTable.trending, options.trending));
    }

    let query = (database as NeonHttpDatabase<typeof schema>)
      .select()
      .from(appsTable)
      .orderBy(desc(appsTable.created_at))
      .$dynamic();

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const rows = await query;
    return rows.map(rowToApp);
  } catch (err) {
    console.error("Error in getAllApps:", err);
    return [];
  }
}

export async function getAppById(id: string): Promise<AppItem | null> {
  const rawId = (id || "").trim();
  const decodedId = decodeURIComponent(rawId).toLowerCase();

  try {
    const database = getDb();
    if (!database) return null;
    await ensureTablesInitialized();

    const rows = await (database as NeonHttpDatabase<typeof schema>)
      .select()
      .from(appsTable)
      .where(or(eq(appsTable.id, rawId), eq(appsTable.id, decodedId)))
      .limit(1);

    if (rows && rows.length > 0) {
      return rowToApp(rows[0]);
    }

    const byDomain = await getAppByDomain(decodedId);
    if (byDomain) return byDomain;

    return null;
  } catch (err) {
    console.error("Error in getAppById:", err);
    return null;
  }
}

export async function searchApps(query: string): Promise<AppItem[]> {
  const trimmed = (query || "").trim().toLowerCase();
  if (!trimmed) return getAllApps();

  try {
    const database = getDb();
    if (!database) return [];
    await ensureTablesInitialized();

    const pattern = `%${trimmed}%`;

    const rows = await (database as NeonHttpDatabase<typeof schema>)
      .select()
      .from(appsTable)
      .where(
        or(
          ilike(appsTable.name, pattern),
          ilike(appsTable.tagline, pattern),
          ilike(appsTable.description, pattern),
          ilike(appsTable.category, pattern),
          ilike(appsTable.categories, pattern)
        )
      )
      .orderBy(desc(appsTable.rating), desc(appsTable.created_at));

    return rows.map(rowToApp);
  } catch (err) {
    console.error("Error in searchApps:", err);
    return [];
  }
}

export async function getAppByDomain(targetUrl: string): Promise<AppItem | null> {
  const { hostname, cleanDomain } = extractDomain(targetUrl);
  if (!hostname && !cleanDomain) return null;

  try {
    const database = getDb();
    if (!database) return null;
    await ensureTablesInitialized();

    const pattern1 = `%${cleanDomain}%`;
    const pattern2 = `%${hostname}%`;

    const rows = await (database as NeonHttpDatabase<typeof schema>)
      .select()
      .from(appsTable)
      .where(
        or(
          eq(appsTable.developer_id, cleanDomain),
          eq(appsTable.developer_id, hostname),
          ilike(appsTable.url, pattern1),
          ilike(appsTable.url, pattern2)
        )
      )
      .orderBy(desc(appsTable.updated_at), desc(appsTable.created_at));

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
  } catch (err) {
    console.error("Error in getAppByDomain:", err);
    return null;
  }
}

export async function deleteApp(id: string): Promise<boolean> {
  try {
    const database = getDb();
    if (!database) return false;
    await ensureTablesInitialized();

    await (database as NeonHttpDatabase<typeof schema>).delete(appsTable).where(eq(appsTable.id, id));
    return true;
  } catch (err) {
    console.error("Error in deleteApp:", err);
    return false;
  }
}

export async function insertApp(app: AppItem): Promise<AppItem> {
  const existingApp = await getAppByDomain(app.url);
  if (existingApp && existingApp.id !== app.id) {
    app.id = existingApp.id;
    app.created_at = existingApp.created_at || app.created_at;
  }

  const categories =
    Array.isArray(app.categories) && app.categories.length > 0
      ? app.categories
      : [app.category || "WEB"];

  const primaryCategory = categories[0] || "WEB";
  app.category = primaryCategory;
  app.categories = categories;

  const now = Date.now();
  const createdAt = app.created_at || now;
  const updatedAt = now;
  app.created_at = createdAt;
  app.updated_at = updatedAt;

  const values: schema.AppInsert = {
    id: app.id,
    name: app.name,
    tagline: app.tagline || "",
    url: app.url,
    category: primaryCategory,
    categories: JSON.stringify(categories),
    developer: app.developer,
    developer_id: app.developer_id || "",
    icon_url: app.icon_url,
    cover_url: app.cover_url,
    primary_color: app.primary_color || "",
    seo_image: app.seo_image || "",
    screenshots: JSON.stringify(app.screenshots || []),
    preview_features: JSON.stringify(app.preview_features || []),
    description: app.description,
    rating: app.rating || 4.8,
    rating_count: app.rating_count || "100+",
    ranking: app.ranking || "",
    age_rating: app.age_rating || "12+",
    price: app.price || "免费 · Web App",
    size: app.size || "Web App",
    compatibility: app.compatibility || "全平台现代浏览器",
    languages: app.languages || "简体中文和英语",
    version: app.version || "1.0.0",
    version_date: app.version_date || "刚刚",
    release_notes: app.release_notes || "初始版本发布",
    privacy_linked: JSON.stringify(app.privacy_linked || []),
    privacy_not_linked: JSON.stringify(app.privacy_not_linked || []),
    events: JSON.stringify(app.events || []),
    related_topics: JSON.stringify(app.related_topics || []),
    featured: Boolean(app.featured),
    trending: Boolean(app.trending),
    created_at: createdAt,
    updated_at: updatedAt,
  };

  try {
    const database = getDb();
    if (!database) {
      throw new Error("DATABASE_URL is not set or PostgreSQL connection is uninitialized.");
    }
    await ensureTablesInitialized();

    await (database as NeonHttpDatabase<typeof schema>)
      .insert(appsTable)
      .values(values)
      .onConflictDoUpdate({
        target: appsTable.id,
        set: {
          name: values.name,
          tagline: values.tagline,
          url: values.url,
          category: values.category,
          categories: values.categories,
          developer: values.developer,
          developer_id: values.developer_id,
          icon_url: values.icon_url,
          cover_url: values.cover_url,
          primary_color: values.primary_color,
          seo_image: values.seo_image,
          screenshots: values.screenshots,
          preview_features: values.preview_features,
          description: values.description,
          rating: values.rating,
          rating_count: values.rating_count,
          ranking: values.ranking,
          age_rating: values.age_rating,
          price: values.price,
          size: values.size,
          compatibility: values.compatibility,
          languages: values.languages,
          version: values.version,
          version_date: values.version_date,
          release_notes: values.release_notes,
          privacy_linked: values.privacy_linked,
          privacy_not_linked: values.privacy_not_linked,
          events: values.events,
          related_topics: values.related_topics,
          featured: values.featured,
          trending: values.trending,
          updated_at: values.updated_at,
        },
      });

    return app;
  } catch (err) {
    console.error("Error in insertApp:", err);
    throw err;
  }
}

export async function getReviews(appId: string): Promise<ReviewItem[]> {
  try {
    const database = getDb();
    if (!database) return [];
    await ensureTablesInitialized();

    const rows = await (database as NeonHttpDatabase<typeof schema>)
      .select()
      .from(reviewsTable)
      .where(eq(reviewsTable.app_id, appId))
      .orderBy(desc(reviewsTable.created_at));

    return rows.map((r) => ({
      id: r.id,
      app_id: r.app_id,
      title: r.title,
      author: r.author,
      rating: r.rating,
      date: r.date,
      content: r.content,
      created_at: Number(r.created_at),
    }));
  } catch (err) {
    console.error("Error in getReviews:", err);
    return [];
  }
}

export async function insertReview(review: ReviewItem): Promise<ReviewItem> {
  const values: schema.ReviewInsert = {
    id: review.id,
    app_id: review.app_id,
    title: review.title,
    author: review.author,
    rating: review.rating ?? 5,
    date: review.date,
    content: review.content,
    created_at: review.created_at || Date.now(),
  };

  try {
    const database = getDb();
    if (!database) {
      throw new Error("DATABASE_URL is not set or PostgreSQL connection is uninitialized.");
    }
    await ensureTablesInitialized();

    await (database as NeonHttpDatabase<typeof schema>).insert(reviewsTable).values(values);
    return review;
  } catch (err) {
    console.error("Error in insertReview:", err);
    throw err;
  }
}

export * from "./schema";
