"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Loader2, BarChart3, Calendar, ArrowLeft, Weight, HeartPulse, Thermometer, Moon, Activity } from "lucide-react"
import { format } from "date-fns"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

// Define types for formatted data
interface FormattedDataEntry {
  date: string;
  weight?: number;
  heartRate?: number;
  sleepDuration?: number;
  stressLevel?: number;
  timestamp: number;
  [key: string]: string | number | undefined;
}

export default function HealthHistoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [historyData, setHistoryData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("weight")

  useEffect(() => {
    if (status === "authenticated") {
      fetchHistoryData()
    } else if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  const fetchHistoryData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/health/history")
      
      if (!response.ok) {
        throw new Error("Failed to fetch health history")
      }
      
      const data = await response.json()
      setHistoryData(data)
    } catch (error) {
      console.error("Error fetching health history:", error)
    } finally {
      setLoading(false)
    }
  }

  // Format data for charts
  const formattedData: FormattedDataEntry[] = historyData.map(record => ({
    date: format(new Date(record.recordedAt), 'MMM d'),
    weight: record.weight,
    heartRate: record.heartRate,
    sleepDuration: record.sleepDuration,
    stressLevel: record.stressLevel,
    timestamp: new Date(record.recordedAt).getTime(),
  })).sort((a, b) => a.timestamp - b.timestamp)
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard')}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Health History</h1>
      </div>
      
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Your Health Trends
            </CardTitle>
            <CardDescription>
              Track how your health metrics change over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 md:w-fit mb-8">
                <TabsTrigger value="weight">Weight</TabsTrigger>
                <TabsTrigger value="heart">Heart Rate</TabsTrigger>
                <TabsTrigger value="sleep">Sleep</TabsTrigger>
                <TabsTrigger value="stress">Stress</TabsTrigger>
              </TabsList>
              
              <div className="h-[400px] mt-4">
                <TabsContent value="weight" className="h-full mt-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formattedData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" orientation="left" stroke="#10b981" />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '6px' }} />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="weight" stroke="#10b981" activeDot={{ r: 8 }} name="Weight (kg)" />
                    </LineChart>
                  </ResponsiveContainer>
                </TabsContent>
                
                <TabsContent value="heart" className="h-full mt-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formattedData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" orientation="left" stroke="#ef4444" />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '6px' }} />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="heartRate" stroke="#ef4444" activeDot={{ r: 8 }} name="Heart Rate (bpm)" />
                    </LineChart>
                  </ResponsiveContainer>
                </TabsContent>
                
                <TabsContent value="sleep" className="h-full mt-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formattedData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8b5cf6" />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '6px' }} />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="sleepDuration" stroke="#8b5cf6" activeDot={{ r: 8 }} name="Sleep (hours)" />
                    </LineChart>
                  </ResponsiveContainer>
                </TabsContent>
                
                <TabsContent value="stress" className="h-full mt-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formattedData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" orientation="left" stroke="#f59e0b" domain={[0, 10]} />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '6px' }} />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="stressLevel" stroke="#f59e0b" activeDot={{ r: 8 }} name="Stress Level (1-10)" />
                    </LineChart>
                  </ResponsiveContainer>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            title: "Weight", 
            icon: <Weight className="h-4 w-4" />, 
            dataKey: "weight", 
            color: "#10b981",
            unit: "kg"
          },
          { 
            title: "Heart Rate", 
            icon: <HeartPulse className="h-4 w-4" />, 
            dataKey: "heartRate", 
            color: "#ef4444",
            unit: "bpm"
          },
          { 
            title: "Sleep", 
            icon: <Moon className="h-4 w-4" />, 
            dataKey: "sleepDuration", 
            color: "#8b5cf6",
            unit: "hrs"
          },
          { 
            title: "Stress", 
            icon: <Activity className="h-4 w-4" />, 
            dataKey: "stressLevel",
            color: "#f59e0b",
            unit: "/10"
          }
        ].map((metric) => {
          // Calculate trend values
          const validEntries = formattedData.filter(entry => entry[metric.dataKey] !== undefined);
          const latestValue = validEntries.length > 0 ? Number(validEntries[validEntries.length - 1][metric.dataKey]) : null;
          const previousValue = validEntries.length > 1 ? Number(validEntries[validEntries.length - 2][metric.dataKey]) : null;
          const change = (latestValue !== null && previousValue !== null) ? 
            (latestValue as number) - (previousValue as number) : null;
          
          return (
            <Card key={metric.title} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-primary/10 p-1.5 rounded-md text-primary">
                      {metric.icon}
                    </span>
                    {metric.title}
                  </div>
                  {change !== null && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      change > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                      change < 0 ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 
                      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {change > 0 ? '+' : ''}{change.toFixed(1)}
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="flex items-baseline gap-1">
                  {latestValue !== null ? (
                    <>
                      <span className="text-2xl font-bold">{latestValue}</span>
                      <span className="text-muted-foreground">{metric.unit}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">No data</span>
                  )}
                </CardDescription>
              </CardHeader>
              <div className="h-[100px] mt-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedData}>
                    <Line 
                      type="monotone" 
                      dataKey={metric.dataKey} 
                      stroke={metric.color} 
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          );
        })}
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          History Records
        </h2>
        
        <div className="space-y-4">
          {historyData.length === 0 ? (
            <Card>
              <CardContent className="py-6">
                <p className="text-muted-foreground text-center">No history records found</p>
              </CardContent>
            </Card>
          ) : (
            historyData.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
              .map((record, index) => (
                <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="bg-primary/10 p-1.5 rounded-md text-primary">
                          <Calendar className="h-4 w-4" />
                        </span>
                        Record from {format(new Date(record.recordedAt), 'MMMM d, yyyy')}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(record.recordedAt), 'h:mm a')}
                      </span>
                    </CardTitle>
                    <CardDescription>{record.notes}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: "Weight", value: record.weight, unit: "kg" },
                        { label: "Height", value: record.height, unit: "cm" },
                        { label: "Heart Rate", value: record.heartRate, unit: "bpm" },
                        { label: "Sleep", value: record.sleepDuration, unit: "hrs" },
                      ].map((item, i) => (
                        <div key={i} className="flex flex-col">
                          <span className="text-sm text-muted-foreground">{item.label}</span>
                          <span className="font-medium">
                            {item.value !== undefined ? `${item.value} ${item.unit}` : "N/A"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </div>
      </div>
    </div>
  )
}
