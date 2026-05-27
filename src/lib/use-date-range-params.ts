"use client";

import { useCallback, useEffect, useState } from "react";
import { getRangeFromSearch, getRangeSearch } from "@/lib/date-range";
import type { DateRange } from "@/types";

export function useDateRangeParams() {
  const [range, setRangeState] = useState<DateRange>(() => getRangeFromSearch(""));

  useEffect(() => {
    const readRange = () => setRangeState(getRangeFromSearch(window.location.search));
    readRange();
    window.addEventListener("popstate", readRange);
    return () => window.removeEventListener("popstate", readRange);
  }, []);

  const setRange = useCallback((nextRange: DateRange) => {
    setRangeState(nextRange);
    const query = getRangeSearch(nextRange);
    const nextUrl = `${window.location.pathname}?${query}`;
    window.history.pushState(null, "", nextUrl);
  }, []);

  return { range, setRange };
}
