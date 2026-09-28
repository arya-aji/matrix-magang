"use client";

import { Plus, SquarePen, Trash } from "lucide-react";
import { useState } from "react";

import { deleteTaskAction } from "@/actions/tasks";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { TaskForm, type TaskFormTask } from "./task-form";

export function CreateTaskDialog({
  interns,
  disabled,
}: {
  interns: { id: string; name: string }[];
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={disabled}>
          <Plus className="size-4" aria-hidden />
          Tugas baru
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buat tugas</DialogTitle>
          <DialogDescription>Buat tugas baru untuk intern Anda.</DialogDescription>
        </DialogHeader>
        <TaskForm interns={interns} />
      </DialogContent>
    </Dialog>
  );
}

export function EditTaskDialog({
  interns,
  task,
}: {
  interns: { id: string; name: string }[];
  task: TaskFormTask;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <SquarePen className="size-4" aria-hidden />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit tugas</DialogTitle>
          <DialogDescription>Perbarui detail tugas.</DialogDescription>
        </DialogHeader>
        <TaskForm
          interns={interns}
          task={task}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export function DeleteTaskButton({ taskId }: { taskId: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash className="size-4" aria-hidden />
          Hapus
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus tugas ini?</AlertDialogTitle>
          <AlertDialogDescription>
            Tindakan ini tidak dapat dibatalkan. Seluruh riwayat tugas juga akan terhapus.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <form action={deleteTaskAction}>
            <input type="hidden" name="taskId" value={taskId} />
            <AlertDialogAction type="submit">Hapus</AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
