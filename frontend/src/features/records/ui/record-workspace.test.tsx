import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router-dom";

import { server } from "@shared/testing/test-server";

import { RecordClipboardProvider } from "../model/record-clipboard";
import { RecordWorkspace } from "./record-workspace";

type TestRecordValue = {
  id: string;
  label: string;
  amountCents: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  categoryId?: string;
  recurringValueTagId?: string;
};

type TestRecord = {
  id: string;
  effectiveAt: string;
  financeDate: string;
  financeMonth: string;
  type: "income" | "expense";
  expenseKind: "fixed" | "daily" | null;
  description: string;
  fontColor: string;
  backgroundColor: string;
  values: TestRecordValue[];
  totalAmountCents: number;
  createdAt: string;
  updatedAt: string;
};

type RecordPayloadValue = {
  label: string;
  amountCents: number;
  sortOrder: number;
  categoryId?: string;
  recurringValueTagId?: string;
};

type RecordPayload = {
  effectiveDate: string;
  effectiveTime?: string;
  type: "income" | "expense";
  expenseKind?: "fixed" | "daily" | null;
  description: string;
  fontColor: string;
  backgroundColor: string;
  values: RecordPayloadValue[];
};

function buildRecord(id: string, payload: RecordPayload): TestRecord {
  const financeDate = payload.effectiveDate;
  const financeMonth = financeDate.slice(0, 7);
  const values = payload.values.map((value, index) => ({
    id: `${id}-value-${index}`,
    createdAt: "2026-04-26T12:00:00.000Z",
    updatedAt: "2026-04-26T12:00:00.000Z",
    ...value,
  }));

  return {
    id,
    effectiveAt: `${financeDate}T12:00:00.000Z`,
    financeDate,
    financeMonth,
    type: payload.type,
    expenseKind: payload.type === "income" ? null : (payload.expenseKind ?? "daily"),
    description: payload.description,
    fontColor: payload.fontColor,
    backgroundColor: payload.backgroundColor,
    values,
    totalAmountCents: values.reduce((total, value) => total + value.amountCents, 0),
    createdAt: "2026-04-26T12:00:00.000Z",
    updatedAt: "2026-04-26T12:00:00.000Z",
  };
}

function mockSignedInRecordWorkspace(records: TestRecord[]) {
  let recordsRequestCount = 0;
  let createRequestCount = 0;
  let pasteRequestCount = 0;
  let lastPastePayload: {
    sourceSnapshot: Omit<RecordPayload, "effectiveDate">;
    targetDate: string;
    targetTime?: string;
  } | null = null;

  server.use(
    http.get("*/api/auth/me", () =>
      HttpResponse.json({
        user: {
          id: "user-1",
          name: "Ada Lovelace",
          email: "ada@example.com",
        },
      }),
    ),
    http.get("*/api/categories", () =>
      HttpResponse.json({
        categories: [
          {
            id: "category-groceries",
            name: "Groceries",
            fontColor: "#111827",
            backgroundColor: "#FEF3C7",
            createdAt: "2026-04-26T12:00:00.000Z",
            updatedAt: "2026-04-26T12:00:00.000Z",
          },
        ],
      }),
    ),
    http.get("*/api/recurring-tags", () =>
      HttpResponse.json({
        recurringTags: [
          {
            id: "tag-salary",
            name: "Salary",
            amountCents: 300000,
            lastAmountUpdatedAt: "2026-04-26T12:00:00.000Z",
            createdAt: "2026-04-26T12:00:00.000Z",
            updatedAt: "2026-04-26T12:00:00.000Z",
          },
        ],
      }),
    ),
    http.get("*/api/records", () => {
      recordsRequestCount += 1;

      return HttpResponse.json({ records });
    }),
    http.post("*/api/records", async ({ request }) => {
      createRequestCount += 1;

      const payload = (await request.json()) as RecordPayload;
      const record = buildRecord(`record-created-${createRequestCount}`, payload);

      records.push(record);

      return HttpResponse.json({ record }, { status: 201 });
    }),
    http.post("*/api/records/paste", async ({ request }) => {
      pasteRequestCount += 1;

      const payload = (await request.json()) as NonNullable<typeof lastPastePayload>;
      lastPastePayload = payload;
      const record = buildRecord(`record-pasted-${pasteRequestCount}`, {
        ...payload.sourceSnapshot,
        effectiveDate: payload.targetDate,
        ...(payload.targetTime ? { effectiveTime: payload.targetTime } : {}),
      });

      records.push(record);

      return HttpResponse.json({ record }, { status: 201 });
    }),
    http.patch("*/api/records/:recordId", async ({ params, request }) => {
      const payload = (await request.json()) as Partial<RecordPayload>;
      const record = records.find((item) => item.id === params.recordId);

      if (!record) {
        return HttpResponse.json({ error: { message: "Not found." } }, { status: 404 });
      }

      Object.assign(record, {
        ...payload,
        financeDate: payload.effectiveDate ?? record.financeDate,
        financeMonth: payload.effectiveDate?.slice(0, 7) ?? record.financeMonth,
        totalAmountCents:
          payload.values?.reduce((total, value) => total + value.amountCents, 0) ??
          record.totalAmountCents,
        updatedAt: "2026-04-26T13:00:00.000Z",
      });

      return HttpResponse.json({ record });
    }),
    http.delete("*/api/records/:recordId", ({ params }) => {
      const index = records.findIndex((record) => record.id === params.recordId);

      if (index >= 0) {
        records.splice(index, 1);
      }

      return new HttpResponse(null, { status: 204 });
    }),
  );

  return {
    getCreateRequestCount: () => createRequestCount,
    getLastPastePayload: () => lastPastePayload,
    getPasteRequestCount: () => pasteRequestCount,
    getRecordsRequestCount: () => recordsRequestCount,
  };
}

