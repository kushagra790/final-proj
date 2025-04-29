"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface NutritionChartProps {
  protein: number;
  carbs: number;
  fat: number;
}

export function NutritionChart({ protein, carbs, fat }: NutritionChartProps) {
  const data = [
    { name: 'Protein', value: protein || 0, color: '#4338CA' },
    { name: 'Carbs', value: carbs || 0, color: '#F59E0B' },
    { name: 'Fat', value: fat || 0, color: '#EF4444' },
  ];

  // Filter out zero values
  const filteredData = data.filter(item => item.value > 0);
  
  // If no data, show empty chart with message
  if (filteredData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">No nutrition data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={filteredData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {filteredData.map((entry, index) => (
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
  );
}
