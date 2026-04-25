import { Link } from "react-router-dom";

import { Button } from "@shared/ui/button";

export function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center gap-6 px-4 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-normal">Page not found</h1>
        <p className="text-muted-foreground">This route is not part of the finance workspace.</p>
      </div>
      <Button asChild>
        <Link to="/">Go home</Link>
      </Button>
    </main>
  );
}
