import { CalendarDays } from "lucide-react";
import { useState } from "react";

import { CategoryManager } from "@features/categories";
import {
  RecurringTagValueEditor,
  type RecurringTagValueEditorValue,
} from "@features/recurring-tags";
import { RecordWorkspace } from "@features/records";

export function HomePage() {
  const [recurringTagValue, setRecurringTagValue] = useState<RecurringTagValueEditorValue>({
    amountCents: 0,
    recurringValueTagId: "",
  });

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <h1 className="sr-only">Personal Finance</h1>
      <RecordWorkspace />

      <aside className="grid content-start gap-3">
        <CategoryManager />
        <RecurringTagValueEditor onValueChange={setRecurringTagValue} value={recurringTagValue} />
        <div className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
          <CalendarDays aria-hidden="true" className="mb-6 size-6 text-accent-foreground" />
          <p className="text-sm font-medium text-muted-foreground">Next slice</p>
          <p className="mt-2 text-2xl font-semibold">Reports</p>
        </div>
      </aside>
    </main>
  );
}
