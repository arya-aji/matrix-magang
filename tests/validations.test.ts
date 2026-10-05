import { describe, expect, it } from "vitest";

import { isoDateSchema } from "@/lib/validations/common";
import { createEntrySchema } from "@/lib/validations/entries";
import { updateSettingsSchema } from "@/lib/validations/settings";
import { createInternSchema, createUserSchema } from "@/lib/validations/users";

const VALID_UUID = "6f9c1e7b-4a6d-4f0c-8e5a-7b9d1f3c5e7a";

describe("document entry validation", () => {
  it("requires a non-empty name", () => {
    expect(createEntrySchema.safeParse({ name: "   ", kind: "USAHA" }).success).toBe(false);
    expect(createEntrySchema.safeParse({ name: "Toko Maju", kind: "USAHA" }).success).toBe(true);
  });

  it("caps the name at 200 characters", () => {
    expect(createEntrySchema.safeParse({ name: "x".repeat(201), kind: "USAHA" }).success).toBe(
      false,
    );
    expect(createEntrySchema.safeParse({ name: "x".repeat(200), kind: "USAHA" }).success).toBe(
      true,
    );
  });

  it("only accepts USAHA or KELUARGA", () => {
    expect(createEntrySchema.safeParse({ name: "Keluarga A", kind: "KELUARGA" }).success).toBe(
      true,
    );
    expect(createEntrySchema.safeParse({ name: "X", kind: "LAINNYA" }).success).toBe(false);
  });

  it("keeps the note optional and capped at 2000 characters", () => {
    expect(createEntrySchema.safeParse({ name: "Toko A", kind: "USAHA" }).success).toBe(true);
    expect(
      createEntrySchema.safeParse({
        name: "Toko A",
        kind: "USAHA",
        note: "n".repeat(2001),
      }).success,
    ).toBe(false);
  });
});

describe("settings validation", () => {
  it("requires a positive integer target", () => {
    expect(updateSettingsSchema.safeParse({ dailyTarget: 50 }).success).toBe(true);
    expect(updateSettingsSchema.safeParse({ dailyTarget: 0 }).success).toBe(false);
    expect(updateSettingsSchema.safeParse({ dailyTarget: -3 }).success).toBe(false);
    expect(updateSettingsSchema.safeParse({ dailyTarget: 1.5 }).success).toBe(false);
    expect(updateSettingsSchema.safeParse({ dailyTarget: 10_001 }).success).toBe(false);
  });
});

describe("date validation", () => {
  it("accepts YYYY-MM-DD and rejects other shapes", () => {
    expect(isoDateSchema.safeParse("2026-09-28").success).toBe(true);
    expect(isoDateSchema.safeParse("28-09-2026").success).toBe(false);
    expect(isoDateSchema.safeParse("2026-9-8").success).toBe(false);
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

  it("only allows ADMIN and INTERN roles", () => {
    expect(
      createUserSchema.safeParse({
        name: "Budi",
        email: "budi@example.com",
        password: "Magang3173",
        role: "ADMIN",
      }).success,
    ).toBe(true);

    expect(
      createUserSchema.safeParse({
        name: "Budi",
        email: "budi@example.com",
        password: "Magang3173",
        role: "MENTOR",
      }).success,
    ).toBe(false);
  });

  it("creates an internship without a mentor field", () => {
    const result = createInternSchema.safeParse({
      userId: VALID_UUID,
      departmentId: null,
      startDate: "2026-09-01",
      endDate: "2026-12-01",
      status: "ACTIVE",
    });

    expect(result.success).toBe(true);
  });
});
