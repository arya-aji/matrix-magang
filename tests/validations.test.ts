import { describe, expect, it } from "vitest";

import { saveDailyActivitySchema } from "@/lib/validations/activities";
import { createFeedbackSchema } from "@/lib/validations/feedback";
import { createTaskSchema, updateTaskProgressSchema } from "@/lib/validations/tasks";
import { createUserSchema } from "@/lib/validations/users";

const VALID_UUID = "6f9c1e7b-4a6d-4f0c-8e5a-7b9d1f3c5e7a";
const SECOND_UUID = "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d";
const THIRD_UUID = "9f8e7d6c-5b4a-4c3d-8e2f-1a0b9c8d7e6f";

describe("task validation (PRD §47)", () => {
  it("rejects progress outside 0–100", () => {
    expect(
      updateTaskProgressSchema.safeParse({ taskId: VALID_UUID, progress: -1 }).success,
    ).toBe(false);
    expect(
      updateTaskProgressSchema.safeParse({ taskId: VALID_UUID, progress: 101 }).success,
    ).toBe(false);
    expect(
      updateTaskProgressSchema.safeParse({ taskId: VALID_UUID, progress: 0 }).success,
    ).toBe(true);
    expect(
      updateTaskProgressSchema.safeParse({ taskId: VALID_UUID, progress: 100 }).success,
    ).toBe(true);
  });

  it("accepts an explicit status change to COMPLETED", () => {
    expect(
      updateTaskProgressSchema.safeParse({ taskId: VALID_UUID, status: "COMPLETED" }).success,
    ).toBe(true);
  });

  it("rejects a due date before the start date", () => {
    const result = createTaskSchema.safeParse({
      title: "Build Login Page",
      assigneeIds: [VALID_UUID],
      priority: "MEDIUM",
      startDate: "2026-09-10",
      dueDate: "2026-09-01",
    });

    expect(result.success).toBe(false);
  });

  it("requires a title of at most 200 characters", () => {
    expect(
      createTaskSchema.safeParse({
        title: "x".repeat(201),
        assigneeIds: [VALID_UUID],
      }).success,
    ).toBe(false);
    expect(
      createTaskSchema.safeParse({
        title: "x".repeat(200),
        assigneeIds: [VALID_UUID],
      }).success,
    ).toBe(true);
  });

  it("accepts a task worked on by more than one intern", () => {
    const result = createTaskSchema.safeParse({
      title: "API Integration",
      assigneeIds: [VALID_UUID, SECOND_UUID, THIRD_UUID],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.assigneeIds).toHaveLength(3);
    }
  });

  it("requires at least one assignee", () => {
    expect(
      createTaskSchema.safeParse({ title: "Tanpa assignee", assigneeIds: [] }).success,
    ).toBe(false);
    expect(
      createTaskSchema.safeParse({ title: "Tanpa assignee" }).success,
    ).toBe(false);
  });
});

describe("daily activity validation (PRD §47)", () => {
  it("requires a summary of at least 5 characters", () => {
    expect(saveDailyActivitySchema.safeParse({ summary: "abcd" }).success).toBe(false);
    expect(saveDailyActivitySchema.safeParse({ summary: "abcde" }).success).toBe(true);
  });

  it("keeps blocker and next step optional", () => {
    const result = saveDailyActivitySchema.safeParse({ summary: "Mengerjakan login page." });
    expect(result.success).toBe(true);
  });

  it("caps blocker at 2000 characters", () => {
    expect(
      saveDailyActivitySchema.safeParse({
        summary: "Valid summary",
        blocker: "b".repeat(2001),
      }).success,
    ).toBe(false);
  });
});

describe("feedback validation (PRD §47)", () => {
  it("requires content of at least 2 characters", () => {
    expect(
      createFeedbackSchema.safeParse({ internId: VALID_UUID, content: "a" }).success,
    ).toBe(false);
    expect(
      createFeedbackSchema.safeParse({ internId: VALID_UUID, content: "ok" }).success,
    ).toBe(true);
  });
});

describe("user validation", () => {
  it("rejects invalid emails and short passwords", () => {
    expect(
      createUserSchema.safeParse({
        name: "Budi",
        email: "not-an-email",
        password: "Magang3173",
        role: "INTERN",
      }).success,
    ).toBe(false);

    expect(
      createUserSchema.safeParse({
        name: "Budi",
        email: "budi@example.com",
        password: "short",
        role: "INTERN",
      }).success,
    ).toBe(false);
  });
});
