"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { formatPKR } from "@/components/ui/money";

interface DonutChartProps {
  data: { name: string; value: number; color?: string }[];
}

const COLORS = [
  "#2d6a4f", "#3d7a4f", "#52a872", "#63be85", "#7a9480",
  "#a3d9b4", "#1a4731", "#8fa395", "#d4a843", "#e06060"
];

export function DonutChart({ data }: DonutChartProps) {
  if (!data || data.length === 0) return null;

  return (
    <div style={{ height: 300, width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            stroke="var(--bg-surface)"
            strokeWidth={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
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
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
