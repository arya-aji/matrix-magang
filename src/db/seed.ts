import bcrypt from "bcryptjs";
import { eq, inArray } from "drizzle-orm";

/**
 * Bootstrap seed (`npm run db:seed`).
 *
 * Safe to run repeatedly and safe to run on a live deployment:
 * - it NEVER deletes domain data (no wipe);
 * - it upserts by natural key (email / name), so re-running is a no-op;
 * - existing passwords are never overwritten (an admin change is preserved);
 * - document entries are NOT fabricated for real interns. Use
 *   `npm run db:seed:demo` only on a local database.
 *
 * Everything is configurable through environment variables so the credentials
 * for real accounts are never hardcoded (see .env.example).
 */

const DEMO = process.argv.includes("--demo") || process.env.SEED_DEMO === "1";

const DEFAULT_PASSWORD = "Magang3173";

const ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL ?? "admin@example.com").trim().toLowerCase();
const ADMIN_NAME = process.env.SEED_ADMIN_NAME ?? "Administrator";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? DEFAULT_PASSWORD;

const INTERN_PASSWORD = process.env.SEED_INTERN_PASSWORD ?? DEFAULT_PASSWORD;

/** Shared daily document-entry target applied to every intern. */
const DAILY_TARGET = Number(process.env.SEED_DAILY_TARGET ?? 50);

/** Legacy mentor account from earlier versions; removed so old roles do not linger. */
const LEGACY_MENTOR_EMAIL = (process.env.SEED_MENTOR_EMAIL ?? "mentor@bpsjakpus.cloud")
  .trim()
  .toLowerCase();

/** Default internship window applied to interns that do not have one yet. */
const INTERNSHIP_START = process.env.SEED_INTERNSHIP_START;
const INTERNSHIP_DAYS = Number(process.env.SEED_INTERNSHIP_DAYS ?? 90);

/** Real intern roster. */
const INTERNS: { name: string; email: string }[] = [
  { name: "Irawan", email: "irawanmardiansyah94@gmail.com" },
  { name: "Taufiq Ikhsan Muzaky", email: "taufiqikhsanmuzaky18@gmail.com" },
  { name: "Irna Cahya Humaira", email: "irnahumaira04@gmail.com" },
  { name: "Ananda Kresna Bayu", email: "anandakresnabayu@gmail.com" },
  { name: "Muhammad Saddam", email: "sadambaladewa8@gmail.com" },
  { name: "Eci Merliyana", email: "ecimerliyana17@gmail.com" },
  { name: "Shafina Marita Fatisya", email: "fatisyamarita@gmail.com" },
  { name: "Faradilla Eka Cahyani Putri", email: "faradillacahyani01@gmail.com" },
  { name: "Putri Sabila", email: "psabila321@gmail.com" },
  { name: "Wahyu Destiani", email: "destiwhy6@gmail.com" },
  { name: "Nurmila", email: "nurmilarumpa@gmail.com" },
  { name: "Norma Novianda", email: "viviand8016@gmail.com" },
  { name: "Ananda Zaskia Tri Qumaira", email: "zaskiaqumaira@gmail.com" },
  { name: "Tasya Aulia Rahmah", email: "tasyaaulia01juni@gmail.com" },
  { name: "Putri Nastiti", email: "putrinastiti07@gmail.com" },
  { name: "Ning Imas", email: "ningimasaza@gmail.com" },
  { name: "Risky Multazam", email: "riskymultazam67@gmail.com" },
  { name: "Andika", email: "andika.pgst20@gmail.com" },
  { name: "Puspita Amelia Ramadhona", email: "puspita.a.romadhona@gmail.com" },
  { name: "Muhamad Nurfauzi", email: "nurfauzim009@gmail.com" },
  { name: "Nur Hikmah Lahati", email: "hilalahati02@gmail.com" },
  { name: "Inayah Sasi Maulidha", email: "inayahsasi168@gmail.com" },
  { name: "Isna Oktafiana", email: "isnaoktafiana10@gmail.com" },
  { name: "Virza Dwi Irziana", email: "v.irziana02@gmail.com" },
];

const DEPARTMENTS = [
  {
    name: "GEMPITA",
    description: "Departemen tempat seluruh intern batch ini ditempatkan.",
  },
];

/** Filler departments created by earlier seed versions; retired (not deleted). */
const LEGACY_DEPARTMENTS = ["Engineering", "Marketing", "Design"];

