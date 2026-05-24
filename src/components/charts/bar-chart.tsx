"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { formatPKR } from "@/components/ui/money";

interface BarChartProps {
  data: Array<{ month: string } & Record<string, string | number>>;
  categories: string[];
}

const COLORS = [
  "#2d6a4f", "#3d7a4f", "#52a872", "#63be85", "#7a9480",
  "#a3d9b4", "#1a4731", "#8fa395", "#d4a843", "#e06060"
];

export function BarChart({ data, categories }: BarChartProps) {
  if (!data || data.length === 0) return null;

  return (
    <div style={{ height: 350, width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "var(--text-muted)" }}
            tickMargin={12}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "var(--text-muted)" }}
            tickFormatter={(value) =>
              Number(value) >= 1000 ? `${Number(value) / 1000}k` : `${value}`
            }
            width={40}
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
            formatter={(value) => [formatPKR(Number(value) || 0), ""]}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)", paddingTop: 20 }}
            iconType="circle"
          />
          {categories.map((category, index) => (
            <Bar
              key={category}
              dataKey={category}
              stackId="a"
              fill={COLORS[index % COLORS.length]}
              radius={index === categories.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              maxBarSize={40}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
