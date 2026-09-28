import { Badge, type BadgeProps } from "@/components/ui/badge";
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  ACTIVITY_STATUS_LABELS,
  INTERNSHIP_STATUS_LABELS,
  REVIEW_STATUS_LABELS,
} from "@/lib/constants";
import type {
  DailyActivityStatus,
  InternshipStatus,
  ReviewStatus,
  TaskPriority,
  TaskStatus,
} from "@/db/schema";

/**
 * Status is always communicated with a text label as well as colour
 * (PRD §60 accessibility requirement).
 */

const taskStatusVariant: Record<TaskStatus, BadgeProps["variant"]> = {
  TODO: "secondary",
  IN_PROGRESS: "default",
  BLOCKED: "destructive",
  REVIEW: "outline",
  COMPLETED: "secondary",
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge variant={taskStatusVariant[status]}>{TASK_STATUS_LABELS[status]}</Badge>;
}

const priorityVariant: Record<TaskPriority, BadgeProps["variant"]> = {
  LOW: "outline",
  MEDIUM: "secondary",
  HIGH: "destructive",
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <Badge variant={priorityVariant[priority]}>
      Prioritas {TASK_PRIORITY_LABELS[priority]}
    </Badge>
  );
}

export function ActivityStatusBadge({ status }: { status: DailyActivityStatus }) {
  return (
    <Badge variant={status === "SUBMITTED" ? "default" : "secondary"}>
      {ACTIVITY_STATUS_LABELS[status]}
    </Badge>
  );
}

export function InternshipStatusBadge({ status }: { status: InternshipStatus }) {
  return (
    <Badge variant={status === "ACTIVE" ? "default" : "secondary"}>
      {INTERNSHIP_STATUS_LABELS[status]}
    </Badge>
  );
}

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  return (
    <Badge variant={status === "FINAL" ? "default" : "secondary"}>
      {REVIEW_STATUS_LABELS[status]}
    </Badge>
  );
}

export function OverdueBadge() {
  return <Badge variant="destructive">Terlambat</Badge>;
}
