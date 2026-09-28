import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FinalizeReviewForm } from "@/components/performance/finalize-review-form";
import { ScoreForm } from "@/components/performance/score-form";
import { ReviewStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/date";
import type { SessionUser } from "@/types";
import { requireAuth } from "@/server/auth/session";
import { AuthorizationError, isMentorOf } from "@/server/permissions";
import { guard } from "@/server/permissions/guard";
import { getCriteria, getReviewWithScores } from "@/server/queries/performance";

async function loadReview(user: SessionUser, reviewId: string) {
  const result = await getReviewWithScores(reviewId);
  if (!result) return null;

  const { review } = result;

  if (user.role === "ADMIN") return result;

  if (user.role === "MENTOR") {
    if (review.reviewerId === user.id) return result;
    const assigned = await isMentorOf(user.id, review.internId);
    if (assigned) return result;
    throw new AuthorizationError();
  }

  if (review.internId !== user.id) throw new AuthorizationError();
  return result;
}

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ reviewId: string }>;
}) {
  const user = await requireAuth();
  const { reviewId } = await params;

  const data = await guard(() => loadReview(user, reviewId));
  if (!data) notFound();

  const { review, scores } = data;
  const criteria = await getCriteria(false);

  const canEdit = review.status === "DRAFT" && (user.role === "ADMIN" || review.reviewerId === user.id);
  const scoreByCriterion = new Map(scores.map((score) => [score.criterionId, score]));

  return (
    <div className="flex flex-col gap-5">
      <Button variant="ghost" size="sm" asChild className="-ml-2 self-start">
        <Link href="/performance">
          <ArrowLeft className="size-4" aria-hidden />
          Kembali
        </Link>
      </Button>

      <header className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight">{review.internName}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {formatDate(review.periodStart)} – {formatDate(review.periodEnd)}
          </p>
          <ReviewStatusBadge status={review.status} />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-semibold tabular-nums">
            {review.overallScore ?? "-"}
          </span>
          <span className="text-sm text-muted-foreground">/ 100</span>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Penilaian per kriteria</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {criteria.map((criterion) => {
            const existing = scoreByCriterion.get(criterion.id);

            return (
              <ScoreForm
                key={criterion.id}
                reviewId={review.id}
                criterionId={criterion.id}
                criterionName={criterion.name}
                criterionWeight={criterion.weight}
                score={existing?.score ?? null}
                comment={existing?.comment ?? null}
                disabled={!canEdit}
              />
            );
          })}
        </CardContent>
      </Card>

      {canEdit ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Finalisasi</CardTitle>
          </CardHeader>
          <CardContent>
            <FinalizeReviewForm reviewId={review.id} summary={review.summary} />
          </CardContent>
        </Card>
      ) : review.summary ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ringkasan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{review.summary}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
