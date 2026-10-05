import { db } from "@/db";
import { appSettings, type AppSettings } from "@/db/schema";

/**
 * The single settings row. Created on first read so the app never has to run a
 * separate bootstrap step for it.
 */
export async function getSettings(): Promise<AppSettings> {
  const [existing] = await db.select().from(appSettings).limit(1);
  if (existing) return existing;

  const [created] = await db.insert(appSettings).values({}).returning();
  if (created) return created;

  // Extremely unlikely (insert returned nothing); fall back to defaults.
  return {
    id: "",
    dailyTarget: 50,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
