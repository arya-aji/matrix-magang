import { asc, desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "@/db";
import {
  performanceCriteria,
  performanceReviews,
  performanceScores,
  users,
} from "@/db/schema";

const reviewerUser = alias(users, "reviewer_user");

export async function getCriteria(includeInactive = false) {
  return db
    .select()
    .from(performanceCriteria)
    .where(includeInactive ? undefined : eq(performanceCriteria.isActive, true))
    .orderBy(asc(performanceCriteria.name));
}

export async function getActiveWeightTotal() {
  const rows = await db
    .select({ weight: performanceCriteria.weight })
    .from(performanceCriteria)
    .where(eq(performanceCriteria.isActive, true));

  return rows.reduce((sum, row) => sum + row.weight, 0);
}

/** Reviews for one intern, newest period first. */
export async function getReviewsForIntern(internId: string, limit = 12) {
  return db
    .select({
      id: performanceReviews.id,
      periodStart: performanceReviews.periodStart,
      periodEnd: performanceReviews.periodEnd,
      status: performanceReviews.status,
      overallScore: performanceReviews.overallScore,
      summary: performanceReviews.summary,
      reviewerName: users.name,
      updatedAt: performanceReviews.updatedAt,
    })
    .from(performanceReviews)
    .innerJoin(users, eq(performanceReviews.reviewerId, users.id))
    .where(eq(performanceReviews.internId, internId))
    .orderBy(desc(performanceReviews.periodEnd))
    .limit(limit);
}

export async function getReviewById(reviewId: string) {
  const [review] = await db
    .select({
      id: performanceReviews.id,
      internId: performanceReviews.internId,
      internName: users.name,
      reviewerId: performanceReviews.reviewerId,
      reviewerName: reviewerUser.name,
      periodStart: performanceReviews.periodStart,
      periodEnd: performanceReviews.periodEnd,
      status: performanceReviews.status,
      overallScore: performanceReviews.overallScore,
      summary: performanceReviews.summary,
      updatedAt: performanceReviews.updatedAt,
    })
    .from(performanceReviews)
    .innerJoin(users, eq(performanceReviews.internId, users.id))
    .innerJoin(reviewerUser, eq(performanceReviews.reviewerId, reviewerUser.id))
    .where(eq(performanceReviews.id, reviewId))
    .limit(1);

  return review ?? null;
}

export async function getReviewScores(reviewId: string) {
  return db
    .select({
      id: performanceScores.id,
      criterionId: performanceScores.criterionId,
      criterionName: performanceCriteria.name,
      criterionWeight: performanceCriteria.weight,
      score: performanceScores.score,
      comment: performanceScores.comment,
    })
    .from(performanceScores)
    .innerJoin(performanceCriteria, eq(performanceScores.criterionId, performanceCriteria.id))
    .where(eq(performanceScores.reviewId, reviewId))
    .orderBy(asc(performanceCriteria.name));
}

/** Full review with scores, used by the review detail screens. */
export async function getReviewWithScores(reviewId: string) {
  const [review, scores] = await Promise.all([
    getReviewById(reviewId),
    getReviewScores(reviewId),
  ]);

  if (!review) return null;
  return { review, scores };
}

export async function getReviewsByMentor(mentorId: string) {
  return db
    .select({
      id: performanceReviews.id,
      internId: performanceReviews.internId,
      internName: users.name,
      periodStart: performanceReviews.periodStart,
      periodEnd: performanceReviews.periodEnd,
      status: performanceReviews.status,
      overallScore: performanceReviews.overallScore,
      updatedAt: performanceReviews.updatedAt,
    })
    .from(performanceReviews)
    .innerJoin(users, eq(performanceReviews.internId, users.id))
    .where(eq(performanceReviews.reviewerId, mentorId))
    .orderBy(desc(performanceReviews.updatedAt));
}

/** All reviews, newest first (admin overview). */
export async function getAllReviews(limit = 50) {
  return db
    .select({
      id: performanceReviews.id,
      internId: performanceReviews.internId,
      internName: users.name,
      periodStart: performanceReviews.periodStart,
      periodEnd: performanceReviews.periodEnd,
      status: performanceReviews.status,
      overallScore: performanceReviews.overallScore,
      updatedAt: performanceReviews.updatedAt,
    })
    .from(performanceReviews)
    .innerJoin(users, eq(performanceReviews.internId, users.id))
    .orderBy(desc(performanceReviews.updatedAt))
    .limit(limit);
}

export async function getLatestReviewForIntern(internId: string) {
  const [row] = await db
    .select({ id: performanceReviews.id })
    .from(performanceReviews)
    .where(eq(performanceReviews.internId, internId))
    .orderBy(desc(performanceReviews.periodEnd))
    .limit(1);

  return row ? getReviewWithScores(row.id) : null;
}

/**
 * Criteria that exist and are not yet scored in a review.
 */
export async function getUnscoredCriteria(reviewId: string) {
  const scored = await db
    .select({ criterionId: performanceScores.criterionId })
    .from(performanceScores)
    .where(eq(performanceScores.reviewId, reviewId));

  const scoredIds = scored.map((row) => row.criterionId);
  const active = await getCriteria(false);

  if (scoredIds.length === 0) return active;
  return active.filter((criterion) => !scoredIds.includes(criterion.id));
}
