import { format } from "date-fns";

export function formatFinanceDate(date: Date) {
  return format(date, "yyyy-MM-dd");
}
