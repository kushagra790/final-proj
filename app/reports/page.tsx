'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "next-auth/react"; // Added import for session
import {
  BoltIcon,
  ChartBarSquareIcon,
  ArrowDownTrayIcon,
  HeartIcon,
  ChartBarIcon,
  ShareIcon,
  FireIcon,
  BeakerIcon,
  CalendarDaysIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/solid";
import { AlertCircle, History, Loader2, SparklesIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmailReportDialog } from "@/components/health-report/email-report-dialog";
import { ShareReportDialog } from "@/components/health-report/share-report-dialog";
import { AiDataNotification } from "@/components/health-report/ai-data-notification";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";

// Skeleton component for loading state
const ReportSkeleton = () => {
  return (
    <div className="w-full grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      
      <Skeleton className="h-16 w-full" />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-[400px]" />
      </div>
    </div>
  );
};

export default function ReportsPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [aiGeneratedDataTypes, setAiGeneratedDataTypes] = useState<string[]>([]);
  const { toast } = useToast();
  const router = useRouter();
  const { data: session, status } = useSession(); // Added session handling

  useEffect(() => {
    // Only fetch data when authenticated
    if (status === "authenticated") {
      fetchReport();
    } else if (status === "unauthenticated") {
      // Redirect to login if not authenticated
      router.push("/login");
    }
    // Don't do anything while status is loading
  }, [status, router]);

  async function fetchReport(regenerate = false) {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/reports${regenerate ? '?regenerate=true' : ''}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch health report');
      }
      
      const data = await response.json();
      setReport(data);
      
      // Check for AI-generated data
      const aiDataTypes = [];
      if (data.aiGenerated) {
        if (data.aiGenerated.vitalSigns) aiDataTypes.push("Vital Signs");
        if (data.aiGenerated.nutritionAdvice) aiDataTypes.push("Nutrition Advice");
        if (data.aiGenerated.predictions) aiDataTypes.push("Health Predictions");
        if (data.aiGenerated.activityData) aiDataTypes.push("Activity Data");
        if (data.aiGenerated.nutritionTrends) aiDataTypes.push("Nutrition Trends");
      }
      setAiGeneratedDataTypes(aiDataTypes);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError('Unable to load your health report. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  async function handleShare() {
    if (!report || !report._id) {
      toast({
        title: "Unable to share",
        description: "Report data is not available. Please try refreshing the page.",
        variant: "destructive",
      });
      return;
    }
    
    setSharing(true);
    
    try {
      // Instead of directly sharing, open the share dialog
      setIsShareDialogOpen(true);
    } catch (err) {
      console.error('Error preparing to share report:', err);
      toast({
        title: "Sharing failed",
        description: "Could not prepare the report for sharing. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSharing(false);
    }
  }

  function handleDownloadPdf() {
    if (!report || !report._id) {
      toast({
        title: "Report not available",
        description: "Please wait for the report to load or try refreshing the page.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Generating PDF",
      description: "Your report is being prepared for download...",
    });
    
    // Use the new dedicated PDF endpoint
    const pdfUrl = `/api/reports/${report._id}/pdf`;
    
    // Create a hidden download link 
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `WellTrack-Health-Report-${new Date(report.generatedAt).toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Show loading state if checking authentication
  if (status === "loading") {
    return (
      <div className="w-full h-full flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (loading) {
    return <ReportSkeleton />;
  }

  if (error) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-6 gap-4">
        <Alert variant="destructive" className="w-full max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => fetchReport()}>Retry</Button>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-6 gap-4">
        <Alert className="w-full max-w-lg">
          <AlertDescription>No health report available. Click below to generate your first report.</AlertDescription>
        </Alert>
        <Button onClick={() => fetchReport(true)}>Generate Report</Button>
      </div>
    );
  }

  function handleHistoryButton(): void {
    router.push('/reports/history');
  }

  return (
    <div className="w-full grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Health Reports</h1>
          <p className="text-muted-foreground">Comprehensive analysis of your health data and trends.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => fetchReport(true)}>
            <ArrowPathIcon className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleShare} disabled={sharing || !report}>
            <ShareIcon className="mr-2 h-4 w-4" />
            {sharing ? "Sharing..." : "Share"}
          </Button>
          <Button onClick={handleDownloadPdf} disabled={!report}>
            <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button onClick={handleHistoryButton} disabled={!report}>
            <History className="mr-2 h-4 w-4" />
            History
          </Button>
        </div>
      </div>

      {/* Display AI data notification if there's AI-generated data */}
      {aiGeneratedDataTypes.length > 0 && (
        <AiDataNotification missingDataTypes={aiGeneratedDataTypes} />
      )}

      {report.summary && (
        <Alert>
          <AlertDescription className="text-sm">{report.summary}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <ChartBarSquareIcon className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="vitals" className="flex items-center gap-2">
            <HeartIcon className="h-4 w-4" />
            Vitals
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <BoltIcon className="h-4 w-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="nutrition" className="flex items-center gap-2">
            <FireIcon className="h-4 w-4" />
            Nutrition
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-red-400 to-pink-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Health Score</CardTitle>
                <HeartIcon className="h-4 w-4 text-white" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{report.healthScore}/100</div>
                <p className="text-xs text-red-100">Based on your health data</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-400 to-indigo-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Activity Level</CardTitle>
                <BoltIcon className="h-4 w-4 text-white" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{report.activityLevel}</div>
                <p className="text-xs text-blue-100">Based on your age group</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-400 to-emerald-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">BMI</CardTitle>
                <ChartBarIcon className="h-4 w-4 text-white" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{report.bmi || "N/A"}</div>
                <p className="text-xs text-green-100">
                  {report.bmi 
                    ? (report.bmi < 18.5 ? "Underweight" 
                      : report.bmi < 25 ? "Normal range" 
                      : report.bmi < 30 ? "Overweight" 
                      : "Obese") 
                    : "Not calculated"
                  }
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-400 to-indigo-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Risk Level</CardTitle>
                <BeakerIcon className="h-4 w-4 text-white" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{report.riskLevel}</div>
                <p className="text-xs text-purple-100">Based on current data</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Yearly Health Trends</CardTitle>
                <CardDescription>Your health metrics over the past 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                {report.nutritionTrends?.labels && report.nutritionTrends.labels.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={report.nutritionTrends.labels.map((label: string, i: number) => {
                        // Ensure the data point exists and has reasonable values
                        return {
                          name: label,
                          calories: report.nutritionTrends.calories && report.nutritionTrends.calories[i] 
                            ? report.nutritionTrends.calories[i] 
                            : 0,
                          weight: report.healthMetrics?.weight 
                            ? report.healthMetrics.weight * (0.98 + (i * 0.005)) // Slight variation for demo
                            : (report.bmi ? (report.bmi * 3 * (0.98 + (i * 0.01))) : 0)
                        };
                      })}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis 
                        yAxisId="left" 
                        label={{ value: 'Calories', angle: -90, position: 'insideLeft' }}
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right"
                        label={{ value: 'Weight (kg)', angle: 90, position: 'insideRight' }}
                      />
                      <Tooltip />
                      <Legend />
                      <Line 
                        yAxisId="left" 
                        type="monotone" 
                        dataKey="calories" 
                        stroke="#8884d8" 
                        activeDot={{ r: 8 }} 
                        name="Calories"
                        strokeWidth={2}
                      />
                      <Line 
                        yAxisId="right" 
                        type="monotone" 
                        dataKey="weight" 
                        stroke="#82ca9d" 
                        name="Weight (kg)"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground p-4">
                    <p className="mb-4">No trend data available yet. Continue tracking to see trends.</p>
                    <Button variant="outline" onClick={() => fetchReport(true)}>
                      <ArrowPathIcon className="mr-2 h-4 w-4" />
                      Generate Report with Sample Data
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Health Predictions</CardTitle>
                <CardDescription>AI-powered health forecasting</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.predictions?.map((item: any, index: number) => (
                    <div key={index} className="flex flex-col space-y-2 rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{item.title}</h4>
                        <CalendarDaysIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-sm">{item.prediction}</p>
                      <p className="text-sm text-muted-foreground">{item.recommendation}</p>
                      <p className="text-xs text-muted-foreground">Timeframe: {item.timeframe}</p>
                    </div>
                  ))}
                  
                  {(!report.predictions || report.predictions.length === 0) && (
                    <div className="text-center p-4 text-muted-foreground">
                      No predictions available yet. Add more health data for better insights.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vitals" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle>Vital Signs History</CardTitle>
                <CardDescription>Detailed view of your vital signs over time</CardDescription>
              </div>
              {report.aiGenerated?.vitalSigns && (
                <span className="flex items-center text-xs text-muted-foreground">
                  <SparklesIcon className="h-3.5 w-3.5 mr-1 text-blue-500" />
                  AI-enhanced data
                </span>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {report.vitalSigns && report.vitalSigns.map((vital: any) => (
                  <div key={vital.title} className="flex flex-col space-y-2">
                    <h3 className="font-semibold">{vital.title}</h3>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Current</p>
                        <p className="text-lg font-medium">{vital.current}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Trend</p>
                        <p className="text-lg font-medium">{vital.trend}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Last Measured</p>
                        <p className="text-lg font-medium">{vital.lastMeasured}</p>
                      </div>
                    </div>
                    {vital.chartData ? (
                      <ResponsiveContainer width="100%" height={100}>
                        <LineChart data={vital.chartData}>
                          <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} dot={false} />
                          <XAxis dataKey="date" hide={true} />
                          <YAxis hide={true} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[100px] flex items-center justify-center text-muted-foreground border rounded-lg">
                        No historical data available
                      </div>
                    )}
                  </div>
                ))}

                {(!report.vitalSigns || report.vitalSigns.length === 0) && (
                  <div className="text-center p-4 text-muted-foreground">
                    No vital sign data available. Continue tracking your health metrics to see data here.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          {report.aiGenerated?.activityData && (
            <Alert variant="default" className="mb-4">
              <SparklesIcon className="h-4 w-4 mr-2 text-blue-500" />
              <AlertDescription>
                These activity insights are AI-generated based on your available health data. 
                Track your activities to get more personalized insights.
              </AlertDescription>
            </Alert>
          )}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-gradient-to-br from-blue-400 to-indigo-500">
              <CardHeader>
                <CardTitle className="text-white">Daily Activity</CardTitle>
                <CardDescription className="text-blue-100">Today's activity summary</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.activityData && report.activityData.daily ? (
                    Object.entries(report.activityData.daily).map(([label, data]: [string, any]) => (
                      <div key={label} className="flex justify-between items-center">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-white">{label}</p>
                          <p className="text-2xl font-bold text-white">{data.value}</p>
                        </div>
                        <p className="text-sm text-blue-100">Target: {data.target}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-4 text-white">
                      No activity data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1 bg-gradient-to-br from-purple-400 to-pink-500">
              <CardHeader>
                <CardTitle className="text-white">Weekly Summary</CardTitle>
                <CardDescription className="text-purple-100">Activity trends this week</CardDescription>
              </CardHeader>
              <CardContent>
                {report.activityData && report.activityData.weeklyChart ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={report.activityData.weeklyChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                      <XAxis dataKey="day" stroke="white" />
                      <YAxis stroke="white" />
                      <Tooltip contentStyle={{ backgroundColor: '#2d3748', color: 'white', border: 'none' }} />
                      <Legend wrapperStyle={{ color: 'white' }} />
                      <Line type="monotone" dataKey="steps" stroke="#8884d8" strokeWidth={2} />
                      <Line type="monotone" dataKey="activeMinutes" stroke="#82ca9d" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-white">
                    Weekly activity data not available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-400 to-emerald-500">
              <CardHeader>
                <CardTitle className="text-white">Activity Types</CardTitle>
                <CardDescription className="text-green-100">Breakdown by activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.activityData && report.activityData.activityTypes ? (
                    report.activityData.activityTypes.map((activity: any) => (
                      <div key={activity.type} className="flex justify-between items-center">
                        <p className="font-medium text-white">{activity.type}</p>
                        <div className="flex gap-4">
                          <p className="text-sm text-green-100">{activity.duration}</p>
                          <p className="text-sm text-green-100">{activity.calories} cal</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-4 text-white">
                      No activity type data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="nutrition" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-gradient-to-br from-yellow-400 to-orange-500">
              <CardHeader>
                <CardTitle className="text-white">Calorie Summary</CardTitle>
                <CardDescription className="text-yellow-100">Today's nutrition overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.nutritionData ? (
                    <>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-white">Consumed</p>
                          <p className="text-2xl font-bold text-white">{report.nutritionData.consumed}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-white">Target</p>
                          <p className="text-2xl font-bold text-white">{report.nutritionData.target}</p>
                        </div>
                      </div>
                      <div className="h-2 bg-yellow-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-white" 
                          style={{ 
                            width: `${Math.min(100, (report.nutritionData.consumed / report.nutritionData.target) * 100)}%` 
                          }} 
                        />
                      </div>
                      <p className="text-sm text-yellow-100 text-center">
                        {report.nutritionData.target - report.nutritionData.consumed} calories remaining
                      </p>
                    </>
                  ) : (
                    <div className="text-center p-4 text-white">
                      No nutrition data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-pink-400 to-red-500">
              <CardHeader>
                <CardTitle className="text-white">Macronutrients</CardTitle>
                <CardDescription className="text-pink-100">Daily breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.nutritionData && report.nutritionData.macros ? (
                    Object.entries(report.nutritionData.macros).map(([name, data]: [string, any]) => (
                      <div key={name} className="space-y-2">
                        <div className="flex justify-between">
                          <p className="font-medium text-white">{name}</p>
                          <p className="text-sm text-pink-100">
                            {data.amount} / {data.target}
                          </p>
                        </div>
                        <div className="h-2 bg-red-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-white"
                            style={{
                              width: `${Math.min(100, ((Number(data.amount) || 0) / (Number(data.target) || 1)) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-4 text-white">
                      No macronutrient data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-400 to-blue-500">
              <CardHeader>
                <CardTitle className="text-white">Meal Log</CardTitle>
                <CardDescription className="text-indigo-100">Today's meals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.nutritionData && report.nutritionData.meals ? (
                    report.nutritionData.meals.map((meal: any) => (
                      <div key={meal.meal} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-white">{meal.meal}</p>
                            <p className="text-sm text-indigo-100">{meal.time}</p>
                          </div>
                          <p className="text-sm font-medium text-white">{meal.calories} cal</p>
                        </div>
                        <p className="text-sm text-indigo-100">{meal.items}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-4 text-white">
                      No meal data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1 lg:col-span-1 bg-gradient-to-br from-indigo-400 to-blue-500">
              <CardHeader>
                <CardTitle className="text-white">Nutrition Trends</CardTitle>
                <CardDescription className="text-indigo-100">6-month history</CardDescription>
              </CardHeader>
              <CardContent className="pb-0">
                {report.nutritionTrends?.labels ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      data={report.nutritionTrends.labels.map((label: string, i: number) => ({
                        name: label,
                        protein: report.nutritionTrends.protein[i],
                        carbs: report.nutritionTrends.carbs[i],
                        fats: report.nutritionTrends.fats[i],
                      }))}
                      margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.2)" />
                      <XAxis dataKey="name" stroke="white" tick={{ fill: 'white' }} />
                      <YAxis stroke="white" tick={{ fill: 'white' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#2d3748", color: "white", border: "none" }}
                      />
                      <Legend wrapperStyle={{ color: "white" }} />
                      <Bar dataKey="protein" name="Protein (g)" stackId="a" fill="#8884d8" />
                      <Bar dataKey="carbs" name="Carbs (g)" stackId="a" fill="#82ca9d" />
                      <Bar dataKey="fats" name="Fats (g)" stackId="a" fill="#ffc658" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-white">
                    No nutrition trend data available yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

            <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
              <CardTitle>Nutrition Advice</CardTitle>
              <CardDescription>Recommendations based on your nutritional patterns</CardDescription>
              </div>
              {report.aiGenerated?.nutritionAdvice && (
              <span className="flex items-center text-xs text-muted-foreground">
                <SparklesIcon className="h-3.5 w-3.5 mr-1 text-blue-500" />
                AI-powered advice
              </span>
              )}
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                {report.nutritionAdvice ? (
                <div className="space-y-4">
                <p><ReactMarkdown>{report.nutritionAdvice.summary}</ReactMarkdown></p>
                <ul className="list-disc pl-5 space-y-2">
                  {report.nutritionAdvice.recommendations.map((rec: string, i: number) => (
                  <li key={i} dangerouslySetInnerHTML={{ __html: rec }} />
                  ))}
                </ul>
                </div>
                ) : (
                <div className="text-center p-4 text-muted-foreground">
                No nutrition advice available yet. Continue tracking your nutrition to receive personalized advice.
                </div>
                )}
                </div>
            </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
      
      {report && (
        <ShareReportDialog
          open={isShareDialogOpen}
          onClose={() => setIsShareDialogOpen(false)}
          reportId={report._id}
          reportTitle={report.title}
        />
      )}
      
      {report && (
        <EmailReportDialog
          open={isEmailDialogOpen}
          onClose={() => setIsEmailDialogOpen(false)}
          reportId={report._id}
          reportTitle={report.title}
        />
      )}
    </div>
  );
}

