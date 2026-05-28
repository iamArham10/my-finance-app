"use client";

import { cn } from "@/lib/utils";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currencies";
import { useCurrency } from "@/components/currency-provider";

interface MoneyProps {
  amount: number;
  className?: string;
  showSign?: boolean;
  /** Override currency code. If not provided, uses the user's preference from CurrencyProvider. */
  currencyCode?: string;
}

/**
 * Format an amount in PKR. Still available for non-component contexts
 * (e.g. export page, server components).
 */
export function formatPKR(amount: number): string {
  return formatCurrency(Math.abs(amount), DEFAULT_CURRENCY);
}

export function Money({ amount, className, showSign, currencyCode }: MoneyProps) {
  // Try to get currency from context; fall back to prop or PKR
  let resolvedCurrency = currencyCode ?? DEFAULT_CURRENCY;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { currency } = useCurrency();
    if (!currencyCode) resolvedCurrency = currency;
  } catch {
    // CurrencyProvider not available (e.g. outside dashboard) — use fallback
  }

  const prefix = showSign && amount > 0 ? "+" : showSign && amount < 0 ? "-" : "";
  return (
    <span className={cn("mono", className)}>
      {prefix}{formatCurrency(Math.abs(amount), resolvedCurrency)}
    </span>
  );
}
