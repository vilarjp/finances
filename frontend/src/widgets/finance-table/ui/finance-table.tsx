import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";

import { RecordCell } from "@entities/record";
import type { FinanceRow, ReportRecord, ReportRecordValue } from "@entities/report";
import { formatMoneyCents } from "@shared/lib/money";
import { cn } from "@shared/lib/utils";

type FinanceTableProps = {
  className?: string;
  emptyMessage?: string;
  rows: FinanceRow[];
  title: string;
};

type RecordGroupProps = {
  emptyMessage: string;
  records: ReportRecord[];
  totalAmountCents: number;
};

type FinanceTableRecordProps = {
  defaultExpanded?: boolean;
  record: ReportRecord;
};

type CompactRecordSectionProps = {
  emptyMessage: string;
  label: string;
  records: ReportRecord[];
  totalAmountCents: number;
};

const columns = ["Day", "Income", "Expenses", "Daily", "Balance"] as const;

function getRecordDescription(record: ReportRecord) {
  return record.description || "Untitled record";
}

function getBalanceClassName(balanceCents: number) {
  if (balanceCents > 0) {
    return "text-finance-balance-positive";
  }

  if (balanceCents < 0) {
    return "text-finance-balance-negative";
  }

  return "text-muted-foreground";
}

function getValueMetadata(value: ReportRecordValue) {
  const metadata = [value.category?.name ?? "Uncategorized"];

  if (value.recurringValueTag) {
    metadata.push(value.recurringValueTag.name);
  }

  return metadata.join(" · ");
}

