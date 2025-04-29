"use client";

import { useState } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { format, subDays, isSameDay } from 'date-fns';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon } from "lucide-react";

interface ExerciseLog {
  _id: string;
  name: string;
  category: string;
  sets: number;
  reps: number;
  caloriesBurned: number;
  date: string;
  imageUrl?: string;
}

interface MultiExerciseChartProps {
  exercises: ExerciseLog[];
}

type ChartType = "bar" | "pie" | "line";

export function MultiExerciseChart({ exercises }: MultiExerciseChartProps) {
  const [chartType, setChartType] = useState<ChartType>("bar");

  // Process data for bar chart
  const barChartData = exercises
    .slice(0, 7) // Limit to 7 exercises for better visibility
    .map(exercise => ({
      name: exercise.name,
      calories: exercise.caloriesBurned,
      sets: exercise.sets,
      reps: exercise.sets * exercise.reps,
      date: format(new Date(exercise.date), 'MMM dd')
    }));

  // Process data for pie chart (exercise distribution by category)
  const categoryDistribution = exercises.reduce((acc: any, exercise) => {
    const category = exercise.category || "Other";
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const pieChartData = Object.entries(categoryDistribution).map(([category, count]) => ({
    name: category,
    value: count as number,
  }));

  // Process data for line chart (calories burned by day)
  const now = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(now, i);
    return {
      date: date,
      formattedDate: format(date, 'MMM dd'),
      calories: 0,
    };
  }).reverse();

  // Fill in calories data
  exercises.forEach(exercise => {
    const exerciseDate = new Date(exercise.date);
    const dayEntry = last7Days.find(day => isSameDay(day.date, exerciseDate));
    if (dayEntry) {
      dayEntry.calories += exercise.caloriesBurned;
    }
  });

  const lineChartData = last7Days.map(day => ({
    date: day.formattedDate,
    calories: day.calories,
  }));

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

  return (
    <div className="space-y-4">
      <ToggleGroup type="single" value={chartType} onValueChange={(value) => value && setChartType(value as ChartType)}>
        <ToggleGroupItem value="bar" aria-label="Bar Chart" title="Exercise Metrics">
          <BarChart3 className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="pie" aria-label="Pie Chart" title="Category Distribution">
          <PieChartIcon className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="line" aria-label="Line Chart" title="Calories Over Time">
          <LineChartIcon className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>

      <div className="h-[250px]">
        {chartType === "bar" && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barChartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis 
                dataKey="name" 
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                  border: 'none', 
                  borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
                formatter={(value, name) => {
                  if (name === 'calories') return [`${value} cal`, 'Calories Burned'];
                  if (name === 'sets') return [`${value} sets`, 'Sets'];
                  return [`${value} reps`, 'Total Reps'];
                }}
              />
              <Legend />
              <Bar dataKey="calories" fill="#E11D48" name="Calories" />
              <Bar dataKey="sets" fill="#0EA5E9" name="Sets" />
              <Bar dataKey="reps" fill="#10B981" name="Reps" />
            </BarChart>
          </ResponsiveContainer>
        )}

        {chartType === "pie" && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${value} exercises`, 'Count']}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                  border: 'none', 
                  borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}

        {chartType === "line" && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={lineChartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis 
                dataKey="date" 
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                  border: 'none', 
                  borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
                formatter={(value) => [`${value} calories`, 'Burned']}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="calories"
                stroke="#E11D48"
                strokeWidth={2}
                activeDot={{ r: 8 }}
                name="Calories Burned"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
