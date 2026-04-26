import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardCopy,
  ClipboardPaste,
  Edit3,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { invalidateFinanceData } from "@entities/record";
import { useMonthlyReportQuery } from "@entities/report";
import type { FinanceRow, MonthlyReport, ReportRecord } from "@entities/report";
import {
  pasteRecord,
  RecordClipboardProvider,
  RecordEditor,
  type RecordMutationPayload,
  updateRecord,
  useRecordClipboard,
} from "@features/records";
import { FinanceTable } from "@widgets/finance-table";
import { formatFinanceDate } from "@shared/lib/date";
import { formatMoneyCents } from "@shared/lib/money";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";

type EditorState = {
  record: ReportRecord;
};

const monthPattern = /^\d{4}-\d{2}$/u;

function getCurrentFinanceMonth() {
  return formatFinanceDate(new Date()).slice(0, 7);
}

function parseFinanceMonth(month: string) {
  if (!monthPattern.test(month)) {
    return null;
  }

  const [yearText, monthText] = month.split("-");
  const year = Number.parseInt(yearText ?? "", 10);
  const monthNumber = Number.parseInt(monthText ?? "", 10);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(monthNumber) ||
    monthNumber < 1 ||
    monthNumber > 12
  ) {
    return null;
  }

  return {
    monthIndex: monthNumber - 1,
    year,
  };
}

function normalizeFinanceMonth(month: string | null) {
  return month && parseFinanceMonth(month) ? month : getCurrentFinanceMonth();
}

function formatMonthValue(year: number, monthIndex: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

function shiftFinanceMonth(month: string, offset: number) {
  const parsed = parseFinanceMonth(month) ?? parseFinanceMonth(getCurrentFinanceMonth())!;
  const date = new Date(parsed.year, parsed.monthIndex + offset, 1);

  return formatMonthValue(date.getFullYear(), date.getMonth());
}

function formatFinanceMonthLabel(month: string) {
  const parsed = parseFinanceMonth(month);

  if (!parsed) {
    return month;
  }

  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(new Date(parsed.year, parsed.monthIndex, 1));
}

function getMonthDates(month: string) {
  const parsed = parseFinanceMonth(month);

  if (!parsed) {
    return [];
  }

  const daysInMonth = new Date(parsed.year, parsed.monthIndex + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_value, index) => {
    const day = String(index + 1).padStart(2, "0");

    return `${month}-${day}`;
  });
}

function buildEmptyFinanceRow(date: string): FinanceRow {
  return {
    date,
    incomeRecords: [],
    fixedExpenseRecords: [],
    dailyExpenseRecords: [],
    incomeTotalCents: 0,
    fixedExpenseTotalCents: 0,
    dailyExpenseTotalCents: 0,
    balanceCents: 0,
  };
}

function getCompleteMonthRows(report: MonthlyReport) {
  const rowsByDate = new Map(report.rows.map((row) => [row.date, row]));

  return getMonthDates(report.month).map(
    (date) => rowsByDate.get(date) ?? buildEmptyFinanceRow(date),
  );
}

function getMonthTotals(rows: FinanceRow[]) {
  return rows.reduce(
    (totals, row) => ({
      balanceCents: totals.balanceCents + row.balanceCents,
      dailyExpenseTotalCents: totals.dailyExpenseTotalCents + row.dailyExpenseTotalCents,
      fixedExpenseTotalCents: totals.fixedExpenseTotalCents + row.fixedExpenseTotalCents,
      incomeTotalCents: totals.incomeTotalCents + row.incomeTotalCents,
    }),
    {
      balanceCents: 0,
      dailyExpenseTotalCents: 0,
      fixedExpenseTotalCents: 0,
      incomeTotalCents: 0,
    },
  );
}

function getRecordDescription(record: ReportRecord) {
  return record.description || "Untitled record";
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Monthly view request failed.";
}

function MonthlyPageContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const selectedMonth = normalizeFinanceMonth(searchParams.get("month"));
  const monthLabel = formatFinanceMonthLabel(selectedMonth);
  const firstSelectedMonthDay = `${selectedMonth}-01`;
  const monthlyReportQuery = useMonthlyReportQuery(selectedMonth);
  const rows = useMemo(
    () => (monthlyReportQuery.data ? getCompleteMonthRows(monthlyReportQuery.data) : []),
    [monthlyReportQuery.data],
  );
  const totals = useMemo(() => getMonthTotals(rows), [rows]);
  const [selectedDateState, setSelectedDate] = useState(firstSelectedMonthDay);
  const selectedDate = selectedDateState.startsWith(`${selectedMonth}-`)
    ? selectedDateState
    : firstSelectedMonthDay;
  const selectedRow =
    rows.find((row) => row.date === selectedDate) ?? buildEmptyFinanceRow(selectedDate);
  const { copiedRecord, copyRecord } = useRecordClipboard();
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [editorError, setEditorError] = useState("");
  const [summary, setSummary] = useState("");
  const [pasteTargetTime, setPasteTargetTime] = useState("");

  const setMonth = (month: string) => {
    setSearchParams({ month });
    setSummary("");
    setEditorState(null);
  };

  const handleMutationSuccess = async (message: string) => {
    setSummary(message);
    setEditorError("");
    setEditorState(null);
    await invalidateFinanceData(queryClient);
  };

  const updateMutation = useMutation({
    mutationFn: ({ payload, recordId }: { payload: RecordMutationPayload; recordId: string }) =>
      updateRecord(recordId, payload),
    onSuccess: async (record) => {
      await handleMutationSuccess(`Updated ${record.description || "record"}.`);
    },
    onError: (error) => setEditorError(getErrorMessage(error)),
  });

  const pasteMutation = useMutation({
    mutationFn: pasteRecord,
    onSuccess: async (record) => {
      setSelectedDate(record.financeDate);
      await handleMutationSuccess(
        `Pasted ${record.description || "record"} to ${record.financeDate}.`,
      );
    },
    onError: (error) => setSummary(getErrorMessage(error)),
  });

  const handleEditorSubmit = (payload: RecordMutationPayload) => {
    if (!editorState) {
      return;
    }

    updateMutation.mutate({
      payload,
      recordId: editorState.record.id,
    });
  };

  const handleCopyRecord = (record: ReportRecord) => {
    copyRecord(record);
    setSummary(`Copied ${getRecordDescription(record)}.`);
  };

  const handlePasteRecord = () => {
    if (!copiedRecord) {
      return;
    }

    pasteMutation.mutate({
      sourceRecordId: copiedRecord.sourceRecordId,
      sourceSnapshot: copiedRecord.sourceSnapshot,
      targetDate: selectedDate,
      ...(pasteTargetTime ? { targetTime: pasteTargetTime } : {}),
    });
  };

  const renderDayActions = (row: FinanceRow) => (
    <Button
      aria-label={`Select ${row.date}`}
      onClick={() => {
        setSelectedDate(row.date);
        setSummary("");
      }}
      size="sm"
      type="button"
      variant={selectedDate === row.date ? "secondary" : "outline"}
    >
      <CalendarDays aria-hidden="true" />
      Select
    </Button>
  );

  const renderRecordActions = (record: ReportRecord) => {
    const description = getRecordDescription(record);

    return (
      <>
        <Button
          aria-label={`Edit ${description} record`}
          onClick={() => {
            setEditorError("");
            setSummary("");
            setEditorState({ record });
          }}
          size="sm"
          type="button"
          variant="outline"
        >
          <Edit3 aria-hidden="true" />
          Edit
        </Button>
        <Button
          aria-label={`Copy ${description} record`}
          onClick={() => handleCopyRecord(record)}
          size="sm"
          type="button"
          variant="secondary"
        >
          <ClipboardCopy aria-hidden="true" />
          Copy
        </Button>
      </>
    );
  };

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-6 overflow-x-clip px-4 py-8">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Month planner</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-normal">Monthly view</h1>
          <h2 className="mt-2 text-xl font-semibold text-muted-foreground">{monthLabel}</h2>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 text-card-foreground shadow-sm sm:flex-row sm:items-end">
          <div className="flex items-end gap-2">
            <Button
              aria-label="Previous month"
              onClick={() => setMonth(shiftFinanceMonth(selectedMonth, -1))}
              size="icon"
              type="button"
              variant="outline"
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
            <label className="grid gap-1 text-sm font-medium">
              Selected month
              <Input
                onChange={(event) => {
                  if (parseFinanceMonth(event.target.value)) {
                    setMonth(event.target.value);
                  }
                }}
                type="month"
                value={selectedMonth}
              />
            </label>
            <Button
              aria-label="Next month"
              onClick={() => setMonth(shiftFinanceMonth(selectedMonth, 1))}
              size="icon"
              type="button"
              variant="outline"
            >
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
          <Button
            onClick={() => setMonth(getCurrentFinanceMonth())}
            type="button"
            variant="secondary"
          >
            Current month
          </Button>
        </div>
      </div>

      <section
        aria-label="Monthly totals"
        className="grid gap-3 rounded-lg border bg-card p-4 text-card-foreground shadow-sm sm:grid-cols-4"
      >
        <div>
          <p className="text-sm text-muted-foreground">Income</p>
          <p className="mt-1 text-xl font-semibold text-finance-income">
            {formatMoneyCents(totals.incomeTotalCents)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Fixed expenses</p>
          <p className="mt-1 text-xl font-semibold text-finance-expense">
            {formatMoneyCents(totals.fixedExpenseTotalCents)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Daily expenses</p>
          <p className="mt-1 text-xl font-semibold text-finance-daily">
            {formatMoneyCents(totals.dailyExpenseTotalCents)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Balance</p>
          <p className="mt-1 text-xl font-semibold">{formatMoneyCents(totals.balanceCents)}</p>
        </div>
      </section>

      {monthlyReportQuery.isError ? (
        <p role="alert" className="text-sm text-destructive">
          {getErrorMessage(monthlyReportQuery.error)}
        </p>
      ) : null}

      {monthlyReportQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading monthly report</p>
      ) : null}

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <FinanceTable
          dayActions={renderDayActions}
          emptyMessage="No monthly rows yet."
          recordActions={renderRecordActions}
          rows={rows}
          title={`Monthly rows for ${monthLabel}`}
        />

        <aside className="grid min-w-0 content-start gap-4">
          <section
            aria-label="Selected day actions"
            className="grid gap-4 rounded-lg border bg-card p-5 text-card-foreground shadow-sm"
          >
            <div>
              <p className="text-sm font-medium text-primary">Selected day</p>
              <time className="mt-1 block text-2xl font-semibold" dateTime={selectedDate}>
                {selectedDate}
              </time>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <p className="rounded-md border bg-background/70 p-3">
                <span className="block text-muted-foreground">Income</span>
                <span className="font-medium">
                  {formatMoneyCents(selectedRow.incomeTotalCents)}
                </span>
              </p>
              <p className="rounded-md border bg-background/70 p-3">
                <span className="block text-muted-foreground">Balance</span>
                <span className="font-medium">{formatMoneyCents(selectedRow.balanceCents)}</span>
              </p>
            </div>

            <p className="text-sm text-muted-foreground">
              {copiedRecord
                ? `Ready to paste ${copiedRecord.sourceSnapshot.description || "record"}.`
                : "Copy a monthly record, select a day, then paste its snapshot here."}
            </p>

            <label className="grid gap-1 text-sm font-medium">
              Paste time
              <Input
                disabled={pasteMutation.isPending}
                onChange={(event) => setPasteTargetTime(event.target.value)}
                type="time"
                value={pasteTargetTime}
              />
            </label>

            <Button
              disabled={!copiedRecord || pasteMutation.isPending}
              onClick={handlePasteRecord}
              type="button"
            >
              <ClipboardPaste aria-hidden="true" />
              Paste copied record
            </Button>

            {summary ? (
              <p aria-live="polite" className="text-sm text-muted-foreground">
                {summary}
              </p>
            ) : null}
          </section>

          {editorState ? (
            <RecordEditor
              defaultDate={selectedDate}
              isSubmitting={updateMutation.isPending}
              onCancel={() => setEditorState(null)}
              onSubmit={handleEditorSubmit}
              record={editorState.record}
              serverError={editorError}
            />
          ) : null}
        </aside>
      </div>
    </main>
  );
}

export function MonthlyPage() {
  return (
    <RecordClipboardProvider>
      <MonthlyPageContent />
    </RecordClipboardProvider>
  );
}
