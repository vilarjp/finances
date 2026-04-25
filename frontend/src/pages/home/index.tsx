import { BarChart3, CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@shared/ui/button";

export function HomePage() {
  return (
    <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 md:grid-cols-[1fr_320px]">
      <section className="flex min-h-[420px] flex-col justify-center gap-5">
        <div className="max-w-2xl space-y-4">
          <p className="text-sm font-medium text-primary">Finance workspace</p>
          <h1 className="text-4xl font-semibold tracking-normal text-balance sm:text-5xl">
            Personal Finance
          </h1>
          <p className="max-w-xl text-base leading-7 text-muted-foreground">
            The app shell is ready for authenticated finance workflows, reports, monthly views, and
            record editing.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/sign-up">Create account</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/login">Login</Link>
          </Button>
        </div>
      </section>

      <aside className="grid content-center gap-3">
        <div className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
          <BarChart3 aria-hidden="true" className="mb-6 size-6 text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Next slice</p>
          <p className="mt-2 text-2xl font-semibold">Theme system</p>
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
