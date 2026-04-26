import { BarChart3, CalendarDays } from "lucide-react";

import { CategoryManager } from "@features/categories";

export function HomePage() {
  return (
    <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="flex min-h-[420px] flex-col justify-center gap-5">
        <div className="max-w-2xl space-y-4">
          <p className="text-sm font-medium text-primary">Finance workspace</p>
          <h1 className="text-4xl font-semibold tracking-normal text-balance sm:text-5xl">
            Personal Finance
          </h1>
          <p className="max-w-xl text-base leading-7 text-muted-foreground">
            The app shell is ready for category-aware records, reports, monthly views, and record
            editing.
          </p>
        </div>
      </section>

      <aside className="grid content-start gap-3">
        <CategoryManager />
        <div className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
          <BarChart3 aria-hidden="true" className="mb-6 size-6 text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Next slice</p>
          <p className="mt-2 text-2xl font-semibold">Recurring tags</p>
        </div>
        <div className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
          <CalendarDays aria-hidden="true" className="mb-6 size-6 text-accent-foreground" />
          <p className="text-sm font-medium text-muted-foreground">Routes</p>
          <p className="mt-2 text-2xl font-semibold">Home and monthly</p>
        </div>
      </aside>
    </main>
  );
}
