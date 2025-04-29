"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader,CardDescription, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion, AnimatePresence } from "framer-motion"
import { HeartIcon, BeakerIcon, LightBulbIcon,BoltIcon } from "@heroicons/react/24/solid"
import { 
  Activity, Heart, Thermometer, Moon, BarChart3, Scale,
  TrendingUp, Clock, Zap, Users, Info, AlertTriangle
} from "lucide-react"
import FillData from "@/components/fill-data"
import { format } from "date-fns"
import { Progress } from "@/components/ui/progress"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Loader } from "@/components/loader"

interface HealthMetrics {
    id:string;
    userId: string;
    height: number;
    weight: number;
    age: number;
    gender: string;
    dateOfBirth?: Date;
    email?: string;
    phone?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    activityLevel: string;
    smokingStatus?: string;
    dietType?: string;
    bloodPressure?: string;
    heartRate?: number;
    respiratoryRate?: number;
    temperature?: number;
    sleepDuration?: number;
    stressLevel?: number;
    chronicConditions?: string;
    allergies?: string;
    medications?: string;
    familyHistory?: string;
    surgeries?: string;
    fitnessGoals?: string;
    recordedAt: Date;
    history?: any[];
    hasHistoricalData?: boolean;
}

interface FormattedDataEntry {
  date: string;
  weight?: number;
  heartRate?: number;
  sleepDuration?: number;
  stressLevel?: number;
  bp_systolic?: number;
  bp_diastolic?: number;
  timestamp: number;
  [key: string]: string | number | undefined;
}

const MotionCard = motion(Card);
const MotionCardContent = motion(CardContent);
const MotionTabsContent = motion(TabsContent);

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  },
  hover: { scale: 1.02, transition: { duration: 0.2 } }
};

const chartVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

const tabContentVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: 20, transition: { duration: 0.2 } }
};

