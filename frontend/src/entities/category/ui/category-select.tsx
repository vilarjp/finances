import { useId } from "react";

import { cn } from "@shared/lib/utils";

import { useCategoriesQuery } from "../api/category-queries";

type CategorySelectProps = {
  className?: string;
  disabled?: boolean;
  label?: string;
  onValueChange: (categoryId: string) => void;
  value: string;
};

export function CategorySelect({
  className,
  disabled = false,
  label = "Category",
  onValueChange,
  value,
}: CategorySelectProps) {
  const selectId = useId();
  const categoriesQuery = useCategoriesQuery();
  const categories = categoriesQuery.data ?? [];

  return (
    <label className={cn("grid gap-1 text-sm font-medium", className)} htmlFor={selectId}>
      {label}
      <select
        className="border-input bg-background ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 py-2 text-base outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
        disabled={disabled || categoriesQuery.isPending}
        id={selectId}
        onChange={(event) => onValueChange(event.target.value)}
        value={value}
      >
        <option value="">Uncategorized</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
    </label>
  );
}
