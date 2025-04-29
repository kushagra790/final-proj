"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LineChart as LineChartIcon, BarChart3 } from "lucide-react";
import { AreaChart as AreaChartIcon } from "@/components/icons/area-chart-icon";

interface ActivityChartProps {
  activityData: { time: string; steps: number; activeMinutes: number; }[];
}

type ChartType = "line" | "bar" | "area";

export function MultiActivityChart({ activityData }: ActivityChartProps) {
  const [chartType, setChartType] = useState<ChartType>("line");

  return (
    <div className="space-y-4">
      <ToggleGroup type="single" value={chartType} onValueChange={(value) => value && setChartType(value as ChartType)}>
        <ToggleGroupItem value="line" aria-label="Line Chart" title="Line Chart">
          <LineChartIcon className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="bar" aria-label="Bar Chart" title="Bar Chart">
          <BarChart3 className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="area" aria-label="Area Chart" title="Area Chart">
          <AreaChartIcon className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>

      <div className="h-[250px]">
        {chartType === "line" && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={activityData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis 
                dataKey="time" 
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                yAxisId="left"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value} min`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                  border: 'none', 
                  borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }} 
              />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="steps" 
                stroke="#3182CE" 
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="activeMinutes" 
                stroke="#68D391" 
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {chartType === "bar" && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={activityData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis 
                dataKey="time" 
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                yAxisId="left"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value} min`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                  border: 'none', 
                  borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }} 
              />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="steps" 
                fill="#3182CE" 
                name="Steps"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                yAxisId="right"
                dataKey="activeMinutes" 
                fill="#68D391" 
                name="Active Minutes"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}

        {chartType === "area" && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={activityData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis 
                dataKey="time" 
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                yAxisId="left"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value} min`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                  border: 'none', 
                  borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }} 
              />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="steps"
                stroke="#3182CE"
                fill="#3182CE"
                fillOpacity={0.3}
                name="Steps"
              />
              <Area
                yAxisId="right" 
                type="monotone"
                dataKey="activeMinutes"
                stroke="#68D391"
                fill="#68D391"
                fillOpacity={0.3}
                name="Active Minutes"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
