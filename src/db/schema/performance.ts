import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { timestamps } from "./_shared";
import { users } from "./users";

export const reviewStatusEnum = pgEnum("review_status", ["DRAFT", "FINAL"]);

export const performanceCriteria = pgTable(
  "performance_criteria",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    weight: integer("weight").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (t) => [
    index("performance_criteria_active_idx").on(t.isActive),
    check("performance_criteria_weight_range", sql`${t.weight} >= 0 AND ${t.weight} <= 100`),
  ],
);

export const performanceReviews = pgTable(
  "performance_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    internId: uuid("intern_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reviewerId: uuid("reviewer_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    status: reviewStatusEnum("status").notNull().default("DRAFT"),
    /**
     * Weighted score, 0–100.
     * NOTE: the PRD specified `numeric(3,2)`, but that only holds values below
     * 10 (max 9.99) and cannot store a score like 74.00, so `numeric(5,2)` is
     * used instead.
     */
    overallScore: numeric("overall_score", { precision: 5, scale: 2 }),
    summary: text("summary"),
    ...timestamps,
  },
  (t) => [
    index("performance_reviews_intern_idx").on(t.internId),
    index("performance_reviews_reviewer_idx").on(t.reviewerId),
    index("performance_reviews_period_idx").on(t.periodStart, t.periodEnd),
    check("performance_reviews_period_order", sql`${t.periodStart} <= ${t.periodEnd}`),
  ],
);

export const performanceScores = pgTable(
  "performance_scores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reviewId: uuid("review_id")
      .notNull()
      .references(() => performanceReviews.id, { onDelete: "cascade" }),
    criterionId: uuid("criterion_id")
      .notNull()
      .references(() => performanceCriteria.id, { onDelete: "restrict" }),
    score: integer("score").notNull(),
    comment: text("comment"),
    ...timestamps,
  },
  (t) => [
    index("performance_scores_review_idx").on(t.reviewId),
    index("performance_scores_criterion_idx").on(t.criterionId),
    uniqueIndex("performance_scores_review_criterion_uq").on(t.reviewId, t.criterionId),
    check("performance_scores_range", sql`${t.score} >= 1 AND ${t.score} <= 5`),
  ],
);

export type PerformanceCriterion = typeof performanceCriteria.$inferSelect;
export type NewPerformanceCriterion = typeof performanceCriteria.$inferInsert;
export type PerformanceReview = typeof performanceReviews.$inferSelect;
export type NewPerformanceReview = typeof performanceReviews.$inferInsert;
export type PerformanceScore = typeof performanceScores.$inferSelect;
export type NewPerformanceScore = typeof performanceScores.$inferInsert;
export type ReviewStatus = PerformanceReview["status"];
