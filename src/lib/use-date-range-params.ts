"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { getRangeFromSearch, getRangeSearch } from "@/lib/date-range";
import type { DateRange } from "@/types";

export function useDateRangeParams() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [range, setRangeState] = useState<DateRange>(() => getRangeFromSearch(searchParams.toString()));

  useEffect(() => {
    setRangeState(getRangeFromSearch(searchParams.toString()));
  }, [searchParams]);

  const setRange = useCallback((nextRange: DateRange) => {
    setRangeState(nextRange);
    const query = getRangeSearch(nextRange);
    router.push(`${pathname}?${query}`);
  }, [pathname, router]);

  return { range, setRange };
}
