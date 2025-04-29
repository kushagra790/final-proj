'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { AlertCircle, Calendar, Clock } from "lucide-react";

export default function SharedReportPage({ params }: { params: { id: string } }) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSharedReport() {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/reports/shared/${params.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch shared report');
        }
        
        const data = await response.json();
        setReport(data);
      } catch (err) {
        console.error('Error fetching shared report:', err);
        setError('This shared report is unavailable or has expired.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchSharedReport();
  }, [params.id]);
  
  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-10 space-y-6">
        <Skeleton className="h-12 w-96 mx-auto" />
        <Skeleton className="h-6 w-64 mx-auto" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }
  
  if (error || !report) {
    return (
      <div className="container max-w-4xl mx-auto py-10 flex flex-col items-center">
        <Alert variant="destructive" className="w-full max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "This shared report is not available."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // Format report date
  const reportDate = new Date(report.generatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="container max-w-4xl mx-auto py-10 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">{report.title}</h1>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
          <Calendar className="h-4 w-4" />
          <span>{reportDate}</span>
        </div>
      </div>
      
      <Alert className="bg-slate-100 dark:bg-slate-800 border-none">
        <AlertDescription className="text-center">
          {report.summary}
        </AlertDescription>
      </Alert>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Health Overview</CardTitle>
          <CardDescription className="text-center">Key metrics from this health report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <span className="text-sm text-muted-foreground mb-1">Health Score</span>
              <span className="text-2xl font-bold">{report.healthScore}/100</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <span className="text-sm text-muted-foreground mb-1">BMI</span>
              <span className="text-2xl font-bold">{report.bmi || "N/A"}</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <span className="text-sm text-muted-foreground mb-1">Activity Level</span>
              <span className="text-2xl font-bold">{report.activityLevel}</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <span className="text-sm text-muted-foreground mb-1">Risk Level</span>
              <span className="text-2xl font-bold">{report.riskLevel}</span>
            </div>
          </div>
          
          {report.nutritionTrends?.labels && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4 text-center">Nutritional Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={report.nutritionTrends.labels.map((label: string, i: number) => ({
                    name: label,
                    calories: report.nutritionTrends.calories[i],
                    protein: report.nutritionTrends.protein[i],
                    carbs: report.nutritionTrends.carbs[i],
                    fats: report.nutritionTrends.fats[i]
                  }))}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="calories" stroke="#8884d8" name="Calories" />
                  <Line type="monotone" dataKey="protein" stroke="#82ca9d" name="Protein (g)" />
                  <Line type="monotone" dataKey="carbs" stroke="#ffc658" name="Carbs (g)" />
                  <Line type="monotone" dataKey="fats" stroke="#ff8042" name="Fats (g)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Health Predictions</CardTitle>
          <CardDescription className="text-center">Based on health data analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {report.predictions?.map((prediction: any, index: number) => (
              <div key={index} className="border rounded-md p-4">
                <div className="mb-2">
                  <h3 className="font-semibold">{prediction.title}</h3>
                  <p className="text-xs text-muted-foreground">{prediction.timeframe}</p>
                </div>
                <p className="text-sm mb-2">{prediction.prediction}</p>
                <p className="text-sm text-muted-foreground">{prediction.recommendation}</p>
              </div>
            ))}
            
            {(!report.predictions || report.predictions.length === 0) && (
              <div className="col-span-3 text-center p-4 text-muted-foreground">
                No health predictions available for this report.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="border-t pt-6 text-center text-sm text-muted-foreground">
        <p>This health report was shared with you by a Well Track user.</p>
        <p>Report generated on {reportDate}.</p>
      </div>
    </div>
  );
}
