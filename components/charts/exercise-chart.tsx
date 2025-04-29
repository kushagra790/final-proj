"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';

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

interface ExerciseBarChartProps {
  exercises: ExerciseLog[];
}

export function ExerciseBarChart({ exercises }: ExerciseBarChartProps) {
  // Process data for chart
  const chartData = exercises.map(exercise => ({
    name: exercise.name,
    calories: exercise.caloriesBurned,
    sets: exercise.sets,
    reps: exercise.sets * exercise.reps,
    date: format(new Date(exercise.date), 'MMM dd')
  })).slice(0, 7); // Limit to 7 exercises for better visibility

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
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
  );
}
