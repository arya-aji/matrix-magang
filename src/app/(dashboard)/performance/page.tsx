import { Star } from "lucide-react";
import Link from "next/link";

import { CreateReviewDialog } from "@/components/performance/create-review-dialog";
import { Collapsible } from "@/components/shared/collapsible";
import { EmptyState } from "@/components/shared/empty-state";
import { ListCard, ListRow, ListRowMain } from "@/components/shared/list";
import { PageHeader } from "@/components/layout/page-header";
import { ReviewStatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, getMonthBounds, getTodayJakarta } from "@/lib/date";
import { requireAuth } from "@/server/auth/session";
import {
  getAllReviews,
  getLatestReviewForIntern,
  getReviewsByMentor,
  getReviewsForIntern,
} from "@/server/queries/performance";
import { getAssignableInterns } from "@/server/queries/tasks";

export default async function PerformancePage() {
  const user = await requireAuth();
  const bounds = getMonthBounds(getTodayJakarta());

  if (user.role === "INTERN") {
    const [reviews, latest] = await Promise.all([
      getReviewsForIntern(user.id),
      getLatestReviewForIntern(user.id),
    ]);

    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Performance" description="Riwayat penilaian performa Anda." />

        {latest ? (
          <Card>
            <CardContent className="flex flex-col gap-3 pt-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">
                    Periode {formatDate(latest.review.periodStart)} –{" "}
                    {formatDate(latest.review.periodEnd)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Reviewer: {latest.review.reviewerName}
                  </p>
                </div>
                <ReviewStatusBadge status={latest.review.status} />
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-semibold tabular-nums">
                  {latest.review.overallScore ?? "-"}
                </span>
                <span className="text-sm text-muted-foreground">/ 100</span>
              </div>

              <ul className="flex flex-col divide-y divide-border">
                {latest.scores.map((score) => (
                  <li key={score.id} className="flex items-center justify-between gap-2 py-2">
                    <div className="min-w-0">
                      <p className="text-sm">{score.criterionName}</p>
                      {score.comment ? (
                        <p className="text-xs text-muted-foreground">{score.comment}</p>
                      ) : null}
                    </div>
                    <span className="text-sm font-medium tabular-nums">{score.score} / 5</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            title="Belum ada penilaian"
            description="Mentor Anda belum membuat review performa untuk periode ini."
            icon={<Star className="size-5" aria-hidden />}
          />
        )}

        {reviews.length > 0 ? (
          <Collapsible summary={`Riwayat review (${reviews.length})`}>
            <div className="flex flex-col">
              {reviews.map((review) => (
                <ListRow key={review.id}>
                  <ListRowMain
                    title={
                      <Link href={`/performance/${review.id}`} className="hover:underline">
                        {formatDate(review.periodStart)} – {formatDate(review.periodEnd)}
                      </Link>
                    }
                    meta={`oleh ${review.reviewerName}`}
                  />
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-medium tabular-nums">
                      {review.overallScore ?? "-"}
                    </span>
                    <ReviewStatusBadge status={review.status} />
                  </span>
                </ListRow>
              ))}
            </div>
          </Collapsible>
        ) : null}
      </div>
    );
  }

  const isAdmin = user.role === "ADMIN";
  const [reviews, interns] = await Promise.all([
    isAdmin ? getAllReviews() : getReviewsByMentor(user.id),
    isAdmin ? Promise.resolve([]) : getAssignableInterns(user),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Performance"
        description={
          isAdmin
            ? "Seluruh review performa intern."
            : "Review performa untuk intern bimbingan Anda."
        }
        actions={
          isAdmin ? null : (
            <CreateReviewDialog
              interns={interns}
              defaultPeriodStart={bounds.start}
              defaultPeriodEnd={bounds.end}
              disabled={interns.length === 0}
            />
          )
        }
      />

      {reviews.length === 0 ? (
        <EmptyState
          title="Belum ada review"
          description="Buat review performa untuk memulai penilaian."
          icon={<Star className="size-5" aria-hidden />}
        />
      ) : (
        <ListCard>
          {reviews.map((review) => (
            <ListRow key={review.id}>
              <ListRowMain
                title={
                  <Link href={`/performance/${review.id}`} className="hover:underline">
                    {review.internName}
                  </Link>
                }
                meta={`${formatDate(review.periodStart)} – ${formatDate(review.periodEnd)}`}
              />
              <span className="flex shrink-0 items-center gap-2">
                <span className="text-sm font-medium tabular-nums">
                  {review.overallScore ?? "-"}
                </span>
                <ReviewStatusBadge status={review.status} />
              </span>
            </ListRow>
          ))}
        </ListCard>
      )}
    </div>
  );
}
