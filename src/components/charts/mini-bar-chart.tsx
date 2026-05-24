"use client";

import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { formatPKR } from "@/components/ui/money";

interface MiniBarChartProps {
  data: { date: string; amount: number }[];
}

export function MiniBarChart({ data }: MiniBarChartProps) {
  if (!data || data.length === 0) return null;

  return (
    <div style={{ height: 140, width: "100%" }} className="mb-8">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "var(--text-muted)" }}
            tickMargin={10}
            interval="preserveStartEnd"
          />
          <Tooltip
            cursor={{ fill: "var(--bg-elevated)", opacity: 0.5 }}
            contentStyle={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--text-primary)",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
            itemStyle={{ color: "var(--accent)" }}
            formatter={(value) => [formatPKR(Number(value) || 0), "Spent"]}
            labelStyle={{ color: "var(--text-muted)", marginBottom: 4 }}
          />
          <Bar
            dataKey="amount"
            fill="var(--accent)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
