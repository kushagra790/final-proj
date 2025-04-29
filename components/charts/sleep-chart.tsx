"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";

interface SleepRecord {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  quality: string;
}

interface SleepChartProps {
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

export function SleepChart({ sleepData }: SleepChartProps) {
  // Format data for chart display - newest first in the API response, but we want oldest first in chart
  const chartData = [...sleepData]
    .reverse()
    .map((record) => ({
      date: record.date,
      duration: Math.round(record.duration / 60 * 10) / 10, // Convert to hours with 1 decimal
      quality: qualityToValue(record.quality),
      qualityLabel: record.quality.charAt(0).toUpperCase() + record.quality.slice(1),
    }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData}>
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
        <Bar
          dataKey="duration"
          fill="#8884d8"
          radius={[4, 4, 0, 0]}
          yAxisId="left"
          name="duration"
        />
        <Bar
          dataKey="quality"
          fill="#82ca9d"
          radius={[4, 4, 0, 0]}
          yAxisId="right"
          name="quality"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
