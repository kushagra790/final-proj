'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ChevronRightIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { AlertCircle } from "lucide-react";

export default function ReportHistoryPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReportHistory();
  }, []);

  async function fetchReportHistory() {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/reports/history');
      
      if (!response.ok) {
        throw new Error('Failed to fetch report history');
      }
      
      const data = await response.json();
      setReports(data);
    } catch (err) {
      console.error('Error fetching report history:', err);
      setError('Unable to load your report history. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Report History</h1>
          <Button variant="outline" disabled>
            <ArrowPathIcon className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
        
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Report History</h1>
          <Button variant="outline" onClick={fetchReportHistory}>
            <ArrowPathIcon className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Report History</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchReportHistory}>
            <ArrowPathIcon className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Link href="/reports">
            <Button>
              <DocumentTextIcon className="mr-2 h-4 w-4" />
              Latest Report
            </Button>
          </Link>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Reports Found</h2>
          <p className="text-muted-foreground mb-6">
            You haven't generated any health reports yet. Generate your first report to see it here.
          </p>
          <Link href="/reports">
            <Button>Generate New Report</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            // Format date
            const reportDate = new Date(report.generatedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            
            return (
              <Card key={report._id} className="overflow-hidden hover:bg-muted/50 transition-colors">
                <Link href={`/reports/${report._id}`} className="block">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{report.title}</CardTitle>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        {reportDate}
                      </div>
                    </div>
                    <CardDescription className="line-clamp-2">{report.summary}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex items-center">
                      <div className="text-sm bg-primary/10 text-primary font-medium rounded-full px-3 py-1">
                        Health Score: {report.healthScore}/100
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between text-sm text-muted-foreground pt-0">
                    <span>View Details</span>
                    <ChevronRightIcon className="h-4 w-4" />
                  </CardFooter>
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
