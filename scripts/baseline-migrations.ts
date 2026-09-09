import "dotenv/config";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

type JournalEntry = {
  when: number;
  tag: string;
};

const REQUIRED_BASELINE_TABLES = [
  "apps",
  "categories",
  "reviews",
  "account",
  "session",
  "user",
  "verification",
];

function needsSsl(databaseUrl: string): boolean {
  return (
    databaseUrl.includes("sslmode=require") ||
    databaseUrl.includes("neon.tech") ||
    databaseUrl.includes("supabase.co") ||
    databaseUrl.includes("render.com") ||
    process.env.PGSSLMODE === "require" ||
    process.env.DATABASE_SSL === "true"
  );
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL must be set before baselining migrations.");
  }

  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: needsSsl(databaseUrl) ? { rejectUnauthorized: false } : undefined,
  });

  await client.connect();
  try {
    const tables = await client.query<{ table_name: string }>(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    const tableNames = new Set(tables.rows.map((row) => row.table_name));

    if (tableNames.size === 0) {
      console.log("Database is empty; migrations will initialize it.");
      return;
    }

    await client.query('CREATE SCHEMA IF NOT EXISTS "drizzle"');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `);

    const existingMigration = await client.query(
      'SELECT 1 FROM "drizzle"."__drizzle_migrations" LIMIT 1'
    );
    if (existingMigration.rowCount) {
      console.log("Migration history already exists; no baseline is needed.");
      return;
    }

    const missingTables = REQUIRED_BASELINE_TABLES.filter((table) => !tableNames.has(table));
    if (missingTables.length > 0) {
      throw new Error(
        `Database has no migration history and is not a recognized legacy schema. Missing tables: ${missingTables.join(", ")}`
      );
    }

    const migrationDirectory = path.resolve("drizzle");
    const journal = JSON.parse(
      await readFile(path.join(migrationDirectory, "meta", "_journal.json"), "utf8")
    ) as { entries: JournalEntry[] };

    const baselineMigrationCount = tableNames.has("ingestion_drafts") ? 3 : 2;
    const baselineMigrations = journal.entries.slice(0, baselineMigrationCount);
    if (baselineMigrations.length !== baselineMigrationCount) {
      throw new Error("The initial migration history is incomplete.");
    }

    for (const migration of baselineMigrations) {
      const sql = await readFile(path.join(migrationDirectory, `${migration.tag}.sql`), "utf8");
      const hash = createHash("sha256").update(sql).digest("hex");
      await client.query(
        'INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at) VALUES ($1, $2)',
        [hash, migration.when]
      );
    }

    console.log("Legacy schema baseline recorded; pending migrations can now run.");
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