/** Accounts created by the earlier demo seed; cleaned up so they do not linger. */
const LEGACY_DEMO_EMAILS = [
  "budi@example.com",
  "sinta@example.com",
  "andi@example.com",
  "rara@example.com",
  "mentor@example.com",
  "mentor2@example.com",
  LEGACY_MENTOR_EMAIL,
];

// Must run before `./index` (which throws when DATABASE_URL is missing).
try {
  process.loadEnvFile();
} catch {
  // Environment is normally provided by the platform (Coolify).
}

async function main() {
  const { db } = await import("./index");
  const s = await import("./schema");
  const { addDays, getTodayJakarta } = await import("../lib/date");

  const today = getTodayJakarta();
  const internshipStart = INTERNSHIP_START ?? today;
  const internshipEnd = addDays(internshipStart, INTERNSHIP_DAYS);

  const stats = {
    legacyRemoved: 0,
    usersCreated: 0,
    usersUpdated: 0,
    internshipsCreated: 0,
    departmentsCreated: 0,
    departmentsAssigned: 0,
    departmentsRetired: 0,
    settingsCreated: 0,
    demoEntriesCreated: 0,
  };

  /* ---------------------------------------------------------------------- */
  /* 1. Remove legacy demo/mentor accounts (cascades to their records)       */
  /* ---------------------------------------------------------------------- */
  const legacy = await db
    .select({ id: s.users.id })
    .from(s.users)
    .where(inArray(s.users.email, LEGACY_DEMO_EMAILS));

  if (legacy.length > 0) {
    await db.delete(s.users).where(
      inArray(
        s.users.id,
        legacy.map((row) => row.id),
      ),
    );
    stats.legacyRemoved = legacy.length;
  }

  /* ------------------------------- users --------------------------------- */
  const hashCache = new Map<string, string>();
  async function hashOf(password: string) {
    const cached = hashCache.get(password);
    if (cached) return cached;
    const hash = await bcrypt.hash(password, 10);
    hashCache.set(password, hash);
    return hash;
  }

  async function upsertUser(
    role: "ADMIN" | "INTERN",
    name: string,
    email: string,
    password: string,
  ): Promise<string> {
    const [existing] = await db
      .select({ id: s.users.id })
      .from(s.users)
      .where(eq(s.users.email, email))
      .limit(1);

    if (existing) {
      // Never touch the password of an existing account.
      await db
        .update(s.users)
        .set({ name, role, isActive: true })
        .where(eq(s.users.id, existing.id));
      stats.usersUpdated += 1;
      return existing.id;
    }

    const [created] = await db
      .insert(s.users)
      .values({ name, email, role, isActive: true, passwordHash: await hashOf(password) })
      .returning({ id: s.users.id });

    if (!created) throw new Error(`Gagal membuat user: ${email}`);
    stats.usersCreated += 1;
    return created.id;
  }

  await upsertUser("ADMIN", ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD);

  const internIds: { name: string; email: string; id: string }[] = [];
  for (const intern of INTERNS) {
    const email = intern.email.trim().toLowerCase();
    const id = await upsertUser("INTERN", intern.name, email, INTERN_PASSWORD);
    internIds.push({ ...intern, email, id });
  }

  /* ---------------------------- departments ------------------------------ */
  let gempitaId: string | null = null;

  for (const department of DEPARTMENTS) {
    const [existing] = await db
      .select({ id: s.departments.id })
      .from(s.departments)
      .where(eq(s.departments.name, department.name))
      .limit(1);

    if (existing) {
      await db
        .update(s.departments)
        .set({ description: department.description ?? null, isActive: true })
        .where(eq(s.departments.id, existing.id));
      gempitaId = existing.id;
    } else {
      const [created] = await db
        .insert(s.departments)
        .values({
          name: department.name,
          description: department.description ?? null,
          isActive: true,
        })
        .returning({ id: s.departments.id });

      if (!created) throw new Error(`Gagal membuat departemen: ${department.name}`);
      gempitaId = created.id;
      stats.departmentsCreated += 1;
    }
  }

  if (!gempitaId) throw new Error("Departemen GEMPITA tidak tersedia.");

  // Retire (do not delete) the filler departments from earlier seed versions.
  const retired = await db
    .update(s.departments)
    .set({ isActive: false })
    .where(inArray(s.departments.name, LEGACY_DEPARTMENTS))
    .returning({ id: s.departments.id });
  stats.departmentsRetired = retired.length;

  /* ---------------------------- internships ------------------------------ */
  for (const intern of internIds) {
    const [existing] = await db
      .select({
        id: s.internships.id,
        departmentId: s.internships.departmentId,
      })
      .from(s.internships)
      .where(eq(s.internships.userId, intern.id))
      .limit(1);

    if (existing) {
      if (existing.departmentId !== gempitaId) {
        await db
          .update(s.internships)
          .set({ departmentId: gempitaId })
          .where(eq(s.internships.id, existing.id));
        stats.departmentsAssigned += 1;
      }
      continue;
    }

    await db.insert(s.internships).values({
      userId: intern.id,
      departmentId: gempitaId,
      startDate: internshipStart,
      endDate: internshipEnd,
      status: "ACTIVE",
    });
    stats.internshipsCreated += 1;
    stats.departmentsAssigned += 1;
  }

  /* --------------------------- app settings ------------------------------ */
  const [existingSettings] = await db
    .select({ id: s.appSettings.id })
    .from(s.appSettings)
    .limit(1);

  if (!existingSettings) {
    await db.insert(s.appSettings).values({ dailyTarget: DAILY_TARGET });
    stats.settingsCreated += 1;
  }

  /* --------------------------- optional demo data ------------------------ */
  if (DEMO) {
    const [anyEntry] = await db
      .select({ id: s.documentEntries.id })
      .from(s.documentEntries)
      .limit(1);

    if (!anyEntry) {
      const sample = internIds.slice(0, 5);
      const rows: {
        internId: string;
        entryDate: string;
        name: string;
        kind: "USAHA" | "KELUARGA";
      }[] = [];

      for (const intern of sample) {
        for (let day = 0; day < 14; day += 1) {
          const entryDate = addDays(today, -day);
          const count = 20 + ((day * 7 + intern.name.length) % 45); // 20..64
          for (let i = 0; i < count; i += 1) {
            const kind: "USAHA" | "KELUARGA" = i % 3 === 0 ? "KELUARGA" : "USAHA";
            rows.push({
              internId: intern.id,
              entryDate,
              name: `${kind === "USAHA" ? "Usaha" : "Keluarga"} Demo ${day}-${i + 1}`,
              kind,
            });
          }
        }
      }

      for (let i = 0; i < rows.length; i += 500) {
        await db.insert(s.documentEntries).values(rows.slice(i, i + 500));
      }
      stats.demoEntriesCreated = rows.length;
    }
  }

  /* ------------------------------- summary ------------------------------- */
  const defaultPasswordInUse = [ADMIN_PASSWORD, INTERN_PASSWORD].includes(DEFAULT_PASSWORD);

  console.log("Seed selesai.");
  console.log(`  demo data:            ${DEMO ? "YA (jangan dipakai di produksi)" : "tidak"}`);
  console.log(`  admin:                ${ADMIN_EMAIL}`);
  console.log(`  interns:              ${internIds.length}`);
  console.log(`  akun dibuat:          ${stats.usersCreated}`);
  console.log(`  akun diperbarui:      ${stats.usersUpdated}`);
  console.log(`  magang dibuat:        ${stats.internshipsCreated}`);
  console.log(`  departemen dibuat:    ${stats.departmentsCreated}`);
  console.log(`  intern → GEMPITA:     ${stats.departmentsAssigned}`);
  console.log(`  departemen lama:      ${stats.departmentsRetired} dinonaktifkan`);
  console.log(`  target harian:        ${existingSettings ? "(sudah ada, tidak diubah)" : DAILY_TARGET}`);
  console.log(`  entri demo dibuat:    ${stats.demoEntriesCreated}`);
  console.log(`  akun lama hapus:      ${stats.legacyRemoved}`);
  console.log("");

  if (defaultPasswordInUse) {
    console.warn(
      "PERINGATAN: masih memakai password default. Set SEED_ADMIN_PASSWORD dan " +
      "SEED_INTERN_PASSWORD sebelum deploy ke produksi.",
    );
  }
  console.log(
    "Catatan: password akun yang sudah ada TIDAK diubah. Admin dapat mereset " +
    "sandi per user lewat halaman Users.",
  );
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error("Seed gagal:", error);
    process.exit(1);
  });
