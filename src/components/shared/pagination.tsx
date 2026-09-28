import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

function buildHref(basePath: string, params: Record<string, string | undefined>, page: number) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value && key !== "page") search.set(key, value);
  }

  if (page > 1) search.set("page", String(page));

  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function Pagination({
  page,
  totalPages,
  basePath,
  params = {},
}: {
  page: number;
  totalPages: number;
  basePath: string;
  params?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Navigasi halaman"
      className="flex items-center justify-between gap-2 pt-2"
    >
      <Button variant="outline" size="sm" asChild disabled={page <= 1}>
        <Link
          href={buildHref(basePath, params, Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
        >
          <ChevronLeft className="size-4" aria-hidden />
          Sebelumnya
        </Link>
      </Button>

      <span className="text-xs text-muted-foreground">
        Halaman {page} dari {totalPages}
      </span>

      <Button variant="outline" size="sm" asChild disabled={page >= totalPages}>
        <Link
          href={buildHref(basePath, params, Math.min(totalPages, page + 1))}
          aria-disabled={page >= totalPages}
          className={page >= totalPages ? "pointer-events-none opacity-50" : undefined}
        >
          Berikutnya
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      </Button>
    </nav>
  );
}
