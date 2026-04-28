import { FolderKanban, Tags } from "lucide-react";

import { useCategoriesQuery } from "@entities/category";
import { useRecurringTagsQuery } from "@entities/recurring-tag";
import { CategoryManager } from "@features/categories";
import { RecurringTagManager } from "@features/recurring-tags";
import { formatMoneyCents } from "@shared/lib/money";

function formatCount(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function getRecurringTotal(recurringTags: Array<{ amountCents: number }>) {
  return recurringTags.reduce((total, recurringTag) => total + recurringTag.amountCents, 0);
}

export function CategoriesAndTagsPage() {
  const categoriesQuery = useCategoriesQuery();
  const recurringTagsQuery = useRecurringTagsQuery();
  const categories = categoriesQuery.data ?? [];
  const recurringTags = recurringTagsQuery.data ?? [];

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-8 overflow-x-clip px-4 py-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="mt-1 text-3xl font-semibold tracking-normal">
            Categories & Recurring tags
          </h1>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[34rem]">
          <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FolderKanban aria-hidden="true" className="size-4 text-primary" />
              Categories
            </div>
            <p className="mt-2 text-xl font-semibold">
              {categoriesQuery.isPending
                ? "Loading"
                : formatCount(categories.length, "category", "categories")}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Tags aria-hidden="true" className="size-4 text-primary" />
              Recurring
            </div>
            <p className="mt-2 text-xl font-semibold">
              {recurringTagsQuery.isPending
                ? "Loading"
                : formatCount(recurringTags.length, "recurring tag", "recurring tags")}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Tags aria-hidden="true" className="size-4 text-primary" />
              Shared total
            </div>
            <p className="mt-2 text-xl font-semibold">
              {recurringTagsQuery.isPending
                ? "Loading"
                : formatMoneyCents(getRecurringTotal(recurringTags))}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <CategoryManager />
        <RecurringTagManager />
      </div>
    </main>
  );
}
