import { Link } from "react-router-dom";

import { Button } from "@shared/ui/button";

export function LoginPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center gap-6 px-4 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-normal">Login</h1>
        <p className="text-muted-foreground">Authentication screens land in the auth slice.</p>
      </div>
      <Button asChild variant="secondary">
        <Link to="/">Back home</Link>
      </Button>
    </main>
  );
}
