"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Loader2, Activity, Heart, Droplets, Scale, Utensils, Moon, Plus, PenBox, Pencil, History, Zap, TrendingUp, Salad, ThermometerSnowflake, CalendarClock, Wind, HeartIcon, BoltIcon, MoonIcon } from "lucide-react"
import Link from "next/link"
import FillData from "@/components/fill-data"
import { HealthMetricsDisplay } from "@/components/health-metrics-display"
import { HealthInsights } from "@/components/insights/health-insights"
import { FireIcon } from "@heroicons/react/24/solid"
import { format } from "date-fns"
import { Loader } from "@/components/loader"
import ReactMarkdown from "react-markdown"

interface HealthMetrics {
  id: string
  userId: string
  height: number
  weight: number
  age: number
  gender: string
  activityLevel: string
  bloodPressure?: string
  heartRate?: number
  sleepDuration?: number
  stressLevel?: number
  recordedAt: string
  // Additional fields from the API
  dateOfBirth?: string
  email?: string
  phone?: string
  emergencyContact?: string
  emergencyPhone?: string
  smokingStatus?: string
  dietType?: string
  respiratoryRate?: number
  temperature?: number
  chronicConditions?: string[]
  allergies?: string[]
  medications?: string[]
  familyHistory?: string[]
  surgeries?: string[]
  fitnessGoals?: string[]
  history?: any[]
  historyCount?: number
  hasHistoricalData?: boolean
}

