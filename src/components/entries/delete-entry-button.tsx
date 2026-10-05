"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";

import { deleteEntryAction } from "@/actions/entries";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { idleFormState } from "@/lib/form-state";

export function DeleteEntryButton({ entryId }: { entryId: string }) {
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    setPending(true);
    try {
      const formData = new FormData();
      formData.set("entryId", entryId);
      const result = await deleteEntryAction(idleFormState, formData);
      if (result.ok) {
        toast.success("Entri dihapus.");
      } else {
        toast.error(result.error ?? "Gagal menghapus entri.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleDelete}
      disabled={pending}
      aria-label="Hapus entri"
    >
      <Trash2 className="size-4" aria-hidden />
    </Button>
  );
}
