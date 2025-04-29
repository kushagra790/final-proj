"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, parseISO } from "date-fns";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon } from "lucide-react";

interface SleepRecord {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  quality: string;
}

interface MultiSleepChartProps {
  sleepData: SleepRecord[];
}

// Function to map quality string to numeric value for chart display
const qualityToValue = (quality: string): number => {
  switch (quality.toLowerCase()) {
    case "excellent": return 4;
    case "good": return 3;
    case "fair": return 2;
    case "poor": return 1;
    default: return 0;
  }
};

const QUALITY_COLORS = {
  excellent: "#10B981",
  good: "#6366F1",
  fair: "#F59E0B",
  poor: "#EF4444",
};

type ChartType = "bar" | "line" | "pie";

export function MultiSleepChart({ sleepData }: MultiSleepChartProps) {
  const [chartType, setChartType] = useState<ChartType>("bar");

  // Format data for chart display
  const chartData = [...sleepData]
    .reverse()
    .map((record) => ({
      date: record.date,
      duration: Math.round(record.duration / 60 * 10) / 10, // Convert to hours with 1 decimal
      quality: qualityToValue(record.quality),
      qualityLabel: record.quality,
      startTime: format(new Date(record.startTime), "hh:mm a"),
      endTime: format(new Date(record.endTime), "hh:mm a"),
    }));

  // Process data for pie chart (quality distribution)
  const qualityDistribution = sleepData.reduce((acc: any, record) => {
    const quality = record.quality.toLowerCase();
    acc[quality] = (acc[quality] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(qualityDistribution).map(([quality, count]) => ({
    name: quality.charAt(0).toUpperCase() + quality.slice(1),
    value: count as number,
    color: QUALITY_COLORS[quality as keyof typeof QUALITY_COLORS] || "#CBD5E1",
  }));

  return (
    <div className="space-y-4">
      <ToggleGroup type="single" value={chartType} onValueChange={(value) => value && setChartType(value as ChartType)}>
        <ToggleGroupItem value="bar" aria-label="Bar Chart" title="Bar Chart">
          <BarChart3 className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="line" aria-label="Line Chart" title="Line Chart">
          <LineChartIcon className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="pie" aria-label="Pie Chart" title="Sleep Quality Distribution">
          <PieChartIcon className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>

      <div className="h-[250px]">
        {chartType === "bar" && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(parseISO(date), "MMM dd")}
                fontSize={12}
              />
              <YAxis
                yAxisId="left"
                orientation="left"
                stroke="#8884d8"
                label={{ value: "Hours", angle: -90, position: "insideLeft" }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#82ca9d"
                domain={[0, 4]}
                tickFormatter={(value) => {
                  switch (value) {
                    case 4: return "Exc";
                    case 3: return "Good";
                    case 2: return "Fair";
                    case 1: return "Poor";
                    default: return "";
                  }
                }}
                label={{ value: "Quality", angle: -90, position: "insideRight" }}
              />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === "duration") return [`${value} hours`, "Duration"];
                  if (name === "quality") {
                    switch (value) {
                      case 4: return ["Excellent", "Quality"];
                      case 3: return ["Good", "Quality"];
                      case 2: return ["Fair", "Quality"];
                      case 1: return ["Poor", "Quality"];
                      default: return ["Unknown", "Quality"];
                    }
                  }
                  return [value, name];
                }}
                labelFormatter={(date) => format(parseISO(date), "MMMM dd, yyyy")}
              />
              <Legend />
              <Bar
                dataKey="duration"
                fill="#8884d8"
                radius={[4, 4, 0, 0]}
                yAxisId="left"
                name="Duration"
              />
              <Bar
                dataKey="quality"
                fill="#82ca9d"
                radius={[4, 4, 0, 0]}
                yAxisId="right"
                name="Quality"
              />
            </BarChart>
          </ResponsiveContainer>
        )}

        {chartType === "line" && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(parseISO(date), "MMM dd")}
                fontSize={12}
              />
              <YAxis
                yAxisId="left"
                orientation="left"
                stroke="#8884d8"
                label={{ value: "Hours", angle: -90, position: "insideLeft" }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#82ca9d"
                domain={[0, 4]}
                tickFormatter={(value) => {
                  switch (value) {
                    case 4: return "Exc";
                    case 3: return "Good";
                    case 2: return "Fair";
                    case 1: return "Poor";
                    default: return "";
                  }
                }}
                label={{ value: "Quality", angle: -90, position: "insideRight" }}
              />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === "duration") return [`${value} hours`, "Duration"];
                  if (name === "quality") {
                    switch (value) {
                      case 4: return ["Excellent", "Quality"];
                      case 3: return ["Good", "Quality"];
                      case 2: return ["Fair", "Quality"];
                      case 1: return ["Unknown", "Quality"];
                    }
                  }
                  return [value, name];
                }}
                labelFormatter={(date) => format(parseISO(date), "MMMM dd, yyyy")}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="duration"
                stroke="#8884d8"
                yAxisId="left"
                strokeWidth={2}
                activeDot={{ r: 8 }}
                name="Duration"
              />
              <Line
                type="monotone"
                dataKey="quality"
                stroke="#82ca9d"
                yAxisId="right"
                strokeWidth={2}
                activeDot={{ r: 8 }}
                name="Quality"
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {chartType === "pie" && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${value} days`, "Count"]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
