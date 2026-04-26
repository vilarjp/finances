import { CalendarDays, Coins } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import { formatMoneyCents } from "@shared/lib/money";
import { cn } from "@shared/lib/utils";

import type { FinanceRecord } from "../model/types";

type RecordCardProps = {
  actions?: ReactNode;
  className?: string;
  record: FinanceRecord;
};

type RecordCellProps = {
  className?: string;
  record: FinanceRecord;
};

function isHexColor(value: string) {
  return /^#[\da-f]{6}$/iu.test(value);
}

function getRecordStyle(record: FinanceRecord): CSSProperties {
  const style: CSSProperties = {};

  if (isHexColor(record.backgroundColor)) {
    style.backgroundColor = record.backgroundColor;
  }

  if (isHexColor(record.fontColor)) {
    style.color = record.fontColor;
  }

  return style;
}

function getClassificationLabel(record: FinanceRecord) {
  if (record.type === "income") {
    return "Income";
  }

  if (record.expenseKind === "fixed") {
    return "Fixed expense";
  }

  return "Daily expense";
}

function getRecordDescription(record: FinanceRecord) {
  return record.description || "Untitled record";
}

export function RecordCell({ className, record }: RecordCellProps) {
  return (
    <div
      className={cn(
        "rounded-md border bg-record-default-background px-3 py-2 text-record-default-foreground",
        className,
      )}
      style={getRecordStyle(record)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{getRecordDescription(record)}</p>
          <p className="text-xs opacity-80">{getClassificationLabel(record)}</p>
        </div>
        <p className="shrink-0 text-sm font-semibold">
          {formatMoneyCents(record.totalAmountCents)}
        </p>
      </div>
    </div>
  );
}

export function RecordCard({ actions, className, record }: RecordCardProps) {
  return (
    <article
      className={cn(
        "rounded-lg border bg-record-default-background p-4 text-record-default-foreground shadow-sm",
        className,
      )}
      style={getRecordStyle(record)}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-normal opacity-75">
              {getClassificationLabel(record)}
            </p>
            <h3 className="mt-1 truncate text-lg font-semibold">{getRecordDescription(record)}</h3>
          </div>
          <div className="flex flex-wrap gap-3 text-sm opacity-80">
            <span className="inline-flex items-center gap-1">
              <CalendarDays aria-hidden="true" className="size-4" />
              {record.financeDate}
            </span>
            <span className="inline-flex items-center gap-1 font-medium">
              <Coins aria-hidden="true" className="size-4" />
              {formatMoneyCents(record.totalAmountCents)}
            </span>
          </div>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>

      <ul className="mt-4 grid gap-2">
        {record.values.map((value) => (
          <li
            className="flex items-center justify-between gap-3 rounded-md bg-background/70 px-3 py-2 text-sm"
            key={value.id}
          >
            <span className="min-w-0 truncate">{value.label}</span>
            <span className="shrink-0 font-medium">{formatMoneyCents(value.amountCents)}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
