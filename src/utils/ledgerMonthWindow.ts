import { addMonths, toIsoDate } from "./calendar";

export function getLedgerMonthStart(date: Date): string {
  return toIsoDate(new Date(date.getFullYear(), date.getMonth(), 1));
}

export function getLedgerMonthEnd(date: Date): string {
  return toIsoDate(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

export function getLedgerWindowStart(date: Date): string {
  return toIsoDate(new Date(date.getFullYear(), date.getMonth() - 1, 1));
}

export function getLedgerWindowEnd(date: Date): string {
  const twoMonthsAhead = addMonths(date, 2);
  return toIsoDate(new Date(twoMonthsAhead.getFullYear(), twoMonthsAhead.getMonth(), 0));
}
