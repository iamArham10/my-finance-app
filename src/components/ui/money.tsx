import { cn } from "@/lib/utils";

interface MoneyProps {
  amount: number;
  className?: string;
  showSign?: boolean;
}

export function formatPKR(amount: number): string {
  const formatted = new Intl.NumberFormat("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
  return `PKR ${formatted}`;
}

export function Money({ amount, className, showSign }: MoneyProps) {
  const prefix = showSign && amount > 0 ? "+" : showSign && amount < 0 ? "-" : "";
  return (
    <span className={cn("mono", className)}>
      {prefix}{formatPKR(amount)}
    </span>
  );
}
