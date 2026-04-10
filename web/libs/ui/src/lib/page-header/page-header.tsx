import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/utils";
import { Typography } from "../typography/typography";

export type PageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
} & HTMLAttributes<HTMLElement>;

export function PageHeader({ title, description, meta, actions, className, ...rest }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 rounded-large border border-neutral-border bg-neutral-background px-6 py-5",
        "md:flex-row md:items-start md:justify-between",
        className,
      )}
      {...rest}
    >
      <div className="min-w-0 flex-1">
        {meta ? <div className="mb-2 text-sm text-neutral-content-subtler">{meta}</div> : null}
        <Typography variant="display" size="small" className="text-neutral-content">
          {title}
        </Typography>
        {description ? (
          <Typography variant="body" size="small" className="mt-2 max-w-3xl text-neutral-content-subtler">
            {description}
          </Typography>
        ) : null}
      </div>

      {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
    </header>
  );
}
