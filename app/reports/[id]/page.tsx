'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from "recharts";
import { 
  ArrowLeftIcon, 
  DocumentArrowDownIcon,
  ShareIcon,
  CalendarDaysIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ShareReportDialog } from "@/components/health-report/share-report-dialog";

export default function ReportDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchReportDetail() {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/reports/${params.id}`, {
          credentials: 'include', // Include cookies for authentication
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API Error Response:', response.status, errorData);
          throw new Error(errorData.error || `Failed to fetch report details (Status: ${response.status})`);
        }
        
        const data = await response.json();
        console.log('Report data received:', data);
        setReport(data);
      } catch (err) {
        console.error('Error fetching report details:', err);
        setError(err instanceof Error ? err.message : 'Unable to load the report details. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchReportDetail();
  }, [params.id]);
  
  if (loading) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-16 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }
  
  if (error || !report) {
    return (
      <div className="container py-6">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <div className="mt-6 flex flex-col items-center justify-center p-6 gap-4">
          <Alert variant="destructive" className="w-full max-w-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || "Report not found. It may have been deleted or you don't have access to it."}
            </AlertDescription>
          </Alert>
          <Button onClick={() => router.push('/reports')}>View All Reports</Button>
        </div>
      </div>
    );
  }
  
  // Format date for display
  const reportDate = new Date(report.generatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const reportTime = new Date(report.generatedAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleDownloadPdf = () => {
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
  };
  
  const handleShare = () => {
    if (report) {
      setIsShareDialogOpen(true);
    }
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">{report.title}</h1>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDaysIcon className="h-4 w-4" />
          <span>{reportDate}</span>
          <ClockIcon className="h-4 w-4 ml-2" />
          <span>{reportTime}</span>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Health Summary</CardTitle>
          <CardDescription>Overall analysis of your health status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>{report.summary}</p>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-6">
              <div className="flex flex-col p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <span className="text-sm text-muted-foreground">Health Score</span>
                <span className="text-2xl font-bold">{report.healthScore}/100</span>
              </div>
              <div className="flex flex-col p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <span className="text-sm text-muted-foreground">BMI</span>
                <span className="text-2xl font-bold">{report.bmi || "N/A"}</span>
              </div>
              <div className="flex flex-col p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <span className="text-sm text-muted-foreground">Activity Level</span>
                <span className="text-2xl font-bold">{report.activityLevel}</span>
              </div>
              <div className="flex flex-col p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <span className="text-sm text-muted-foreground">Risk Level</span>
                <span className="text-2xl font-bold">{report.riskLevel}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Health Trends</CardTitle>
            <CardDescription>Nutritional and activity data over time</CardDescription>
          </CardHeader>
          <CardContent>
            {report.nutritionTrends?.labels ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={report.nutritionTrends.labels.map((label: string, i: number) => ({
                    name: label,
                    calories: report.nutritionTrends.calories[i],
                    protein: report.nutritionTrends.protein[i]
                  }))}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="calories" stroke="#8884d8" name="Calories" />
                  <Line yAxisId="right" type="monotone" dataKey="protein" stroke="#82ca9d" name="Protein (g)" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No trend data available
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Predicted Health Outcomes</CardTitle>
            <CardDescription>AI-generated health predictions based on your data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.predictions?.map((prediction: any, index: number) => (
                <div key={index} className="border rounded-md p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{prediction.title}</h3>
                    <span className="text-xs text-muted-foreground">{prediction.timeframe}</span>
                  </div>
                  <p className="text-sm mb-2">{prediction.prediction}</p>
                  <p className="text-sm text-muted-foreground">{prediction.recommendation}</p>
                </div>
              ))}
              
              {(!report.predictions || report.predictions.length === 0) && (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                  No predictions available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Detailed Metrics</CardTitle>
          <CardDescription>Breakdown of your health metrics by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Nutrition</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={[
                    {
                      name: "Recent Average",
                      calories: report.nutritionTrends?.calories?.[report.nutritionTrends.calories.length-1] || 0,
                      protein: report.nutritionTrends?.protein?.[report.nutritionTrends.protein.length-1] || 0,
                      carbs: report.nutritionTrends?.carbs?.[report.nutritionTrends.carbs.length-1] || 0,
                      fats: report.nutritionTrends?.fats?.[report.nutritionTrends.fats.length-1] || 0,
                    },
                    {
                      name: "Target",
                      calories: report.targets?.calories || 0,
                      protein: report.targets?.protein || 0,
                      carbs: report.targets?.carbs || 0,
                      fats: report.targets?.fats || 0,
                    }
                  ]}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="calories" fill="#8884d8" name="Calories" />
                  <Bar dataKey="protein" fill="#82ca9d" name="Protein (g)" />
                  <Bar dataKey="carbs" fill="#ffc658" name="Carbs (g)" />
                  <Bar dataKey="fats" fill="#ff8042" name="Fats (g)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Activity</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={[
                    {
                      name: "Recent Average",
                      steps: report.activityTrends?.steps?.[report.activityTrends.steps.length-1] || 0,
                      activeMinutes: report.activityTrends?.activeMinutes?.[report.activityTrends.activeMinutes.length-1] || 0,
                      caloriesBurned: report.activityTrends?.caloriesBurned?.[report.activityTrends.caloriesBurned.length-1] || 0,
                    },
                    {
                      name: "Target",
                      steps: report.activityTargets?.steps || 0,
                      activeMinutes: report.activityTargets?.activeMinutes || 0,
                      caloriesBurned: report.activityTargets?.caloriesBurned || 0,
                    }
                  ]}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="steps" fill="#8884d8" name="Steps" />
                  <Bar dataKey="activeMinutes" fill="#82ca9d" name="Active Minutes" />
                  <Bar dataKey="caloriesBurned" fill="#ffc658" name="Calories Burned" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => window.print()}>
          <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
          Print Report
        </Button>
        <Button variant="outline" onClick={handleShare}>
          <ShareIcon className="h-4 w-4 mr-2" />
          Share Report
        </Button>
        <Button onClick={handleDownloadPdf}>
          <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>
      
      {/* Add Share Dialog */}
      {report && (
        <ShareReportDialog
          open={isShareDialogOpen}
          onClose={() => setIsShareDialogOpen(false)}
          reportId={report._id}
          reportTitle={report.title}
        />
      )}
    </div>
  );
}
