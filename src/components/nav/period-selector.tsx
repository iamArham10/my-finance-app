"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, RotateCcw } from "lucide-react";
import {
  getMonthRange,
  getRangeLabel,
  isCurrentMonthRange,
  shiftRangeByMonths,
} from "@/lib/date-range";
import type { DateRange } from "@/types";

interface PeriodSelectorProps {
  range: DateRange;
  onRangeChange: (range: DateRange) => void;
}

export function PeriodSelector({ range, onRangeChange }: PeriodSelectorProps) {
  const rangeKey = `${range.startDate}:${range.endDate}`;
  const [customRange, setCustomRange] = useState({
    key: rangeKey,
    startDate: range.startDate,
    endDate: range.endDate,
  });
  const customStart =
    customRange.key === rangeKey ? customRange.startDate : range.startDate;
  const customEnd =
    customRange.key === rangeKey ? customRange.endDate : range.endDate;

  const applyCustomRange = () => {
    if (customStart && customEnd && customStart <= customEnd) {
      onRangeChange({ startDate: customStart, endDate: customEnd });
    }
  };

  const showCustomRange = range.startDate !== customStart || range.endDate !== customEnd;

  return (
    <div className="flex flex-col gap-3 sm:items-end">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn-ghost px-2"
          onClick={() => onRangeChange(shiftRangeByMonths(range, -1))}
          aria-label="Previous month"
          title="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex h-9 min-w-[180px] items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3">
          <CalendarDays className="h-4 w-4 text-[var(--text-muted)]" />
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {getRangeLabel(range)}
          </span>
        </div>
        <button
          type="button"
          className="btn-ghost px-2"
          onClick={() => onRangeChange(shiftRangeByMonths(range, 1))}
          aria-label="Next month"
          title="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        {!isCurrentMonthRange(range) && (
          <button
            type="button"
            className="btn-ghost px-2"
            onClick={() => onRangeChange(getMonthRange())}
            aria-label="Current month"
            title="Current month"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="date"
          value={customStart}
          onChange={(event) =>
            setCustomRange({
              key: rangeKey,
              startDate: event.target.value,
              endDate: customEnd,
            })
          }
          className="h-9 w-full px-3 text-sm sm:w-[150px]"
          aria-label="Start date"
        />
        <input
          type="date"
          value={customEnd}
          onChange={(event) =>
            setCustomRange({
              key: rangeKey,
              startDate: customStart,
              endDate: event.target.value,
            })
          }
          className="h-9 w-full px-3 text-sm sm:w-[150px]"
          aria-label="End date"
        />
        <button
          type="button"
          className="btn-ghost"
          disabled={!showCustomRange || customStart > customEnd}
          onClick={applyCustomRange}
        >
          Apply
        </button>
      </div>
    </div>
  );
}
