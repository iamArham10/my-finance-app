"use client";

import { useMemo } from "react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";

interface SparklineProps {
  data: number[];
  color?: string;
  className?: string;
}

export function Sparkline({
  data,
  color = "var(--accent)",
  className = "h-8 w-16",
}: SparklineProps) {
  const chartData = useMemo(() => {
    return data.map((val, i) => ({ index: i, value: val }));
  }, [data]);

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={`sparkline-${color.replace(/[^\w-]/g, "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fillOpacity={1}
            fill={`url(#sparkline-${color.replace(/[^\w-]/g, "")})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
