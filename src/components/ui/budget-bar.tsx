"use client";

import { cn } from "@/lib/utils";

interface BudgetBarProps {
  spent: number;
  budget: number;
  className?: string;
}

export function BudgetBar({ spent, budget, className }: BudgetBarProps) {
  const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  
  const getColor = () => {
    if (percentage >= 80) return "var(--budget-over)";
    if (percentage >= 50) return "var(--budget-warn)";
    return "var(--budget-safe)";
  };

  return (
    <div
      className={cn("w-full rounded-full overflow-hidden", className)}
      style={{ height: 6, background: "var(--bg-elevated)" }}
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${Math.round(percentage)}% of budget used`}
    >
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{
          width: `${percentage}%`,
          backgroundColor: getColor(),
        }}
      />
    </div>
  );
}
