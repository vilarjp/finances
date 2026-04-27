import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";

import type { FinanceRecord } from "@entities/record";
import { clearApiSession } from "@shared/api/http-client";

import { RecordClipboardProvider } from "./record-clipboard";
import { recordClipboardStorageKey, useRecordClipboard } from "./record-clipboard-context";

const record: FinanceRecord = {
  id: "record-coffee",
  effectiveAt: "2026-04-26T12:00:00.000Z",
  financeDate: "2026-04-26",
  financeMonth: "2026-04",
  type: "expense",
  expenseKind: "daily",
  description: "Coffee",
  fontColor: "#111827",
  backgroundColor: "#DBEAFE",
  values: [
    {
      id: "value-latte",
      label: "Latte",
      amountCents: 1890,
      sortOrder: 0,
      createdAt: "2026-04-26T12:00:00.000Z",
      updatedAt: "2026-04-26T12:00:00.000Z",
    },
  ],
  totalAmountCents: 1890,
  createdAt: "2026-04-26T12:00:00.000Z",
  updatedAt: "2026-04-26T12:00:00.000Z",
};

function ClipboardConsumer() {
  const { copiedRecord, copyRecord } = useRecordClipboard();

  return (
    <div>
      <p>{copiedRecord?.sourceSnapshot.description ?? "Empty clipboard"}</p>
      <button onClick={() => copyRecord(record)} type="button">
        Copy record
      </button>
    </div>
  );
}

function ClipboardHarness({ userId }: { userId: string }) {
  return (
    <RecordClipboardProvider key={userId} userId={userId}>
      <ClipboardConsumer />
    </RecordClipboardProvider>
  );
}

afterEach(() => {
  window.sessionStorage.clear();
});

it("scopes copied records to the signed-in user", async () => {
  const user = userEvent.setup();
  const { rerender } = render(<ClipboardHarness userId="user-a" />);

  await user.click(screen.getByRole("button", { name: "Copy record" }));

  expect(screen.getByText("Coffee")).toBeInTheDocument();
  expect(window.sessionStorage.getItem(recordClipboardStorageKey)).toContain("user-a");

  rerender(<ClipboardHarness userId="user-b" />);

  expect(screen.getByText("Empty clipboard")).toBeInTheDocument();
  expect(window.sessionStorage.getItem(recordClipboardStorageKey)).toBeNull();
});

it("clears copied records when the API session is cleared", async () => {
  const user = userEvent.setup();

  render(<ClipboardHarness userId="user-a" />);

  await user.click(screen.getByRole("button", { name: "Copy record" }));

  expect(screen.getByText("Coffee")).toBeInTheDocument();

  act(() => {
    clearApiSession({ broadcast: false });
  });

  expect(screen.getByText("Empty clipboard")).toBeInTheDocument();
  expect(window.sessionStorage.getItem(recordClipboardStorageKey)).toBeNull();
});
