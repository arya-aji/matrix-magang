import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";

export const dynamic = "force-dynamic";

/**
 * Liveness/readiness probe used by Docker and Coolify.
 * Never leaks database details, error text or stack traces (PRD §57).
 */
export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch {
    return NextResponse.json({ status: "degraded" }, { status: 503 });
  }
}
