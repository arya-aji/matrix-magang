import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActivityCard } from "@/components/activities/activity-card";
import { FeedbackForm } from "@/components/feedback/feedback-form";
import { FeedbackList } from "@/components/feedback/feedback-list";
import { ProgressBar } from "@/components/shared/progress-bar";
import { ReviewStatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { TaskCardList } from "@/components/tasks/task-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calculateInternshipProgress, formatDate } from "@/lib/date";
import { requireAuth } from "@/server/auth/session";
import { guard } from "@/server/permissions/guard";
import { getActivitiesForIntern } from "@/server/queries/activities";
import { getInternDetail } from "@/server/queries/interns";
import { getReviewsForIntern } from "@/server/queries/performance";
import { getTasksForUser } from "@/server/queries/tasks";
import { db } from "@/db";
import { feedback as feedbackTable, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export default async function InternDetailPage({
  params,
}: {
  params: Promise<{ internId: string }>;
}) {
  const user = await requireAuth();
  const { internId } = await params;

  const intern = await guard(() => getInternDetail(user, internId));
  if (!intern) notFound();

  const [tasksResult, activities, reviews, internFeedback] = await Promise.all([
    guard(() => getTasksForUser(user, { assigneeId: internId, pageSize: 50 })),
    getActivitiesForIntern(user, internId, 1, 10),
    getReviewsForIntern(internId),
    db
      .select({
        id: feedbackTable.id,
        content: feedbackTable.content,
        createdAt: feedbackTable.createdAt,
        authorName: users.name,
        authorRole: users.role,
      })
      .from(feedbackTable)
      .innerJoin(users, eq(feedbackTable.authorId, users.id))
      .where(eq(feedbackTable.internId, internId))
      .orderBy(desc(feedbackTable.createdAt))
      .limit(20),
  ]);

  const progress = calculateInternshipProgress({
    startDate: intern.startDate,
    endDate: intern.endDate,
    status: intern.internshipStatus,
  });

  const canFeedback = user.role === "ADMIN" || user.role === "MENTOR";

  return (
    <div className="flex flex-col gap-5">
      <Button variant="ghost" size="sm" asChild className="-ml-2 self-start">
        <Link href="/interns">
          <ArrowLeft className="size-4" aria-hidden />
          Kembali
        </Link>
      </Button>

      <header className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight">{intern.name}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>{intern.departmentName ?? "Tanpa departemen"}</span>
          <span aria-hidden>·</span>
          <span>Mentor: {intern.mentorName ?? "-"}</span>
          {!intern.isActive ? <Badge variant="destructive">Tidak aktif</Badge> : null}
        </div>
        <ProgressBar
          value={progress.progressPercentage}
          label={`Hari ${progress.currentDay} / ${progress.totalDays}`}
        />
      </header>

      <Tabs defaultValue="tasks">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="flex flex-col gap-3">
          {tasksResult.items.length === 0 ? (
            <EmptyState title="Belum ada tugas" description="Intern ini belum memiliki tugas." />
          ) : (
            <TaskCardList tasks={tasksResult.items} showAssignees={false} />
          )}
        </TabsContent>

        <TabsContent value="activity" className="flex flex-col gap-3">
          {activities.items.length === 0 ? (
            <EmptyState
              title="Belum ada aktivitas"
              description="Intern ini belum mengirim aktivitas harian."
            />
          ) : (
            activities.items.map((activity) => (
              <Link key={activity.id} href={`/activity/${activity.id}`}>
                <ActivityCard activity={activity} />
              </Link>
            ))
          )}
        </TabsContent>

        <TabsContent value="performance" className="flex flex-col gap-3">
          {reviews.length === 0 ? (
            <EmptyState
              title="Belum ada review"
              description="Belum ada penilaian performa untuk intern ini."
            />
          ) : (
            reviews.map((review) => (
              <Link key={review.id} href={`/performance/${review.id}`}>
                <Card className="py-3">
                  <CardContent className="flex items-center justify-between gap-2 px-4">
                    <div>
                      <p className="text-sm">
                        {formatDate(review.periodStart)} – {formatDate(review.periodEnd)}
                      </p>
                      <p className="text-xs text-muted-foreground">oleh {review.reviewerName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium tabular-nums">
                        {review.overallScore ?? "-"}
                      </span>
                      <ReviewStatusBadge status={review.status} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </TabsContent>

        <TabsContent value="feedback" className="flex flex-col gap-3">
          <FeedbackList entries={internFeedback} />
          {canFeedback ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Beri feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <FeedbackForm internId={internId} />
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
