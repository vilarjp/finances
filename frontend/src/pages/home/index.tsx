import {
  CalendarDays,
  ChartLine,
  ChartPie,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { Children, useMemo, useState, type ReactNode } from "react";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useHomeReportQuery } from "@entities/report";
import type { CategoryBreakdownItem, HomeReport } from "@entities/report";
import { FinanceTable } from "@widgets/finance-table";
import { CategoryManager } from "@features/categories";
import {
  RecurringTagValueEditor,
  type RecurringTagValueEditorValue,
} from "@features/recurring-tags";
import { RecordWorkspace } from "@features/records";
import { formatFinanceDate } from "@shared/lib/date";
import { formatMoneyCents } from "@shared/lib/money";
import { cn } from "@shared/lib/utils";

type SummaryCardProps = {
  amountCents: number;
  icon: ReactNode;
  label: string;
  tone: "income" | "expense";
};

type ResponsiveCarouselProps = {
  children: ReactNode;
  className?: string;
  desktopClassName: string;
  label: string;
};

type ChartCardProps = {
  children: ReactNode;
  description: string;
  icon: ReactNode;
  title: string;
};

type CategoryFlowChartProps = {
  expenses: CategoryBreakdownItem[];
  income: CategoryBreakdownItem[];
};

type BalanceChartPoint = {
  currentBalanceCents?: number;
  dayOfMonth: number;
  previousBalanceCents?: number;
};

const fallbackChartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

function getHomeReportDate() {
  return formatFinanceDate(new Date());
}

function getTotalExpenses(report: HomeReport) {
  return report.currentDayRow.fixedExpenseTotalCents + report.currentDayRow.dailyExpenseTotalCents;
}

function formatFinanceMonthLabel(month: string) {
  const [yearText, monthText] = month.split("-");
  const year = Number.parseInt(yearText ?? "", 10);
  const monthIndex = Number.parseInt(monthText ?? "", 10) - 1;

  if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) {
    return month;
  }

  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, monthIndex, 1));
}

function getCategoryColor(item: CategoryBreakdownItem, index: number) {
  return item.category?.backgroundColor ?? fallbackChartColors[index % fallbackChartColors.length];
}

function getBreakdownTotal(items: CategoryBreakdownItem[]) {
  return items.reduce((total, item) => total + item.totalAmountCents, 0);
}

function getBalancePoints(report: HomeReport): BalanceChartPoint[] {
  const pointsByDay = new Map<number, BalanceChartPoint>();

  for (const point of report.dailyBalanceSeries.previousMonth) {
    pointsByDay.set(point.dayOfMonth, {
      dayOfMonth: point.dayOfMonth,
      previousBalanceCents: point.balanceCents,
    });
  }

  for (const point of report.dailyBalanceSeries.currentMonth) {
    const existingPoint = pointsByDay.get(point.dayOfMonth);

    pointsByDay.set(point.dayOfMonth, {
      ...existingPoint,
      currentBalanceCents: point.balanceCents,
      dayOfMonth: point.dayOfMonth,
    });
  }

  return [...pointsByDay.values()].sort((left, right) => left.dayOfMonth - right.dayOfMonth);
}

function MoneyTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string | number;
  payload?: { color?: string; name?: string; value?: number }[];
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
      {label !== undefined ? <p className="font-medium">Day {label}</p> : null}
      <div className="mt-1 grid gap-1">
        {payload.map((item) => (
          <p className="flex items-center gap-2" key={item.name}>
            <span
              aria-hidden="true"
              className="size-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span>{item.name}</span>
            <span className="font-medium">{formatMoneyCents(Number(item.value ?? 0))}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

function SummaryCard({ amountCents, icon, label, tone }: SummaryCardProps) {
  return (
    <article className="flex min-h-40 items-start justify-between gap-4 rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
      <div className="grid gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p
          className={cn(
            "text-3xl font-semibold tracking-normal",
            tone === "income" ? "text-finance-income" : "text-finance-expense",
          )}
        >
          {formatMoneyCents(amountCents)}
        </p>
      </div>
      <div
        className={cn(
          "rounded-md p-2",
          tone === "income"
            ? "bg-finance-income/10 text-finance-income"
            : "bg-finance-expense/10 text-finance-expense",
        )}
      >
        {icon}
      </div>
    </article>
  );
}

function ResponsiveCarousel({
  children,
  className,
  desktopClassName,
  label,
}: ResponsiveCarouselProps) {
  return (
    <section
      aria-label={label}
      aria-roledescription="carousel"
      className={cn("min-w-0 overflow-hidden md:overflow-visible", className)}
    >
      <div
        className={cn(
          "flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:overflow-visible md:pb-0",
          desktopClassName,
        )}
      >
        {Children.map(children, (child) => (
          <div className="min-w-full snap-start md:min-w-0">{child}</div>
        ))}
      </div>
    </section>
  );
}

function ChartCard({ children, description, icon, title }: ChartCardProps) {
  return (
    <article className="grid min-h-[34rem] gap-4 rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{description}</p>
          <h2 className="mt-1 text-xl font-semibold">{title}</h2>
        </div>
        <div className="rounded-md bg-secondary p-2 text-secondary-foreground">{icon}</div>
      </div>
      {children}
    </article>
  );
}

function CategoryBreakdownList({
  items,
  label,
}: {
  items: CategoryBreakdownItem[];
  label: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No {label.toLowerCase()} yet.</p>;
  }

  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <ul className="grid gap-2">
        {items.map((item, index) => (
          <li className="flex items-center justify-between gap-3 text-sm" key={item.label}>
            <span className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden="true"
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: getCategoryColor(item, index) }}
              />
              <span className="truncate">{item.label}</span>
            </span>
            <span className="shrink-0 font-medium">{formatMoneyCents(item.totalAmountCents)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CategoryFlowChart({ expenses, income }: CategoryFlowChartProps) {
  const hasIncome = income.length > 0;
  const hasExpenses = expenses.length > 0;

  return (
    <ChartCard
      description="Current month"
      icon={<ChartPie aria-hidden="true" className="size-5" />}
      title="Category flow"
    >
      <div
        aria-label="Income and expense category chart"
        className="h-64 min-w-0 overflow-hidden"
        role="img"
      >
        {hasIncome || hasExpenses ? (
          <ResponsiveContainer height="100%" minHeight={240} minWidth={320} width="100%">
            <PieChart>
              {hasIncome ? (
                <Pie
                  cx="50%"
                  cy="50%"
                  data={income}
                  dataKey="totalAmountCents"
                  innerRadius={42}
                  nameKey="label"
                  outerRadius={68}
                  paddingAngle={2}
                >
                  {income.map((item, index) => (
                    <Cell fill={getCategoryColor(item, index)} key={`income-${item.label}`} />
                  ))}
                </Pie>
              ) : null}
              {hasExpenses ? (
                <Pie
                  cx="50%"
                  cy="50%"
                  data={expenses}
                  dataKey="totalAmountCents"
                  innerRadius={82}
                  nameKey="label"
                  outerRadius={108}
                  paddingAngle={2}
                >
                  {expenses.map((item, index) => (
                    <Cell fill={getCategoryColor(item, index)} key={`expense-${item.label}`} />
                  ))}
                </Pie>
              ) : null}
              <Tooltip content={<MoneyTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="grid h-full place-items-center rounded-md border border-dashed text-sm text-muted-foreground">
            No category totals yet.
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <CategoryBreakdownList items={income} label="Income by category" />
        <CategoryBreakdownList items={expenses} label="Expenses by category" />
      </div>

      <div className="grid gap-2 rounded-md border bg-background/70 p-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Income total</span>
          <span className="font-medium text-finance-income">
            {formatMoneyCents(getBreakdownTotal(income))}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Expense total</span>
          <span className="font-medium text-finance-expense">
            {formatMoneyCents(getBreakdownTotal(expenses))}
          </span>
        </div>
      </div>
    </ChartCard>
  );
}

function DailyBalanceChart({ report }: { report: HomeReport }) {
  const currentMonthLabel = formatFinanceMonthLabel(report.currentMonth);
  const previousMonthLabel = formatFinanceMonthLabel(report.previousMonth);
  const data = getBalancePoints(report);

  return (
    <ChartCard
      description="Daily net balance"
      icon={<ChartLine aria-hidden="true" className="size-5" />}
      title="Daily balance"
    >
      <div
        aria-label="Current and previous month daily balance chart"
        className="h-80 overflow-hidden"
        role="img"
      >
        {data.length > 0 ? (
          <ResponsiveContainer height="100%" minHeight={300} minWidth={320} width="100%">
            <LineChart data={data} margin={{ bottom: 8, left: 0, right: 8, top: 16 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                axisLine={false}
                dataKey="dayOfMonth"
                tickLine={false}
                tickMargin={8}
                type="number"
              />
              <YAxis
                axisLine={false}
                tickFormatter={(value) => formatMoneyCents(Number(value))}
                tickLine={false}
                tickMargin={8}
                width={88}
              />
              <Tooltip content={<MoneyTooltip />} />
              <Line
                dataKey="currentBalanceCents"
                dot={false}
                name={currentMonthLabel}
                stroke="var(--finance-income)"
                strokeWidth={3}
                type="monotone"
              />
              <Line
                dataKey="previousBalanceCents"
                dot={false}
                name={previousMonthLabel}
                stroke="var(--finance-daily)"
                strokeWidth={3}
                type="monotone"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="grid h-full place-items-center rounded-md border border-dashed text-sm text-muted-foreground">
            No daily balances yet.
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <span className="inline-flex items-center gap-2 rounded-md border px-3 py-2">
          <span aria-hidden="true" className="size-2 rounded-full bg-finance-income" />
          {currentMonthLabel}
        </span>
        <span className="inline-flex items-center gap-2 rounded-md border px-3 py-2">
          <span aria-hidden="true" className="size-2 rounded-full bg-finance-daily" />
          {previousMonthLabel}
        </span>
      </div>
    </ChartCard>
  );
}

function HomeDashboard({ report }: { report: HomeReport }) {
  const totalExpenses = getTotalExpenses(report);

  return (
    <div className="grid gap-6">
      <ResponsiveCarousel desktopClassName="md:grid md:grid-cols-2" label="Summary cards">
        <SummaryCard
          amountCents={report.currentDayRow.incomeTotalCents}
          icon={<TrendingUp aria-hidden="true" className="size-5" />}
          label="Today's income"
          tone="income"
        />
        <SummaryCard
          amountCents={totalExpenses}
          icon={<TrendingDown aria-hidden="true" className="size-5" />}
          label="Today's expenses"
          tone="expense"
        />
      </ResponsiveCarousel>

      <ResponsiveCarousel desktopClassName="md:grid md:grid-cols-2" label="Charts">
        <CategoryFlowChart
          expenses={report.currentMonthExpenseByCategory}
          income={report.currentMonthIncomeByCategory}
        />
        <DailyBalanceChart report={report} />
      </ResponsiveCarousel>

      <ResponsiveCarousel
        desktopClassName="md:grid md:grid-cols-[minmax(0,3fr)_minmax(0,7fr)]"
        label="Finance tables"
      >
        <FinanceTable
          emptyMessage="No records for today yet."
          rows={[report.currentDayRow]}
          title="Today"
        />
        <FinanceTable
          emptyMessage="No records in the next two days yet."
          rows={report.threeDayRows}
          title="Next 2 days"
        />
      </ResponsiveCarousel>
    </div>
  );
}

export function HomePage() {
  const reportDate = useMemo(() => getHomeReportDate(), []);
  const homeReportQuery = useHomeReportQuery(reportDate);
  const [recurringTagValue, setRecurringTagValue] = useState<RecurringTagValueEditorValue>({
    amountCents: 0,
    recurringValueTagId: "",
  });

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-8 overflow-x-clip px-4 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Today</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-normal">Personal Finance</h1>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm text-card-foreground shadow-sm">
          <CalendarDays aria-hidden="true" className="size-4 text-primary" />
          <time dateTime={homeReportQuery.data?.date ?? reportDate}>
            {homeReportQuery.data?.date ?? reportDate}
          </time>
        </div>
      </div>

      {homeReportQuery.isError ? (
        <p role="alert" className="text-sm text-destructive">
          {homeReportQuery.error instanceof Error
            ? homeReportQuery.error.message
            : "Home report request failed."}
        </p>
      ) : null}

      {homeReportQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading home report</p>
      ) : null}

      {homeReportQuery.data ? <HomeDashboard report={homeReportQuery.data} /> : null}

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <RecordWorkspace />

        <aside className="grid content-start gap-3">
          <CategoryManager />
          <RecurringTagValueEditor onValueChange={setRecurringTagValue} value={recurringTagValue} />
          <div className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
            <WalletCards aria-hidden="true" className="mb-6 size-6 text-accent-foreground" />
            <p className="text-sm font-medium text-muted-foreground">Next slice</p>
            <p className="mt-2 text-2xl font-semibold">Monthly view</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
