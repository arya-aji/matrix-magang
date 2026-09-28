import bcrypt from "bcryptjs";
import { and, eq, inArray } from "drizzle-orm";

/**
 * Bootstrap seed (`npm run db:seed`).
 *
 * Safe to run repeatedly and safe to run on a live deployment:
 * - it NEVER deletes domain data (no wipe);
 * - it upserts by natural key (email / name), so re-running is a no-op;
 * - existing passwords are never overwritten (an admin change is preserved);
 * - work records (tasks, activities, feedback, reviews) are NOT fabricated for
 *   real interns. Use `npm run db:seed:demo` only on a local database.
 *
 * Everything is configurable through environment variables so the credentials
 * for real accounts are never hardcoded (see .env.example).
 */

const DEMO = process.argv.includes("--demo") || process.env.SEED_DEMO === "1";

const DEFAULT_PASSWORD = "Magang3173";

const ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL ?? "admin@example.com").trim().toLowerCase();
const ADMIN_NAME = process.env.SEED_ADMIN_NAME ?? "Administrator";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? DEFAULT_PASSWORD;

const MENTOR_EMAIL = (process.env.SEED_MENTOR_EMAIL ?? "mentor@bpsjakpus.cloud")
  .trim()
  .toLowerCase();
const MENTOR_NAME = process.env.SEED_MENTOR_NAME ?? "Mentor BPS Jakpus";
const MENTOR_PASSWORD = process.env.SEED_MENTOR_PASSWORD ?? DEFAULT_PASSWORD;

const INTERN_PASSWORD = process.env.SEED_INTERN_PASSWORD ?? DEFAULT_PASSWORD;

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

const CRITERIA = [
  { name: "Task Completion", description: "Konsistensi menyelesaikan tugas.", weight: 30 },
  { name: "Quality", description: "Kualitas hasil kerja.", weight: 25 },
  { name: "Initiative", description: "Inisiatif dan kemandirian.", weight: 15 },
  { name: "Communication", description: "Komunikasi dengan tim.", weight: 15 },
  { name: "Problem Solving", description: "Kemampuan memecahkan masalah.", weight: 15 },
];

