import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  buildHref: (page: number) => string;
}

export function Pagination({ page, pageSize, totalCount, buildHref }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  if (totalPages <= 1) return null;

  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  return (
    <nav
      aria-label="Pagination"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 16,
        fontSize: 13,
      }}
    >
      <span style={{ color: "var(--color-neutral-700)" }}>
        Showing {from}–{to} of {totalCount}
      </span>
      <div style={{ display: "flex", gap: 8 }}>
        {page > 1 ? (
          <Link href={buildHref(page - 1)} className="btn btn-secondary">
            <ChevronLeft width={16} height={16} aria-hidden="true" /> Prev
          </Link>
        ) : (
          <span className="btn btn-secondary" aria-disabled="true" style={{ opacity: 0.45, pointerEvents: "none" }}>
            <ChevronLeft width={16} height={16} aria-hidden="true" /> Prev
          </span>
        )}
        {page < totalPages ? (
          <Link href={buildHref(page + 1)} className="btn btn-secondary">
            Next <ChevronRight width={16} height={16} aria-hidden="true" />
          </Link>
        ) : (
          <span className="btn btn-secondary" aria-disabled="true" style={{ opacity: 0.45, pointerEvents: "none" }}>
            Next <ChevronRight width={16} height={16} aria-hidden="true" />
          </span>
        )}
      </div>
    </nav>
  );
}