function FinanceTableRecord({ defaultExpanded = false, record }: FinanceTableRecordProps) {
  const description = getRecordDescription(record);
  const valuesId = useId();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="grid gap-2">
      <RecordCell record={record} />
      <div className="rounded-md border bg-background/70 px-3 py-2 text-sm">
        <button
          aria-controls={valuesId}
          aria-expanded={isExpanded}
          aria-label={`${isExpanded ? "Hide" : "Show"} values for ${description}`}
          className="flex w-full items-center justify-between gap-3 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          onClick={() => setIsExpanded((current) => !current)}
          type="button"
        >
          <span>Values</span>
          <ChevronDown
            aria-hidden="true"
            className={cn("size-4 transition-transform", isExpanded ? "rotate-180" : "")}
          />
        </button>
        {isExpanded ? (
          <ul className="mt-2 grid gap-2" id={valuesId}>
            {record.values.map((value) => (
              <li className="grid gap-1 border-t pt-2 first:border-t-0 first:pt-0" key={value.id}>
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0 font-medium">{value.label}</span>
                  <span className="shrink-0">{formatMoneyCents(value.amountCents)}</span>
                </div>
                <p className="text-xs text-muted-foreground">{getValueMetadata(value)}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

function RecordGroup({ emptyMessage, records, totalAmountCents }: RecordGroupProps) {
  return (
    <div className="grid min-w-0 gap-2">
      <p className="text-xs font-medium text-muted-foreground">
        Total {formatMoneyCents(totalAmountCents)}
      </p>
      {records.length > 0 ? (
        records.map((record) => (
          <FinanceTableRecord defaultExpanded key={record.id} record={record} />
        ))
      ) : (
        <p className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      )}
    </div>
  );
}

function CompactRecordSection({
  emptyMessage,
  label,
  records,
  totalAmountCents,
}: CompactRecordSectionProps) {
  const headingId = useId();

  return (
    <section className="grid gap-2" aria-labelledby={headingId}>
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold" id={headingId}>
          {label}
        </h4>
        <span className="text-sm font-medium">{formatMoneyCents(totalAmountCents)}</span>
      </div>
      {records.length > 0 ? (
        records.map((record) => <FinanceTableRecord key={record.id} record={record} />)
      ) : (
        <p className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      )}
    </section>
  );
}

function DesktopTable({ emptyMessage, rows, title }: FinanceTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-card text-card-foreground shadow-sm">
      <table className="min-w-[980px] table-fixed text-left text-sm" aria-label={title}>
        <caption className="sr-only">{title}</caption>
        <colgroup>
          <col className="w-[120px]" />
          <col />
          <col />
          <col />
          <col className="w-[150px]" />
        </colgroup>
        <thead className="bg-muted/70 text-xs font-semibold uppercase tracking-normal text-muted-foreground">
          <tr>
            {columns.map((column) => (
              <th className="px-4 py-3" key={column} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map((row, index) => (
              <tr
                className={cn(index % 2 === 0 ? "bg-table-row" : "bg-table-row-alt")}
                key={row.date}
              >
                <th className="align-top px-4 py-4 font-semibold" scope="row">
                  <time dateTime={row.date}>{row.date}</time>
                </th>
                <td aria-label={`Income records for ${row.date}`} className="align-top px-4 py-4">
                  <RecordGroup
                    emptyMessage="No income records"
                    records={row.incomeRecords}
                    totalAmountCents={row.incomeTotalCents}
                  />
                </td>
                <td
                  aria-label={`Fixed expense records for ${row.date}`}
                  className="align-top px-4 py-4"
                >
                  <RecordGroup
                    emptyMessage="No expense records"
                    records={row.fixedExpenseRecords}
                    totalAmountCents={row.fixedExpenseTotalCents}
                  />
                </td>
                <td
                  aria-label={`Daily expense records for ${row.date}`}
                  className="align-top px-4 py-4"
                >
                  <RecordGroup
                    emptyMessage="No daily records"
                    records={row.dailyExpenseRecords}
                    totalAmountCents={row.dailyExpenseTotalCents}
                  />
                </td>
                <td
                  aria-label={`Balance for ${row.date}`}
                  className={cn(
                    "align-top px-4 py-4 text-base font-semibold",
                    getBalanceClassName(row.balanceCents),
                  )}
                >
                  {formatMoneyCents(row.balanceCents)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-4 py-8 text-center text-sm text-muted-foreground" colSpan={5}>
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function CompactRows({ emptyMessage, rows }: Pick<FinanceTableProps, "emptyMessage" | "rows">) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-card p-5 text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:hidden">
      {rows.map((row) => (
        <article
          aria-label={`Compact finance row for ${row.date}`}
          className="grid gap-4 rounded-lg border bg-card p-4 text-card-foreground shadow-sm"
          key={row.date}
          role="group"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                Day
              </p>
              <time className="mt-1 block text-base font-semibold" dateTime={row.date}>
                {row.date}
              </time>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                Balance
              </p>
              <p
                className={cn(
                  "mt-1 text-base font-semibold",
                  getBalanceClassName(row.balanceCents),
                )}
              >
                {formatMoneyCents(row.balanceCents)}
              </p>
            </div>
          </div>
          <CompactRecordSection
            emptyMessage="No income records"
            label="Income"
            records={row.incomeRecords}
            totalAmountCents={row.incomeTotalCents}
          />
          <CompactRecordSection
            emptyMessage="No expense records"
            label="Expenses"
            records={row.fixedExpenseRecords}
            totalAmountCents={row.fixedExpenseTotalCents}
          />
          <CompactRecordSection
            emptyMessage="No daily records"
            label="Daily"
            records={row.dailyExpenseRecords}
            totalAmountCents={row.dailyExpenseTotalCents}
          />
        </article>
      ))}
    </div>
  );
}

export function FinanceTable({
  className,
  emptyMessage = "No finance rows yet.",
  rows,
  title,
}: FinanceTableProps) {
  return (
    <section className={cn("grid gap-3", className)} aria-label={title}>
      <DesktopTable emptyMessage={emptyMessage} rows={rows} title={title} />
      <CompactRows emptyMessage={emptyMessage} rows={rows} />
    </section>
  );
}
