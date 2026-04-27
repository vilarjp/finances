import { useId } from "react";

import { cn } from "@shared/lib/utils";

import { useRecurringTagsQuery } from "../api/recurring-tag-queries";

type RecurringTagSelectProps = {
  className?: string;
  disabled?: boolean;
  label?: string;
  onValueChange: (recurringTagId: string) => void;
  value: string;
};

export function RecurringTagSelect({
  className,
  disabled = false,
  label = "Recurring tag",
  onValueChange,
  value,
}: RecurringTagSelectProps) {
  const selectId = useId();
  const recurringTagsQuery = useRecurringTagsQuery();
  const recurringTags = recurringTagsQuery.data ?? [];

  return (
    <label className={cn("grid gap-1 text-sm font-medium", className)} htmlFor={selectId}>
      {label}
      <select
        className="border-input bg-background ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 py-2 text-base outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
        disabled={disabled || recurringTagsQuery.isPending}
        id={selectId}
        onChange={(event) => onValueChange(event.target.value)}
        value={value}
      >
        <option value="">No recurring tag</option>
        {recurringTags.map((recurringTag) => (
          <option key={recurringTag.id} value={recurringTag.id}>
            {recurringTag.name}
          </option>
        ))}
      </select>
    </label>
  );
}