export default function DashboardPage() {
 const router = useRouter()
  const { data: session, status } = useSession()
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [historyData, setHistoryData] = useState<any[]>([])
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [lastFetchTime, setLastFetchTime] = useState(0)
  const [summaryInsights, setSummaryInsights] = useState<any>(null)
  const [recommendations, setRecommendations] = useState<any>(null)
  const [insightsLoading, setInsightsLoading] = useState(false)

  // Function to switch to insights tab
  const switchToInsightsTab = () => {
    setActiveTab("insights")
  }
  
  // Robust data fetching with exponential backoff
  const fetchHealthMetricsWithRetry = async (retryCount = 0, delay = 1000) => {
    // Avoid refetching if we just fetched recently (within 2 seconds)
    const now = Date.now()
    if (now - lastFetchTime < 2000 && retryCount > 0) {
      return
    }
    
    setLoading(true)
    setFetchError(null)
    setLastFetchTime(now)
    
    try {
      console.log(`Attempting to fetch health metrics (attempt ${retryCount + 1})`)
      
      // Make sure we're bypassing cache completely
      const response = await fetch(`/api/health/latest?t=${now}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        next: { revalidate: 0 },
      })
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (!data || Object.keys(data).length === 0) {
        throw new Error("Empty data received")
      }
      
      console.log("Successfully loaded health metrics:", data)
      setHealthMetrics(data)
      return true
    } catch (error) {
      console.error(`Error fetching health metrics (attempt ${retryCount + 1}):`, error)
      setFetchError(`Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      // Implement exponential backoff for retries
      const maxRetries = 5
      if (retryCount < maxRetries) {
        const nextDelay = delay * 1.5 // Exponential backoff
        console.log(`Retrying in ${nextDelay}ms...`)
        
        setTimeout(() => {
          fetchHealthMetricsWithRetry(retryCount + 1, nextDelay)
        }, nextDelay)
      }
      return false
    } finally {
      setLoading(false)
    }
  }

  const fetchHistoryData = async () => {
    try {
      console.log("Fetching health history data...")
      setLoading(true)
      const response = await fetch("/api/health/history")
      
      if (!response.ok) {
        throw new Error("Failed to fetch health history")
      }
      
      const data = await response.json()
      console.log("Successfully fetched history data:", data)
      setHistoryData(data)
    } catch (error) {
      console.error("Error fetching health history:", error)
      setFetchError(`Failed to load history data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Only fetch data if the user is authenticated
    if (status === "authenticated") {
      fetchHealthMetricsWithRetry()
      fetchHistoryData()
      fetchInsightsData() // Fetch AI insights and recommendations
      // Setup an interval to check if data is loaded
      // This helps in cases where the initial load fails
      const checkInterval = setInterval(() => {
        if (!healthMetrics && !loading) {
          console.log("No health metrics loaded yet, retrying fetch...")
          fetchHealthMetricsWithRetry()
        } else if (healthMetrics) {
          // Clear interval once we have data
          clearInterval(checkInterval)
        }
      }, 3000) // Check every 3 seconds
      
      // Cleanup interval on unmount
      return () => clearInterval(checkInterval)
    } else if (status === "unauthenticated") {
      // If definitely not authenticated, redirect to login
      router.push("/login")
    }
    // Don't do anything while status is "loading"
  }, [status, router])

  // Function to fetch AI insights and recommendations
  const fetchInsightsData = async () => {
    setInsightsLoading(true)
    try {
      // Fetch summary insights
      const summaryResponse = await fetch('/api/health/insights?type=summary')
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json()
        setSummaryInsights(summaryData)
      }
      
      // Fetch recommendations (using lifestyle endpoint)
      const recommendationsResponse = await fetch('/api/health/insights?type=lifestyle')
      if (recommendationsResponse.ok) {
        const recommendationsData = await recommendationsResponse.json()
        setRecommendations(recommendationsData)
      }
    } catch (error) {
      console.error("Error fetching insights data:", error)
    } finally {
      setInsightsLoading(false)
    }
  }

  // Add a manual refresh option for users
  const handleManualRefresh = () => {
    fetchHealthMetricsWithRetry()
  }

  // Show loading state while checking authentication or fetching data
  if (status === "loading" || (status === "authenticated" && loading && !healthMetrics)) {
    return (
      <Loader />
    )
  }

  // If not authenticated, don't render anything (we're redirecting)
  if (status === "unauthenticated") {
    return null
  }

  // If authenticated but no health data and not currently loading
  if (!healthMetrics && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Unable to load your health data</h2>
          <p className="text-muted-foreground mb-4">
            {fetchError || "We're having trouble connecting to the server."}
          </p>
          <Button onClick={handleManualRefresh} className="mb-4">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Retry Loading Data
          </Button>
          <p className="text-sm text-muted-foreground">
            If this issue persists, you might need to fill in your health profile.
          </p>
        </div>
        <FillData />
      </div>
    )
  }
  
    // Extract blood pressure values if available
    let systolic = 0, diastolic = 0;
    if (healthMetrics?.bloodPressure) {
      const parts = healthMetrics.bloodPressure.split('/');
      if (parts.length === 2) {
        systolic = parseInt(parts[0], 10);
        diastolic = parseInt(parts[1], 10);
      }
    }
    

  return (
    <div className="w-full grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your health overview.</p>
        </div>
        <div>
        <Button className="mr-2" onClick={() => router.push("/dashboard/history")}>History</Button>
        <Button onClick={() => router.push("/initial-health-form")}>Update Health Data</Button>
        </div>
        
      </div>

      

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 h-14 mb-6">
          <TabsTrigger value="overview" className="text-base">Overview</TabsTrigger>
          <TabsTrigger value="details" className="text-base">Health Details</TabsTrigger>
          <TabsTrigger value="insights" className="text-base">AI Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-red-400 to-pink-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Heart Rate</CardTitle>
            <HeartIcon className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{healthMetrics?.heartRate || "N/A"} BPM</div>
            <p className="text-xs text-red-100">Last measured</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-400 to-indigo-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Blood Pressure</CardTitle>
            <BoltIcon className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{healthMetrics?.bloodPressure || "N/A"}</div>
            <p className="text-xs text-blue-100">Last measured</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-400 to-indigo-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Sleep</CardTitle>
            <MoonIcon className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{healthMetrics?.sleepDuration || "N/A"} hrs</div>
            <p className="text-xs text-purple-100">Last night</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-400 to-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Stress Level</CardTitle>
            <FireIcon className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{healthMetrics?.stressLevel || "N/A"}</div>
            <p className="text-xs text-green-100">Current level</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
            {/* Health Summary Card - AI Generated */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle>Health Summary</CardTitle>
                  <div className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">AI Generated</div>
                </div>
                <CardDescription>Overall health assessment based on your data</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {insightsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : summaryInsights ? (
                  <div className="space-y-4">
                    {summaryInsights.insight ? (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>
                          {summaryInsights.insight.length > 300 
                            ? `${summaryInsights.insight.slice(0, 300)}...` 
                            : summaryInsights.insight
                          }
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="flex items-start">
                        <div className="bg-green-100 p-2 rounded-full mr-3">
                          <Zap className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">No insights available yet</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            We need more data to generate personalized insights.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-start">
                    <div className="bg-green-100 p-2 rounded-full mr-3">
                      <Zap className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Unable to load insights</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Please try again later.
                      </p>
                    </div>
                  </div>
                )}
                <Button 
                  className="w-full mt-6" 
                  variant="outline" 
                  onClick={switchToInsightsTab}
                >
                  View Detailed AI Insights
                </Button>
              </CardContent>
            </Card>
            
            {/* Recommendations Card - AI Generated */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle>Personalized Recommendations</CardTitle>
                  <div className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">AI Generated</div>
                </div>
                <CardDescription>Based on your recent health data</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {insightsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : recommendations ? (
                  <div className="space-y-4">
                    {recommendations.insight ? (
                      recommendations.insight.split('\n')
                        .filter((line: string) => line.trim().length > 0)
                        .slice(0, 4)
                        .map((recommendation: string, index: number) => {
                          // Extract only the recommendation text without numbering
                          const cleanRec = recommendation.replace(/^\d+\.\s*/, '').trim();
                          
                          // Define icons for different types of recommendations
                          const icons = [
                            { icon: <Droplets className="h-4 w-4 text-amber-600" />, bg: "bg-amber-100" },
                            { icon: <Activity className="h-4 w-4 text-purple-600" />, bg: "bg-purple-100" },
                            { icon: <Moon className="h-4 w-4 text-green-600" />, bg: "bg-green-100" },
                            { icon: <Heart className="h-4 w-4 text-blue-600" />, bg: "bg-blue-100" }
                          ];
                          
                          // Get icon based on index (cycle through available icons)
                          const iconData = icons[index % icons.length];
                          
                          return (
                            <div key={index} className="flex items-start">
                              <div className={`min-w-6 h-6 rounded-full ${iconData.bg} flex items-center justify-center mr-3 mt-0.5`}>
                                {iconData.icon}
                              </div>
                              <div className="prose prose-sm max-w-none">
                                <ReactMarkdown>{cleanRec}</ReactMarkdown>
                              </div>
                            </div>
                          );
                        })
                    ) : (
                      <div className="flex items-center">
                        <div className="min-w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                          <Activity className="h-4 w-4 text-blue-600" />
                        </div>
                        <p>No recommendations available yet</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="min-w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                        <Activity className="h-4 w-4 text-amber-600" />
                      </div>
                      <p>Unable to load recommendations</p>
                    </div>
                  </div>
                )}
                <Button 
                  className="w-full mt-6" 
                  variant="outline" 
                  onClick={switchToInsightsTab}
                >
                  View All AI Recommendations
                </Button>
              </CardContent>
            </Card>
          </div>        

        </TabsContent>        
        {/* Health Details Tab - New */}
        <TabsContent value="details" className="space-y-6">
          <div className="bg-slate-50 p-6 rounded-lg mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Complete Health Profile</h3>
              <Link href="/initial-health-form">
                <Button variant="outline" size="sm">
                  <Pencil className="h-4 w-4 mr-1" /> Update Health Data
                </Button>
              </Link>
            </div>
            <p className="text-muted-foreground">View all your health metrics and medical information in one place.</p>
          </div>
          
          <HealthMetricsDisplay healthMetrics={healthMetrics} />
        </TabsContent>
        
        {/* AI Insights Tab - New */}
        <TabsContent value="insights" id="insights" className="space-y-6">
          <div className="bg-slate-50 p-6 rounded-lg mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">AI-Powered Health Insights</h3>
              <div className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Powered by Gemini AI</div>
            </div>
            <p className="text-muted-foreground">Get personalized health insights and recommendations based on your data.</p>
          </div>
          
          {healthMetrics?.userId && (
            <HealthInsights userId={healthMetrics.userId} />
          )}
        </TabsContent>
        
      </Tabs>

    </div>
  )
}
