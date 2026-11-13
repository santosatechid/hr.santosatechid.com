import { type ReactNode } from "react";

import { cn } from "@/lib/shadcn/utils";

/**
 * The one page heading in the app. Title 18/800, one line of context under it,
 * actions on the right — the hierarchy the dashboard itself uses.
 */
export function PageHeader({
  title,
  description,
  actions,
  emphasis = false,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** H1 lebih besar untuk halaman daftar utama (DESIGN.md §11). */
  emphasis?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1
          className={cn(
            "leading-tight font-extrabold",
            emphasis
              ? "text-[21px] tracking-[-0.7px]"
              : "text-[18px] tracking-[-0.4px]",
          )}
        >
          {title}
        </h1>
        {description ? (
          <p
            className={cn(
              "text-muted-foreground mt-1 font-medium",
              emphasis ? "text-[12px]" : "text-[11px]",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