/** Accounts created by the earlier demo seed; cleaned up so they do not linger. */
const LEGACY_DEMO_EMAILS = [
  "budi@example.com",
  "sinta@example.com",
  "andi@example.com",
  "rara@example.com",
  "mentor@example.com",
  "mentor2@example.com",
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
    mentorsReassigned: 0,
    departmentsCreated: 0,
    departmentsAssigned: 0,
    departmentsRetired: 0,
    criteriaCreated: 0,
  };

  /* ---------------------------------------------------------------------- */
  /* 1. Remove the previous demo accounts (and the records that block them)  */
  /* ---------------------------------------------------------------------- */
  const legacy = await db
    .select({ id: s.users.id, email: s.users.email })
    .from(s.users)
    .where(inArray(s.users.email, LEGACY_DEMO_EMAILS));

  if (legacy.length > 0) {
    const legacyIds = legacy.map((row) => row.id);

    // `tasks.created_by` and `performance_reviews.reviewer_id` are RESTRICT,
    // so their rows must go first; the rest cascades from users.
    await db.delete(s.performanceReviews).where(inArray(s.performanceReviews.reviewerId, legacyIds));
    await db.delete(s.tasks).where(inArray(s.tasks.createdBy, legacyIds));
    await db.delete(s.users).where(inArray(s.users.id, legacyIds));

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
    role: "ADMIN" | "MENTOR" | "INTERN",
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
  const mentorId = await upsertUser("MENTOR", MENTOR_NAME, MENTOR_EMAIL, MENTOR_PASSWORD);

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
    .where(
      and(inArray(s.departments.name, LEGACY_DEPARTMENTS), eq(s.departments.isActive, true)),
    )
    .returning({ id: s.departments.id });
  stats.departmentsRetired = retired.length;

  /* ---------------------------- internships ------------------------------ */
  for (const intern of internIds) {
    const [existing] = await db
      .select({
        id: s.internships.id,
        mentorId: s.internships.mentorId,
        departmentId: s.internships.departmentId,
      })
      .from(s.internships)
      .where(eq(s.internships.userId, intern.id))
      .limit(1);

    if (existing) {
      const patch: { mentorId?: string; departmentId?: string } = {};
      if (existing.mentorId !== mentorId) patch.mentorId = mentorId;
      if (existing.departmentId !== gempitaId) patch.departmentId = gempitaId;

      if (Object.keys(patch).length > 0) {
        await db.update(s.internships).set(patch).where(eq(s.internships.id, existing.id));
        if (patch.mentorId) stats.mentorsReassigned += 1;
        if (patch.departmentId) stats.departmentsAssigned += 1;
      }
      continue;
    }

    await db.insert(s.internships).values({
      userId: intern.id,
      mentorId,
      departmentId: gempitaId,
      startDate: internshipStart,
      endDate: internshipEnd,
      status: "ACTIVE",
    });
    stats.internshipsCreated += 1;
    stats.departmentsAssigned += 1;
  }

  /* -------------------------- performance criteria ----------------------- */
  for (const criterion of CRITERIA) {
    const [existing] = await db
      .select({ id: s.performanceCriteria.id, weight: s.performanceCriteria.weight })
      .from(s.performanceCriteria)
      .where(eq(s.performanceCriteria.name, criterion.name))
      .limit(1);

    if (existing) {
      if (existing.weight !== criterion.weight) {
        await db
          .update(s.performanceCriteria)
          .set({ weight: criterion.weight, description: criterion.description })
          .where(eq(s.performanceCriteria.id, existing.id));
      }
    } else {
      await db.insert(s.performanceCriteria).values({ ...criterion, isActive: true });
      stats.criteriaCreated += 1;
    }
  }

  /* --------------------------- optional demo data ------------------------ */
  if (DEMO) {
    const sample = internIds.slice(0, 3);
    if (sample.length > 0) {
      const createdTasks = await db
        .insert(s.tasks)
        .values([
          {
            title: "Build Login Page",
            description: "Contoh tugas demo (hanya untuk database lokal).",
            createdBy: mentorId,
            status: "IN_PROGRESS" as const,
            priority: "HIGH" as const,
            progress: 70,
            startDate: addDays(today, -3),
            dueDate: addDays(today, 3),
          },
          {
            title: "API Integration",
            description: "Contoh tugas demo yang dikerjakan dua intern.",
            createdBy: mentorId,
            status: "BLOCKED" as const,
            priority: "MEDIUM" as const,
            progress: 40,
            startDate: addDays(today, -5),
            dueDate: addDays(today, -1),
          },
        ])
        .returning({ id: s.tasks.id });

      const [first, second] = createdTasks;
      if (first && second) {
        const pairs = [
          ...sample.map((intern) => ({ taskId: first.id, userId: intern.id })),
          ...sample.slice(0, 2).map((intern) => ({ taskId: second.id, userId: intern.id })),
        ];
        await db.insert(s.taskAssignees).values(pairs);

        await db.insert(s.taskActivityLogs).values(
          createdTasks.map((task) => ({
            taskId: task.id,
            actorId: mentorId,
            type: "CREATED" as const,
            description: "Tugas demo dibuat oleh seed.",
          })),
        );

        const [activity] = await db
          .insert(s.dailyActivities)
          .values({
            internId: sample[0]?.id ?? "",
            activityDate: today,
            summary: "Contoh aktivitas demo (hanya untuk database lokal).",
            progress: 60,
            status: "DRAFT" as const,
          })
          .returning({ id: s.dailyActivities.id });

        if (activity) {
          await db
            .insert(s.dailyActivityTasks)
            .values({ activityId: activity.id, taskId: first.id });
        }

        await db.insert(s.feedback).values({
          internId: sample[0]?.id ?? "",
          authorId: mentorId,
          content: "Contoh feedback demo (hanya untuk database lokal).",
        });
      }
    }
  }

  /* ------------------------------- summary ------------------------------- */
  const defaultPasswordInUse = [ADMIN_PASSWORD, MENTOR_PASSWORD, INTERN_PASSWORD].includes(
    DEFAULT_PASSWORD,
  );

  console.log("Seed selesai.");
  console.log(`  demo data:            ${DEMO ? "YA (jangan dipakai di produksi)" : "tidak"}`);
  console.log(`  admin:                ${ADMIN_EMAIL}`);
  console.log(`  mentor:               ${MENTOR_EMAIL}`);
  console.log(`  interns:              ${internIds.length}`);
  console.log(`  akun dibuat:          ${stats.usersCreated}`);
  console.log(`  akun diperbarui:      ${stats.usersUpdated}`);
  console.log(`  magang dibuat:        ${stats.internshipsCreated}`);
  console.log(`  mentor dirapikan:     ${stats.mentorsReassigned}`);
  console.log(`  departemen dibuat:    ${stats.departmentsCreated}`);
  console.log(`  intern → GEMPITA:     ${stats.departmentsAssigned}`);
  console.log(`  departemen lama:      ${stats.departmentsRetired} dinonaktifkan`);
  console.log(`  kriteria dibuat:      ${stats.criteriaCreated}`);
  console.log(`  akun demo lama hapus: ${stats.legacyRemoved}`);
  console.log("");

  if (defaultPasswordInUse) {
    console.warn(
      "PERINGATAN: masih memakai password default. Set SEED_ADMIN_PASSWORD, " +
      "SEED_MENTOR_PASSWORD, dan SEED_INTERN_PASSWORD sebelum deploy ke produksi.",
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
