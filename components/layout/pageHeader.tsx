import { type ReactNode } from "react";

/**
 * The one page heading in the app. Title 18/800, one line of context under it,
 * actions on the right — the hierarchy the dashboard itself uses.
 */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[18px] leading-tight font-extrabold tracking-[-0.4px]">
          {title}
        </h1>
        {description ? (
          <p className="text-muted-foreground mt-1 text-[11px] font-medium">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
