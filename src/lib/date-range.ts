import type { DateRange } from "@/types";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getMonthRange(date = new Date()): DateRange {
  return {
    startDate: toIsoDate(new Date(date.getFullYear(), date.getMonth(), 1)),
    endDate: toIsoDate(new Date(date.getFullYear(), date.getMonth() + 1, 0)),
  };
}

export function getPreviousRange(range: DateRange): DateRange {
  const start = parseIsoDate(range.startDate);
  const end = parseIsoDate(range.endDate);

  if (
    start.getDate() === 1 &&
    end.getTime() ===
      new Date(start.getFullYear(), start.getMonth() + 1, 0).getTime()
  ) {
    return getMonthRange(new Date(start.getFullYear(), start.getMonth() - 1, 1));
  }

  const dayCount =
    Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  const previousEnd = new Date(start);
  previousEnd.setDate(previousEnd.getDate() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousStart.getDate() - dayCount + 1);

  return {
    startDate: toIsoDate(previousStart),
    endDate: toIsoDate(previousEnd),
  };
}

export function getRangeFromSearch(search: string): DateRange {
  const params = new URLSearchParams(search);
  const from = params.get("from");
  const to = params.get("to");

  if (isValidIsoDate(from) && isValidIsoDate(to) && from <= to) {
    return { startDate: from, endDate: to };
  }

  return getMonthRange();
}

export function getRangeSearch(range: DateRange): string {
  const params = new URLSearchParams();
  params.set("from", range.startDate);
  params.set("to", range.endDate);
  return params.toString();
}

export function getRangeLabel(range: DateRange): string {
  const start = parseIsoDate(range.startDate);
  const end = parseIsoDate(range.endDate);
  const monthRange = getMonthRange(start);

  if (range.startDate === monthRange.startDate && range.endDate === monthRange.endDate) {
    return start.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }

  const sameYear = start.getFullYear() === end.getFullYear();
  const startLabel = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  });
  const endLabel = end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `${startLabel} - ${endLabel}`;
}

export function shiftRangeByMonths(range: DateRange, monthOffset: number): DateRange {
  const start = parseIsoDate(range.startDate);
  return getMonthRange(
    new Date(start.getFullYear(), start.getMonth() + monthOffset, 1)
  );
}

export function isCurrentMonthRange(range: DateRange): boolean {
  const currentRange = getMonthRange();
  return (
    range.startDate === currentRange.startDate &&
    range.endDate === currentRange.endDate
  );
}

export function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function isValidIsoDate(value: string | null): value is string {
  if (!value || !ISO_DATE_PATTERN.test(value)) return false;
  return toIsoDate(parseIsoDate(value)) === value;
}
