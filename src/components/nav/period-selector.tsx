"use client";

import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
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
    <div className="period-control">
      <div className="period-control__month">
        <button
          type="button"
          className="period-control__icon"
          onClick={() => onRangeChange(shiftRangeByMonths(range, -1))}
          aria-label="Previous month"
          title="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="period-control__label">
          <CalendarDays className="h-4 w-4 text-[var(--text-muted)]" />
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {getRangeLabel(range)}
          </span>
        </div>
        <button
          type="button"
          className="period-control__icon"
          onClick={() => onRangeChange(shiftRangeByMonths(range, 1))}
          aria-label="Next month"
          title="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        {!isCurrentMonthRange(range) && (
          <button
            type="button"
            className="period-control__icon"
            onClick={() => onRangeChange(getMonthRange())}
            aria-label="Current month"
            title="Current month"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="period-control__custom">
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
          className="period-control__date"
          aria-label="Start date"
        />
        <span className="period-control__dash">to</span>
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
          className="period-control__date"
          aria-label="End date"
        />
        {showCustomRange && (
          <button
            type="button"
            className="period-control__apply"
            disabled={customStart > customEnd}
            onClick={applyCustomRange}
          >
            Apply
          </button>
        )}
      </div>
    </div>
  );
}
