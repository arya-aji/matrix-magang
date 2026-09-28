/**
 * Applies pending Drizzle migrations.
 *
 * Deliberately plain ESM (no TypeScript) so it also runs inside the production
 * container, where the dev toolchain (drizzle-kit, tsx) is not installed.
 * It is bundled to a self-contained file by `npm run db:bundle`.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// Locally there is a `.env`; in the container the platform provides the vars.
try {
  process.loadEnvFile();
} catch {
  // No .env file — rely on the real environment.
}

const url = process.env.DATABASE_URL;
const migrationsFolder = process.env.MIGRATIONS_FOLDER ?? "./drizzle";

if (!url) {
  console.error("[migrate] DATABASE_URL is not set");
  process.exit(1);
}

const client = postgres(url, { max: 1 });

try {
  await migrate(drizzle(client), { migrationsFolder });
  console.log("[migrate] migrations applied");
} catch (error) {
  console.error("[migrate] failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end();
}
