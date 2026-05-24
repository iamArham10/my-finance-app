import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface DateLabelProps {
  date: string | Date;
  className?: string;
}

export function DateLabel({ date, className }: DateLabelProps) {
  const parsed = typeof date === "string" ? parseISO(date) : date;
  return (
    <time
      dateTime={typeof date === "string" ? date : date.toISOString()}
      className={cn("text-sm", className)}
    >
      {format(parsed, "d MMM yyyy")}
    </time>
  );
}
