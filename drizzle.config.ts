import { defineConfig } from "drizzle-kit";

// `drizzle-kit` runs outside of Next.js, so load `.env` ourselves.
try {
  process.loadEnvFile();
} catch {
  // .env is optional (e.g. CI provides real environment variables).
}

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_URL is required for drizzle-kit. Copy .env.example to .env.");
}

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