function renderRecordWorkspace() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <RecordClipboardProvider userId="user-1">
          <RecordWorkspace />
        </RecordClipboardProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  window.history.pushState({}, "", "/");
  window.sessionStorage.clear();
});

it("validates the record editor, manages values, and refreshes records after create", async () => {
  const user = userEvent.setup();
  const requestCounts = mockSignedInRecordWorkspace([]);

  renderRecordWorkspace();

  expect(await screen.findByRole("heading", { name: "Records" })).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Create record" }));
  await user.click(screen.getByRole("button", { name: "Save record" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Enter a value label.");

  await user.type(screen.getByLabelText("Record description"), "April income");
  await user.type(screen.getByLabelText("Value 1 label"), "Salary");
  await user.type(screen.getByLabelText("Value 1 amount cents"), "300000");
  await user.selectOptions(screen.getByLabelText("Value 1 category"), "category-groceries");
  await user.selectOptions(screen.getByLabelText("Value 1 recurring tag"), "tag-salary");

  expect(
    screen.queryByRole("button", { name: "Create recurring tag from value" }),
  ).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Save recurring tag" })).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Add value" }));

  expect(screen.getByLabelText("Value 2 label")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Remove value 2" }));

  expect(screen.queryByLabelText("Value 2 label")).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Save record" }));

  expect(await screen.findByText("April income")).toBeInTheDocument();
  expect(screen.getAllByText("R$ 3.000,00").length).toBeGreaterThan(0);

  await waitFor(() => expect(requestCounts.getCreateRequestCount()).toBe(1));
  await waitFor(() => expect(requestCounts.getRecordsRequestCount()).toBeGreaterThan(1));
});

it("copies a record snapshot, pastes it onto a target day, and refreshes the list", async () => {
  const user = userEvent.setup();
  const sourceRecord = buildRecord("record-coffee", {
    effectiveDate: "2026-04-26",
    type: "expense",
    expenseKind: "daily",
    description: "Coffee",
    fontColor: "#111827",
    backgroundColor: "#DBEAFE",
    values: [
      {
        label: "Latte",
        amountCents: 1890,
        sortOrder: 0,
      },
    ],
  });
  const requestCounts = mockSignedInRecordWorkspace([sourceRecord]);

  renderRecordWorkspace();

  expect(await screen.findByText("Coffee")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Copy Coffee record" }));
  await user.clear(screen.getByLabelText("Paste target date"));
  await user.type(screen.getByLabelText("Paste target date"), "2026-04-27");
  await user.click(screen.getByRole("button", { name: "Paste record" }));

  expect(await screen.findByText("Pasted Coffee to 2026-04-27.")).toBeInTheDocument();
  expect(screen.getAllByText("Coffee")).toHaveLength(2);

  await waitFor(() => expect(requestCounts.getPasteRequestCount()).toBe(1));
  expect(requestCounts.getLastPastePayload()).toMatchObject({
    sourceSnapshot: {
      effectiveTime: "09:00",
    },
    targetDate: "2026-04-27",
  });
  expect(requestCounts.getLastPastePayload()).not.toHaveProperty("targetTime");
  await waitFor(() => expect(requestCounts.getRecordsRequestCount()).toBeGreaterThan(1));
});
