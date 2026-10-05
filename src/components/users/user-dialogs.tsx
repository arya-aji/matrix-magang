"use client";

import { KeyRound, Plus, SquarePen } from "lucide-react";
import { useState } from "react";

import { createUserAction, resetPasswordAction, updateUserAction } from "@/actions/users";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { idleFormState, type FormState } from "@/lib/form-state";
import type { UserRole } from "@/db/schema";

const ROLE_OPTIONS: UserRole[] = ["ADMIN", "INTERN"];

export type EditableUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  avatarUrl: string | null;
};

function RoleField({
  role,
  onRoleChange,
}: {
  role: UserRole;
  onRoleChange: (value: UserRole) => void;
}) {
  return (
    <>
      <input type="hidden" name="role" value={role} />
      <Select value={role} onValueChange={(value) => onRoleChange(value as UserRole)}>
        <SelectTrigger id="user-role" aria-label="Pilih role">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ROLE_OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}

export function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<UserRole>("INTERN");
  const [state, setState] = useState<FormState>(idleFormState);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      const result = await createUserAction(idleFormState, formData);
      setState(result);
      if (result.ok) {
        toast.success("User dibuat.");
        setOpen(false);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" aria-hidden />
          User baru
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>User baru</DialogTitle>
          <DialogDescription>Buat akun untuk admin atau intern.</DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="flex flex-col gap-4" noValidate>
          {state.error ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="user-name">Nama</Label>
            <Input id="user-name" name="name" required maxLength={120} />
            <FieldError message={state.fieldErrors?.name?.[0]} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="user-email">Email</Label>
            <Input id="user-email" name="email" type="email" required maxLength={255} />
            <FieldError message={state.fieldErrors?.email?.[0]} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="user-password">Password</Label>
            <Input
              id="user-password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
            <FieldError message={state.fieldErrors?.password?.[0]} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="user-role">Role</Label>
            <RoleField role={role} onRoleChange={setRole} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditUserDialog({ user }: { user: EditableUser }) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<UserRole>(user.role);
  const [state, setState] = useState<FormState>(idleFormState);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      const result = await updateUserAction(idleFormState, formData);
      setState(result);
      if (result.ok) {
        toast.success("User diperbarui.");
        setOpen(false);
      }
    } finally {
      setPending(false);
    }
  }

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
          <DialogTitle>Edit user</DialogTitle>
          <DialogDescription>Perbarui data akun.</DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="flex flex-col gap-4" noValidate>
          <input type="hidden" name="userId" value={user.id} />

          {state.error ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-user-name">Nama</Label>
            <Input id="edit-user-name" name="name" required defaultValue={user.name} />
            <FieldError message={state.fieldErrors?.name?.[0]} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-user-email">Email</Label>
            <Input
              id="edit-user-email"
              name="email"
              type="email"
              required
              defaultValue={user.email}
            />
            <FieldError message={state.fieldErrors?.email?.[0]} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="user-role">Role</Label>
            <RoleField role={role} onRoleChange={setRole} />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="edit-user-active"
              name="isActive"
              value="true"
              defaultChecked={user.isActive}
            />
            <Label htmlFor="edit-user-active" className="font-normal">
              Akun aktif
            </Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ResetPasswordDialog({ userId, userName }: { userId: string; userName: string }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<FormState>(idleFormState);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      const result = await resetPasswordAction(idleFormState, formData);
      setState(result);
      if (result.ok) {
        toast.success("Password direset.");
        setOpen(false);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <KeyRound className="size-4" aria-hidden />
          Reset password
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>Buat password baru untuk {userName}.</DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="flex flex-col gap-4" noValidate>
          <input type="hidden" name="userId" value={userId} />

          {state.error ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="reset-password">Password baru</Label>
            <Input
              id="reset-password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
            <FieldError message={state.fieldErrors?.password?.[0]} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Menyimpan..." : "Reset"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
