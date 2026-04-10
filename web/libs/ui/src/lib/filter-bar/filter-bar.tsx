import type { ChangeEvent, HTMLAttributes, ReactNode } from "react";
import { IconSearch } from "@humansignal/icons";
import { cn } from "../../utils/utils";
import { Button } from "../button/button";

export type FilterBarViewOption = {
  value: string;
  label: string;
};

export type FilterBarProps = {
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  filters?: ReactNode;
  actions?: ReactNode;
  viewOptions?: FilterBarViewOption[];
  viewValue?: string;
  onViewChange?: (value: string) => void;
} & HTMLAttributes<HTMLDivElement>;

export function FilterBar({
  searchValue = "",
  searchPlaceholder = "搜索",
  onSearchChange,
  filters,
  actions,
  viewOptions,
  viewValue,
  onViewChange,
  className,
  ...rest
}: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-large border border-neutral-border bg-neutral-background px-4 py-4",
        "xl:flex-row xl:items-center xl:justify-between",
        className,
      )}
      {...rest}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-4 lg:flex-row lg:items-center">
        <label className="flex min-w-0 flex-1 items-center gap-3 rounded-medium border border-neutral-border bg-neutral-surface px-3 py-2">
          <IconSearch className="h-4 w-4 shrink-0 text-neutral-content-subtler" />
          <input
            type="search"
            name="page_search"
            value={searchValue}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onSearchChange?.(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            autoComplete="off"
            className="w-full border-0 bg-transparent text-sm text-neutral-content outline-none placeholder:text-neutral-content-subtler"
          />
        </label>
        {filters ? <div className="flex flex-wrap items-center gap-3">{filters}</div> : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {viewOptions?.length ? (
          <div className="flex items-center gap-2 rounded-medium border border-neutral-border bg-neutral-surface p-1">
            {viewOptions.map((option) => (
              <Button
                key={option.value}
                size="small"
                variant={viewValue === option.value ? "primary" : "neutral"}
                look={viewValue === option.value ? "filled" : "string"}
                onClick={() => onViewChange?.(option.value)}
                aria-label={option.label}
              >
                {option.label}
              </Button>
            ))}
          </div>
        ) : null}
        {actions}
      </div>
    </div>
  );
}
