"use client";

import { Funnel } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
} from "@/lib/constants";

const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export type TaskFilterValues = {
  q?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  dueBefore?: string;
};

function FilterFields({
  interns,
  current,
  showAssignees,
}: {
  interns: { id: string; name: string }[];
  current: TaskFilterValues;
  showAssignees: boolean;
}) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="filter-q">Cari judul</Label>
        <Input
          id="filter-q"
          name="q"
          defaultValue={current.q ?? ""}
          placeholder="Cari tugas..."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="filter-status">Status</Label>
          <select id="filter-status" name="status" defaultValue={current.status ?? ""} className={selectClass}>
            <option value="">Semua</option>
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {TASK_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="filter-priority">Prioritas</Label>
          <select
            id="filter-priority"
            name="priority"
            defaultValue={current.priority ?? ""}
            className={selectClass}
          >
            <option value="">Semua</option>
            {TASK_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {TASK_PRIORITY_LABELS[priority]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showAssignees ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="filter-assignee">Assignee</Label>
          <select
            id="filter-assignee"
            name="assigneeId"
            defaultValue={current.assigneeId ?? ""}
            className={selectClass}
          >
            <option value="">Semua assignee</option>
            {interns.map((intern) => (
              <option key={intern.id} value={intern.id}>
                {intern.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="filter-due">Tenggat sebelum</Label>
        <Input
          id="filter-due"
          name="dueBefore"
          type="date"
          defaultValue={current.dueBefore ?? ""}
        />
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" size="sm">
          Terapkan
        </Button>
        <Button type="button" variant="ghost" size="sm" asChild>
          <Link href="/tasks">Reset</Link>
        </Button>
      </div>
    </>
  );
}

/** Server-driven GET form: works without client JS, opens in a Sheet on mobile. */
export function TaskFilters({
  interns,
  current,
  showAssignees,
}: {
  interns: { id: string; name: string }[];
  current: TaskFilterValues;
  showAssignees: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <form
        method="get"
        action="/tasks"
        className="hidden items-end gap-2 rounded-lg border border-border p-3 md:flex md:flex-wrap"
      >
        <div className="min-w-40 flex-1">
          <FilterFields interns={interns} current={current} showAssignees={showAssignees} />
        </div>
      </form>

      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <Funnel className="size-4" aria-hidden />
              Filter & pencarian
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>Filter tugas</SheetTitle>
            </SheetHeader>
            <form method="get" action="/tasks" className="flex flex-col gap-3">
              <FilterFields interns={interns} current={current} showAssignees={showAssignees} />
            </form>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

