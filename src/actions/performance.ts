"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  performanceCriteria,
  performanceReviews,
  performanceScores,
} from "@/db/schema";
import { errorState, successState, type FormState } from "@/lib/form-state";
import { calculateWeightedScore } from "@/lib/performance";
import {
  createReviewSchema,
  finalizeReviewSchema,
  performanceCriterionSchema,
  updateReviewScoreSchema,
} from "@/lib/validations/performance";
import { assertAdmin, assertMentorAccess, AuthorizationError } from "@/server/permissions";
import { getSessionUser } from "@/server/auth/session";
import {
  getActiveWeightTotal,
  getReviewById,
  getReviewScores,
} from "@/server/queries/performance";

import { handleActionError, zodToFormState } from "../server/action-utils";

function optionalValue(value: FormDataEntryValue | null) {
  if (value === null) return undefined;
  const text = String(value).trim();
  return text === "" ? undefined : text;
}

export async function saveCriterionAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const user = await getSessionUser();
    if (!user) throw new AuthorizationError("Sesi Anda berakhir. Silakan masuk kembali.");
    assertAdmin(user);

    const parsed = performanceCriterionSchema.safeParse({
      id: optionalValue(formData.get("id")),
      name: formData.get("name"),
      description: optionalValue(formData.get("description")),
      weight: formData.get("weight"),
      isActive: formData.get("isActive") ?? false,
    });

    if (!parsed.success) return zodToFormState(parsed.error);

    const values = {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      weight: parsed.data.weight,
      isActive: parsed.data.isActive,
    };

    if (parsed.data.id) {
      await db
        .update(performanceCriteria)
        .set(values)
        .where(eq(performanceCriteria.id, parsed.data.id));
    } else {
      await db.insert(performanceCriteria).values(values);
    }

    revalidatePath("/settings");
    revalidatePath("/performance");
    return successState();
  } catch (error) {
    return handleActionError(error, "saveCriterion");
  }
}

export async function createReviewAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  let createdId: string | null = null;

  try {
    const user = await getSessionUser();
    if (!user) throw new AuthorizationError("Sesi Anda berakhir. Silakan masuk kembali.");

    if (user.role === "INTERN") {
      return errorState("Intern tidak dapat membuat review.");
    }

    const parsed = createReviewSchema.safeParse({
      internId: formData.get("internId"),
      periodStart: formData.get("periodStart"),
      periodEnd: formData.get("periodEnd"),
      summary: optionalValue(formData.get("summary")),
    });

    if (!parsed.success) return zodToFormState(parsed.error);
    if (parsed.data.periodEnd < parsed.data.periodStart) {
      return errorState("Periode akhir tidak boleh sebelum periode mulai.");
    }

    await assertMentorAccess({ user, internId: parsed.data.internId });

    const [created] = await db
      .insert(performanceReviews)
      .values({
        internId: parsed.data.internId,
        reviewerId: user.id,
        periodStart: parsed.data.periodStart,
        periodEnd: parsed.data.periodEnd,
        status: "DRAFT",
        summary: parsed.data.summary ?? null,
      })
      .returning({ id: performanceReviews.id });

    createdId = created?.id ?? null;
    revalidatePath("/performance");
  } catch (error) {
    return handleActionError(error, "createReview");
  }

  if (!createdId) {
    return errorState("Gagal membuat review.");
  }

  redirect(`/performance/${createdId}`);
}

export async function saveReviewScoreAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const user = await getSessionUser();
    if (!user) throw new AuthorizationError("Sesi Anda berakhir. Silakan masuk kembali.");

    const parsed = updateReviewScoreSchema.safeParse({
      reviewId: formData.get("reviewId"),
      criterionId: formData.get("criterionId"),
      score: formData.get("score"),
      comment: optionalValue(formData.get("comment")),
    });

    if (!parsed.success) return zodToFormState(parsed.error);

    const review = await getReviewById(parsed.data.reviewId);
    if (!review) return errorState("Review tidak ditemukan.");

    if (review.status === "FINAL") {
      return errorState("Review yang sudah final tidak dapat diubah.");
    }

    if (user.role !== "ADMIN" && review.reviewerId !== user.id) {
      throw new AuthorizationError();
    }

    const [existing] = await db
      .select({ id: performanceScores.id })
      .from(performanceScores)
      .where(
        and(
          eq(performanceScores.reviewId, parsed.data.reviewId),
          eq(performanceScores.criterionId, parsed.data.criterionId),
        ),
      )
      .limit(1);

    const values = {
      score: parsed.data.score,
      comment: parsed.data.comment ?? null,
    };

    if (existing) {
      await db.update(performanceScores).set(values).where(eq(performanceScores.id, existing.id));
    } else {
      await db.insert(performanceScores).values({
        reviewId: parsed.data.reviewId,
        criterionId: parsed.data.criterionId,
        ...values,
      });
    }

    revalidatePath(`/performance/${parsed.data.reviewId}`);
    return successState();
  } catch (error) {
    return handleActionError(error, "saveReviewScore");
  }
}

/** Finalizes a review: validates weights, computes the weighted score server-side. */
export async function finalizeReviewAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const user = await getSessionUser();
    if (!user) throw new AuthorizationError("Sesi Anda berakhir. Silakan masuk kembali.");

    const parsed = finalizeReviewSchema.safeParse({
      reviewId: formData.get("reviewId"),
      summary: optionalValue(formData.get("summary")),
    });

    if (!parsed.success) return zodToFormState(parsed.error);

    const review = await getReviewById(parsed.data.reviewId);
    if (!review) return errorState("Review tidak ditemukan.");

    if (review.status === "FINAL") {
      return errorState("Review ini sudah final.");
    }

    if (user.role !== "ADMIN" && review.reviewerId !== user.id) {
      throw new AuthorizationError();
    }

    const scores = await getReviewScores(parsed.data.reviewId);
    if (scores.length === 0) {
      return errorState("Isi minimal satu nilai sebelum finalisasi.");
    }

    const weightTotal = await getActiveWeightTotal();
    if (weightTotal !== 100) {
      return errorState(
        `Total bobot kriteria aktif harus 100 (saat ini ${weightTotal}). Periksa di Pengaturan.`,
      );
    }

    const overall = calculateWeightedScore(
      scores.map((entry) => ({ score: entry.score, criterionWeight: entry.criterionWeight })),
    );

    await db
      .update(performanceReviews)
      .set({
        status: "FINAL",
        overallScore: overall.toFixed(2),
        summary: parsed.data.summary ?? review.summary,
      })
      .where(eq(performanceReviews.id, parsed.data.reviewId));

    revalidatePath(`/performance/${parsed.data.reviewId}`);
    revalidatePath("/performance");
    return successState();
  } catch (error) {
    return handleActionError(error, "finalizeReview");
  }
}