export default function MetricsPage() {
  const router = useRouter()
   const { data: session, status } = useSession()
   const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null)
   const [loading, setLoading] = useState(true)
   const [activeTab, setActiveTab] = useState("overview")
   const [historyData, setHistoryData] = useState<any[]>([])
   const [fetchError, setFetchError] = useState<string | null>(null)
   const [lastFetchTime, setLastFetchTime] = useState(0)
 

  useEffect(() => {
    // Only fetch data if the user is authenticated
    if (status === "authenticated") {
      fetchHealthMetricsWithRetry()
      fetchHistoryData()
    } else if (status === "unauthenticated") {
      // If definitely not authenticated, redirect to login
      router.push("/login")
    }
    // Don't do anything while status is "loading"
  }, [status, router])

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
      const response = await fetch("/api/health/history")
      
      if (!response.ok) {
        throw new Error("Failed to fetch health history")
      }
      
      const data = await response.json()
      setHistoryData(data)
    } catch (error) {
      console.error("Error fetching health history:", error)
    }
  }

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'No date available';
    try {
      return format(new Date(date), 'MMMM dd, yyyy');
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Invalid date";
    }
  };
  
  // Format data for charts
  const formattedData: FormattedDataEntry[] = historyData.map(record => {
    // Parse blood pressure if available
    let bp_systolic, bp_diastolic;
    if (record.bloodPressure) {
      const parts = record.bloodPressure.split('/');
      if (parts.length === 2) {
        bp_systolic = parseInt(parts[0], 10);
        bp_diastolic = parseInt(parts[1], 10);
      }
    }
    
    return {
      date: format(new Date(record.recordedAt), 'MMM d'),
      weight: record.weight,
      heartRate: record.heartRate,
      sleepDuration: record.sleepDuration,
      stressLevel: record.stressLevel,
      bp_systolic,
      bp_diastolic,
      timestamp: new Date(record.recordedAt).getTime(),
    };
  }).sort((a, b) => a.timestamp - b.timestamp);

  // Show an animated loading state while checking authentication or fetching data
  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <Loader/>
    )
  }

  // If not authenticated, don't render anything (we're redirecting)
  if (status === "unauthenticated") {
    return null
  }

  // If authenticated but no health data
  if (!healthMetrics && !loading) {
    return <FillData />
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
    <motion.div 
      initial="hidden" 
      animate="visible"
      variants={containerVariants}
      className="w-full grid gap-6"
    >
      <motion.div 
        variants={itemVariants} 
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Health Metrics</h1>
          <p className="text-muted-foreground">
            Last updated: {healthMetrics ? formatDate(healthMetrics.recordedAt) : 'Loading...'}
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button variant="outline" asChild>
            <Link href="/dashboard/history">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Full History
            </Link>
          </Button>
        </motion.div>
      </motion.div>

      <motion.div 
        variants={containerVariants} 
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <MotionCard 
          variants={itemVariants}
          whileHover="hover"
          className="bg-gradient-to-br from-red-400 to-pink-500"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white">Blood Pressure</CardTitle>
            <motion.div 
              whileHover={{ scale: 1.2, rotate: 5 }}
              animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <HeartIcon className="h-4 w-4 text-white" />
            </motion.div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {healthMetrics?.bloodPressure || 'N/A'}
            </div>
            <p className="text-xs text-red-100">
              {systolic ? 
                (systolic > 140 || diastolic > 90 ? 'High' : 
                 systolic < 90 || diastolic < 60 ? 'Low' : 'Normal range') : 
                'No data available'}
            </p>
          </CardContent>
        </MotionCard>
        <MotionCard 
          variants={itemVariants}
          whileHover="hover"
          className="bg-gradient-to-br from-blue-400 to-indigo-500"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white">Heart Rate</CardTitle>
            <motion.div 
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <BoltIcon className="h-4 w-4 text-white" />
            </motion.div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {healthMetrics?.heartRate ? `${healthMetrics.heartRate} BPM` : 'N/A'}
            </div>
            <p className="text-xs text-blue-100">
              {healthMetrics?.heartRate ? 
                (healthMetrics.heartRate > 100 ? 'Elevated' : 
                 healthMetrics.heartRate < 60 ? 'Low' : 'Normal range') : 
                'No data available'}
            </p>
          </CardContent>
        </MotionCard>
        <MotionCard 
          variants={itemVariants}
          whileHover="hover"
          className="bg-gradient-to-br from-purple-400 to-indigo-500"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white">Sleep Duration</CardTitle>
            <motion.div
              animate={{ rotate: [0, 10, 0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            >
              <Moon className="h-4 w-4 text-white" />
            </motion.div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {healthMetrics?.sleepDuration ? `${healthMetrics.sleepDuration}h` : 'N/A'}
            </div>
            <p className="text-xs text-purple-100">
              {healthMetrics?.sleepDuration ? 
                (healthMetrics.sleepDuration < 6 ? 'Insufficient' : 
                 healthMetrics.sleepDuration > 9 ? 'Excessive' : 'Optimal') : 
                'No data available'}
            </p>
          </CardContent>
        </MotionCard>
        <MotionCard 
          variants={itemVariants}
          whileHover="hover"
          className="bg-gradient-to-br from-green-400 to-emerald-500"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white">Stress Level</CardTitle>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Activity className="h-4 w-4 text-white" />
            </motion.div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {healthMetrics?.stressLevel ? `${healthMetrics.stressLevel}/10` : 'N/A'}
            </div>
            <p className="text-xs text-green-100">
              {healthMetrics?.stressLevel ? 
                (healthMetrics.stressLevel >= 7 ? 'High' : 
                 healthMetrics.stressLevel <= 3 ? 'Low' : 'Moderate') : 
                'No data available'}
            </p>
          </CardContent>
        </MotionCard>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="vitals">Vitals</TabsTrigger>
            <TabsTrigger value="lifestyle">Lifestyle</TabsTrigger>
            <TabsTrigger value="medical">Medical Info</TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <MotionTabsContent
              key={activeTab}
              value="overview"
              variants={tabContentVariants}
              initial="hidden"
              animate={activeTab === "overview" ? "visible" : "hidden"}
              exit="exit"
              className="space-y-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <MotionCard variants={itemVariants} whileHover="hover">
                  <CardHeader>
                    <CardTitle>General Health</CardTitle>
                    <CardDescription>Your basic health metrics</CardDescription>
                  </CardHeader>
                  <MotionCardContent
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Height</span>
                      <span className="font-medium">{healthMetrics?.height || 'N/A'} cm</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Weight</span>
                      <span className="font-medium">{healthMetrics?.weight || 'N/A'} kg</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">BMI</span>
                      <span className="font-medium">
                        {healthMetrics?.height && healthMetrics?.weight
                          ? (healthMetrics.weight / Math.pow(healthMetrics.height / 100, 2)).toFixed(1)
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Age</span>
                      <span className="font-medium">{healthMetrics?.age || 'N/A'} years</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Gender</span>
                      <span className="font-medium">{healthMetrics?.gender || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Activity Level</span>
                      <span className="font-medium">{healthMetrics?.activityLevel || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Diet Type</span>
                      <span className="font-medium">{healthMetrics?.dietType || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Smoking Status</span>
                      <span className="font-medium">{healthMetrics?.smokingStatus || 'N/A'}</span>
                    </div>
                  </MotionCardContent>
                </MotionCard>

                <MotionCard variants={itemVariants} whileHover="hover">
                  <CardHeader>
                    <CardTitle>Weight Trends</CardTitle>
                    <CardDescription>Your weight over time</CardDescription>
                  </CardHeader>
                  <MotionCardContent>
                    {formattedData.length > 1 ? (
                      <motion.div 
                        variants={chartVariants}
                        initial="hidden"
                        animate="visible"
                        className="h-[220px] w-full"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={formattedData}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="date" />
                            <YAxis yAxisId="left" orientation="left" stroke="#10b981" />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '6px' }} />
                            <Line 
                              yAxisId="left" 
                              type="monotone" 
                              dataKey="weight" 
                              stroke="#10b981" 
                              activeDot={{ r: 8 }} 
                              name="Weight (kg)" 
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </motion.div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[220px] text-muted-foreground">
                        <p>Not enough data for trend analysis</p>
                        <p className="text-sm">Submit more health records to see trends</p>
                      </div>
                    )}
                  </MotionCardContent>
                </MotionCard>
              </div>
            </MotionTabsContent>

            <MotionTabsContent
              key={activeTab}
              value="vitals"
              variants={tabContentVariants}
              initial="hidden"
              animate={activeTab === "vitals" ? "visible" : "hidden"}
              exit="exit"
              className="space-y-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Blood Pressure History</CardTitle>
                    <CardDescription>Recent measurements</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {formattedData.some(entry => entry.bp_systolic && entry.bp_diastolic) ? (
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={formattedData}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="date" />
                            <YAxis yAxisId="left" orientation="left" stroke="#ef4444" />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '6px' }} />
                            <Legend />
                            <Line 
                              yAxisId="left" 
                              type="monotone" 
                              dataKey="bp_systolic" 
                              stroke="#ef4444" 
                              activeDot={{ r: 8 }} 
                              name="Systolic (mmHg)" 
                            />
                            <Line 
                              yAxisId="left" 
                              type="monotone" 
                              dataKey="bp_diastolic" 
                              stroke="#3b82f6" 
                              activeDot={{ r: 8 }} 
                              name="Diastolic (mmHg)" 
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        <div className="text-center">
                          <p>No blood pressure history available</p>
                          <p className="text-sm mt-2">Update your health profile to track blood pressure</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Heart Rate History</CardTitle>
                    <CardDescription>Recent measurements</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {formattedData.some(entry => entry.heartRate) ? (
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={formattedData}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="date" />
                            <YAxis yAxisId="left" orientation="left" stroke="#ef4444" />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '6px' }} />
                            <Legend />
                            <Line 
                              yAxisId="left" 
                              type="monotone" 
                              dataKey="heartRate" 
                              stroke="#ef4444" 
                              activeDot={{ r: 8 }} 
                              name="Heart Rate (bpm)" 
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        <div className="text-center">
                          <p>No heart rate history available</p>
                          <p className="text-sm mt-2">Update your health profile to track heart rate</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </MotionTabsContent>

            <MotionTabsContent
              key={activeTab}
              value="lifestyle"
              variants={tabContentVariants}
              initial="hidden"
              animate={activeTab === "lifestyle" ? "visible" : "hidden"}
              exit="exit"
              className="space-y-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Sleep Patterns</CardTitle>
                    <CardDescription>Recent sleep duration</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {formattedData.some(entry => entry.sleepDuration) ? (
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={formattedData}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="date" />
                            <YAxis yAxisId="left" orientation="left" stroke="#8b5cf6" />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '6px' }} />
                            <Legend />
                            <Line 
                              yAxisId="left" 
                              type="monotone" 
                              dataKey="sleepDuration" 
                              stroke="#8b5cf6" 
                              activeDot={{ r: 8 }} 
                              name="Sleep Duration (hours)" 
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        <div className="text-center">
                          <p>No sleep data available</p>
                          <p className="text-sm mt-2">Update your health profile to track sleep patterns</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Stress Management</CardTitle>
                    <CardDescription>Recent stress levels</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {formattedData.some(entry => entry.stressLevel) ? (
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={formattedData}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="date" />
                            <YAxis yAxisId="left" orientation="left" domain={[0, 10]} stroke="#f59e0b" />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '6px' }} />
                            <Legend />
                            <Line 
                              yAxisId="left" 
                              type="monotone" 
                              dataKey="stressLevel" 
                              stroke="#f59e0b" 
                              activeDot={{ r: 8 }} 
                              name="Stress Level (1-10)" 
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        <div className="text-center">
                          <p>No stress data available</p>
                          <p className="text-sm mt-2">Update your health profile to track stress levels</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </MotionTabsContent>

            <MotionTabsContent
              key={activeTab}
              value="medical"
              variants={tabContentVariants}
              initial="hidden"
              animate={activeTab === "medical" ? "visible" : "hidden"}
              exit="exit"
              className="space-y-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Medical Conditions</CardTitle>
                    <CardDescription>Your health records</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {healthMetrics?.chronicConditions && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Chronic Conditions</h4>
                        <p className="text-sm text-muted-foreground">{healthMetrics.chronicConditions}</p>
                      </div>
                    )}
                    {healthMetrics?.allergies && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Allergies</h4>
                        <p className="text-sm text-muted-foreground">{healthMetrics.allergies}</p>
                      </div>
                    )}
                    {healthMetrics?.medications && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Medications</h4>
                        <p className="text-sm text-muted-foreground">{healthMetrics.medications}</p>
                      </div>
                    )}
                    {!healthMetrics?.chronicConditions && !healthMetrics?.allergies && !healthMetrics?.medications && (
                      <p className="text-muted-foreground">No medical conditions recorded</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Personal Health History</CardTitle>
                    <CardDescription>Your medical background</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {healthMetrics?.familyHistory && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Family History</h4>
                        <p className="text-sm text-muted-foreground">{healthMetrics.familyHistory}</p>
                      </div>
                    )}
                    {healthMetrics?.surgeries && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Surgeries</h4>
                        <p className="text-sm text-muted-foreground">{healthMetrics.surgeries}</p>
                      </div>
                    )}
                    {!healthMetrics?.familyHistory && !healthMetrics?.surgeries && (
                      <p className="text-muted-foreground">No personal health history recorded</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </MotionTabsContent>
          </AnimatePresence>
        </Tabs>
      </motion.div>
    </motion.div>
  )
}