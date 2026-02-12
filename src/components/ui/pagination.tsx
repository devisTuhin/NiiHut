import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

/**
 * Pagination — Server-side pagination with page numbers and prev/next.
 * Constructs URLs preserving existing search params.
 */
export function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  searchParams = {},
}: {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  searchParams?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const buildUrl = (page: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    params.set("page", String(page));
    return `${baseUrl}?${params.toString()}`;
  };

  // Show max 5 page numbers at a time
  let startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + 4);
  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  const pages = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  );

  return (
    <nav className="flex items-center justify-center gap-1 mt-8" aria-label="Pagination">
      {/* Previous */}
      {currentPage > 1 ? (
        <Link
          href={buildUrl(currentPage - 1)}
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </Link>
      ) : (
        <span className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-100 text-gray-300 cursor-not-allowed">
          <ChevronLeft className="w-4 h-4" />
        </span>
      )}

      {/* Page numbers */}
      {startPage > 1 && (
        <>
          <Link
            href={buildUrl(1)}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            1
          </Link>
          {startPage > 2 && (
            <span className="flex items-center justify-center w-9 h-9 text-gray-400 text-sm">
              …
            </span>
          )}
        </>
      )}

      {pages.map((page) => (
        <Link
          key={page}
          href={buildUrl(page)}
          className={cn(
            "flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium transition-colors",
            page === currentPage
              ? "bg-gray-900 text-white"
              : "text-gray-600 hover:bg-gray-50"
          )}
          aria-current={page === currentPage ? "page" : undefined}
        >
          {page}
        </Link>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && (
            <span className="flex items-center justify-center w-9 h-9 text-gray-400 text-sm">
              …
            </span>
          )}
          <Link
            href={buildUrl(totalPages)}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {totalPages}
          </Link>
        </>
      )}

      {/* Next */}
      {currentPage < totalPages ? (
        <Link
          href={buildUrl(currentPage + 1)}
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </Link>
      ) : (
        <span className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-100 text-gray-300 cursor-not-allowed">
          <ChevronRight className="w-4 h-4" />
        </span>
      )}
    </nav>
  );
}
