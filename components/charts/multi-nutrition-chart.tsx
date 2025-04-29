"use client";

import { useState } from "react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip, 
  BarChart, 
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BarChart3, PieChart as PieChartIcon, Radar as RadarIcon } from "lucide-react";

interface NutritionChartProps {
  protein: number;
  carbs: number;
  fat: number;
}

type ChartType = "pie" | "bar" | "radar";

export function MultiNutritionChart({ protein, carbs, fat }: NutritionChartProps) {
  const [chartType, setChartType] = useState<ChartType>("pie");

  // Goals for each macronutrient
  const proteinGoal = 90;
  const carbsGoal = 250;
  const fatGoal = 70;

  // Data for pie chart
  const pieData = [
    { name: 'Protein', value: protein || 0, color: '#4338CA' },
    { name: 'Carbs', value: carbs || 0, color: '#F59E0B' },
    { name: 'Fat', value: fat || 0, color: '#EF4444' },
  ].filter(item => item.value > 0);
  
  // Data for bar chart (comparing to goals)
  const barData = [
    { name: 'Protein', current: protein || 0, goal: proteinGoal, color: '#4338CA' },
    { name: 'Carbs', current: carbs || 0, goal: carbsGoal, color: '#F59E0B' },
    { name: 'Fat', current: fat || 0, goal: fatGoal, color: '#EF4444' },
  ];

  // Data for radar chart (percentage of goals)
  const radarData = [
    { 
      subject: 'Protein', 
      A: Math.min(100, Math.round((protein / proteinGoal) * 100)) || 0,
      fullMark: 100 
    },
    { 
      subject: 'Carbs', 
      A: Math.min(100, Math.round((carbs / carbsGoal) * 100)) || 0,
      fullMark: 100 
    },
    { 
      subject: 'Fat', 
      A: Math.min(100, Math.round((fat / fatGoal) * 100)) || 0,
      fullMark: 100 
    },
  ];

  // If no data, show empty chart with message
  if (pieData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">No nutrition data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ToggleGroup type="single" value={chartType} onValueChange={(value) => value && setChartType(value as ChartType)}>
        <ToggleGroupItem value="pie" aria-label="Pie Chart" title="Macronutrient Breakdown">
          <PieChartIcon className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="bar" aria-label="Bar Chart" title="Progress Towards Goals">
          <BarChart3 className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="radar" aria-label="Radar Chart" title="Goal Achievement">
          <RadarIcon className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>

      <div className="h-[250px]">
        {chartType === "pie" && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => `${value}g`}
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

        {chartType === "bar" && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis type="number" domain={[0, 'dataMax']} />
              <YAxis type="category" dataKey="name" />
              <Tooltip 
                formatter={(value, name, props) => {
                  const item = props.payload as { goal: number };
                  if (name === 'current') {
                    return [`${value}g (${Math.round((Number(value) / item.goal) * 100)}%)`, 'Current'];
                  }
                  return [`${value}g`, 'Target'];
                }}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                  border: 'none', 
                  borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
              />
              <Legend />
              <Bar dataKey="goal" fill="#94A3B8" name="Target" />
              <Bar dataKey="current" fill="#3B82F6" name="Current" />
            </BarChart>
          </ResponsiveContainer>
        )}

        {chartType === "radar" && (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart outerRadius={90} data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar
                name="% of Goal"
                dataKey="A"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
              <Tooltip 
                formatter={(value) => `${value}%`}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                  border: 'none', 
                  borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
