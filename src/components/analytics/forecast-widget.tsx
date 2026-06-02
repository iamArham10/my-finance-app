"use client";

import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { formatPKR } from "@/components/ui/money";
import type { MonthlyTrend } from "@/types";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ForecastWidgetProps {
  historicalData: MonthlyTrend[];
}

type ForecastPoint = {
  month: string;
  actual: number | null;
  forecast: number | null;
};

export function ForecastWidget({ historicalData }: ForecastWidgetProps) {
  const forecastData = useMemo(() => {
    if (historicalData.length < 2) return [];

    // Simple 3-month moving average forecast
    const data: ForecastPoint[] = historicalData.map((d) => ({
      month: d.month,
      actual: d.total,
      forecast: null,
    }));

    const last3Totals = historicalData.slice(-3).map((d) => d.total);
    
    // Project 3 months ahead
    for (let i = 1; i <= 3; i++) {
      const avg = last3Totals.reduce((a, b) => a + b, 0) / last3Totals.length;
      
      const nextMonthLabel = `+${i}M`;

      data.push({
        month: nextMonthLabel,
        actual: null,
        forecast: Math.round(avg),
      });

      last3Totals.shift();
      last3Totals.push(avg);
    }

    // Connect the line
    const lastActualIndex = historicalData.length - 1;
    data[lastActualIndex].forecast = data[lastActualIndex].actual;

    return data;
  }, [historicalData]);

  if (forecastData.length === 0) {
    return (
      <div className="card-base" style={{ padding: 24 }}>
        <h2 className="text-base font-semibold mb-2 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <TrendingUp className="w-4 h-4 text-[var(--accent)]" />
          Cash Flow Forecast
        </h2>
        <p className="text-sm text-[var(--text-muted)]">
          Not enough historical data to generate a forecast.
        </p>
      </div>
    );
  }

  return (
    <div className="card-base" style={{ padding: 24 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <TrendingUp className="w-4 h-4 text-[var(--accent)]" />
            Cash Flow Forecast
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Projected spending based on recent trends
          </p>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--warning)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--warning)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "var(--text-muted)" }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "var(--text-muted)" }}
              tickFormatter={(value) => `Rs${(value / 1000).toFixed(0)}k`}
              dx={-10}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border)",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              }}
              itemStyle={{ color: "var(--text-primary)", fontSize: "14px" }}
              formatter={(value: any) => formatPKR(Number(value || 0))}
            />
            <Area
              type="monotone"
              dataKey="actual"
              stroke="var(--accent)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorActual)"
              name="Actual Spend"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="forecast"
              stroke="var(--warning)"
              strokeWidth={2}
              strokeDasharray="5 5"
              fillOpacity={1}
              fill="url(#colorForecast)"
              name="Forecasted Spend"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
