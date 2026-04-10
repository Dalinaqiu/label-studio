import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/utils";
import { Typography } from "../typography/typography";

export type StatCardProps = {
  title: ReactNode;
  value: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

export function StatCard({ title, value, description, icon, className, ...rest }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-large border border-neutral-border bg-neutral-background p-5 shadow-[0_4px_12px_rgba(15,23,42,0.04)]",
        className,
      )}
      {...rest}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Typography variant="label" size="small" className="text-neutral-content-subtler">
            {title}
          </Typography>
          <Typography variant="display" size="small" className="mt-2 text-neutral-content">
            {value}
          </Typography>
          {description ? (
            <Typography variant="body" size="small" className="mt-2 text-neutral-content-subtler">
              {description}
            </Typography>
          ) : null}
        </div>
        {icon ? (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-emphasis-subtle text-primary-icon">
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  );
}
