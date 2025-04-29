"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BoltIcon,
  FlameIcon as FireIcon,
  MoonIcon,
  UtensilsCrossedIcon,
  DumbbellIcon,
  BedIcon,
  SunIcon,
  Loader2Icon,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
// Import existing and new chart components
import { ActivityChart } from "@/components/charts/activity-chart";
import { NutritionChart } from "@/components/charts/nutrition-chart";
import { ExerciseBarChart } from "@/components/charts/exercise-chart";
import { SleepChart } from "@/components/charts/sleep-chart";
// Import new multi-chart components
import { MultiSleepChart } from "@/components/charts/multi-sleep-chart";
import { MultiNutritionChart } from "@/components/charts/multi-nutrition-chart";
import { MultiExerciseChart } from "@/components/charts/multi-exercise-chart";
import { MultiActivityChart } from "@/components/charts/multi-activity-chart";
// Import insights component and generator functions
import { InsightCard } from "@/components/insights/insight-card";

// Sleep record interface
interface SleepRecord {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  quality: string;
}

export default function TrackingPage() {
  const [sleepData, setSleepData] = useState<SleepRecord[]>([]);
  const [sleepLoading, setSleepLoading] = useState(false);
  const [latestSleep, setLatestSleep] = useState<SleepRecord | null>(null);
  const [averageDuration, setAverageDuration] = useState(0);
  const [sleepQuality, setSleepQuality] = useState("N/A");
  const [sleepStreak, setSleepStreak] = useState(0);

  // Activity metrics state
  const [activityData, setActivityData] = useState<any>(null);
  const [activityLoading, setActivityLoading] = useState(false);

  // Nutrition metrics state
  const [nutritionData, setNutritionData] = useState<any>(null);
  const [nutritionLoading, setNutritionLoading] = useState(false);

  // Exercise metrics state
  const [exerciseData, setExerciseData] = useState<any>(null);
  const [exerciseLoading, setExerciseLoading] = useState(false);

  // New state variables for insights
  const [sleepInsights, setSleepInsights] = useState<string | null>(null);
  const [activityInsights, setActivityInsights] = useState<string | null>(null);
  const [nutritionInsights, setNutritionInsights] = useState<string | null>(null);
  const [exerciseInsights, setExerciseInsights] = useState<string | null>(null);
  
  const [loadingInsights, setLoadingInsights] = useState({
    sleep: false,
    activity: false,
    nutrition: false,
    exercise: false
  });

  // Fetch activity data
  const fetchActivityData = async () => {
    setActivityLoading(true);
    try {
      const response = await fetch('/api/activity');
      if (response.ok) {
        const data = await response.json();
        setActivityData(data);
      }
    } catch (error) {
      console.error('Error fetching activity data:', error);
    } finally {
      setActivityLoading(false);
    }
  };

  // Fetch nutrition data
  const fetchNutritionData = async () => {
    setNutritionLoading(true);
    try {
      const response = await fetch('/api/food/tracking?period=today');
      if (response.ok) {
        const data = await response.json();
        setNutritionData({
          calories: data.calories || 0,
          protein_g: data.protein_g || 0,
          carbs_g: data.carbs_g || 0,
          fats_g: data.fats_g || 0
        });
      } else {
        // Set default data on error
        setNutritionData({ calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0 });
      }
    } catch (error) {
      console.error('Error fetching nutrition data:', error);
      // Set default data on error to prevent undefined errors
      setNutritionData({ calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0 });
    } finally {
      setNutritionLoading(false);
    }
  };

  // Fetch exercise data
  const fetchExerciseData = async () => {
    setExerciseLoading(true);
    try {
      const response = await fetch('/api/exercise/log');
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.logs)) {
          const todayExercises = data.logs.filter((log: any) => 
            new Date(log.date).toDateString() === new Date().toDateString()
          );
          setExerciseData({
            logs: data.logs,
            stats: {
              completed: todayExercises.length,
              totalSets: todayExercises.reduce((acc: number, log: any) => acc + (log.sets || 0), 0),
              totalReps: todayExercises.reduce((acc: number, log: any) => acc + ((log.sets || 0) * (log.reps || 0)), 0),
              totalCalories: todayExercises.reduce((acc: number, log: any) => acc + (log.caloriesBurned || 0), 0)
            }
          });
        } else {
          // Set default data if logs are not available
          setExerciseData({
            logs: [],
            stats: {
              completed: 0,
              totalSets: 0,
              totalReps: 0,
              totalCalories: 0
            }
          });
        }
      }
    } catch (error) {
      console.error('Error fetching exercise data:', error);
      // Set default data on error
      setExerciseData({
        logs: [],
        stats: {
          completed: 0,
          totalSets: 0,
          totalReps: 0,
          totalCalories: 0
        }
      });
    } finally {
      setExerciseLoading(false);
    }
  };

  useEffect(() => {
    async function fetchSleepData() {
      setSleepLoading(true);
      try {
        const response = await fetch('/api/sleep?limit=7');
        
        if (response.ok) {
          const data = await response.json();
          setSleepData(data);
          
          // Set latest sleep record
          if (data.length > 0) {
            setLatestSleep(data[0]);
            
            // Calculate average duration (in minutes)
            const totalDuration = data.reduce((sum: number, record: SleepRecord) => sum + record.duration, 0);
            const avgDuration = Math.round(totalDuration / data.length);
            setAverageDuration(avgDuration);
            
            // Determine overall sleep quality
            const qualityMap: { [key: string]: number } = {
              poor: 1,
              fair: 2,
              good: 3,
              excellent: 4
            };
            
            const qualitySum = data.reduce((sum: number, record: SleepRecord) => 
              sum + (qualityMap[record.quality] || 0), 0);
            
            const avgQuality = qualitySum / data.length;
            
            if (avgQuality >= 3.5) setSleepQuality("Excellent");
            else if (avgQuality >= 2.5) setSleepQuality("Good");
            else if (avgQuality >= 1.5) setSleepQuality("Fair");
            else setSleepQuality("Poor");
            
            // Calculate streak (consecutive days with sleep records)
            // This is a simplified version - a more complex implementation would check actual dates
            setSleepStreak(Math.min(data.length, 7));
          }
        }
      } catch (error) {
        console.error("Error fetching sleep data:", error);
      } finally {
        setSleepLoading(false);
      }
    }

    fetchSleepData();
  }, []);

  // Fetch all data when component mounts
  useEffect(() => {
    fetchActivityData();
    fetchNutritionData();
    fetchExerciseData();
  }, []);

  // Generate insights when data is available
  useEffect(() => {
    async function generateInitialInsights() {
      if (sleepData.length > 0 && !sleepInsights && !loadingInsights.sleep) {
        handleGenerateSleepInsights();
      }
      
      if (activityData && !activityInsights && !loadingInsights.activity) {
        handleGenerateActivityInsights();
      }
      
      if (nutritionData && !nutritionInsights && !loadingInsights.nutrition) {
        handleGenerateNutritionInsights();
      }
      
      if (exerciseData?.logs?.length > 0 && !exerciseInsights && !loadingInsights.exercise) {
        handleGenerateExerciseInsights();
      }
    }
    
    generateInitialInsights();
  }, [sleepData, activityData, nutritionData, exerciseData]);

  // Handlers for generating insights using the API
  const handleGenerateSleepInsights = async () => {
    setLoadingInsights(prev => ({ ...prev, sleep: true }));
    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'sleep',
          data: sleepData
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setSleepInsights(data.insights);
      } else {
        throw new Error('Failed to generate sleep insights');
      }
    } catch (error) {
      console.error("Error generating sleep insights:", error);
    } finally {
      setLoadingInsights(prev => ({ ...prev, sleep: false }));
    }
  };

  const handleGenerateActivityInsights = async () => {
    setLoadingInsights(prev => ({ ...prev, activity: true }));
    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'activity',
          data: activityData
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setActivityInsights(data.insights);
      } else {
        throw new Error('Failed to generate activity insights');
      }
    } catch (error) {
      console.error("Error generating activity insights:", error);
    } finally {
      setLoadingInsights(prev => ({ ...prev, activity: false }));
    }
  };

  const handleGenerateNutritionInsights = async () => {
    setLoadingInsights(prev => ({ ...prev, nutrition: true }));
    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'nutrition',
          data: nutritionData
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setNutritionInsights(data.insights);
      } else {
        throw new Error('Failed to generate nutrition insights');
      }
    } catch (error) {
      console.error("Error generating nutrition insights:", error);
    } finally {
      setLoadingInsights(prev => ({ ...prev, nutrition: false }));
    }
  };

  const handleGenerateExerciseInsights = async () => {
    setLoadingInsights(prev => ({ ...prev, exercise: true }));
    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'exercise',
          data: exerciseData
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setExerciseInsights(data.insights);
      } else {
        throw new Error('Failed to generate exercise insights');
      }
    } catch (error) {
      console.error("Error generating exercise insights:", error);
    } finally {
      setLoadingInsights(prev => ({ ...prev, exercise: false }));
    }
  };

  // Format duration from minutes to hours and minutes
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="w-full grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daily Tracking</h1>
          <p className="text-muted-foreground">Monitor your daily health and wellness activities.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/tracking/food">
              <UtensilsCrossedIcon className="mr-2 h-4 w-4" />
              Track Food
            </Link>
          </Button>
          <Button asChild>
            <Link href="/tracking/exercise">
              <DumbbellIcon className="mr-2 h-4 w-4" />
              Track Exercise
            </Link>
          </Button>
          <Button asChild>
            <Link href="/tracking/sleep">
              <BedIcon className="mr-2 h-4 w-4" />
              Track Sleep
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <BoltIcon className="h-4 w-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="nutrition" className="flex items-center gap-2">
            <FireIcon className="h-4 w-4" />
            Nutrition
          </TabsTrigger>
          <TabsTrigger value="exercise" className="flex items-center gap-2">
            <DumbbellIcon className="h-4 w-4" />
            Exercise
          </TabsTrigger>
          <TabsTrigger value="sleep" className="flex items-center gap-2">
            <MoonIcon className="h-4 w-4" />
            Sleep
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="activity" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-cyan-400 to-blue-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Steps</CardTitle>
                <BoltIcon className="h-4 w-4 text-white" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {activityLoading ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : (
                    activityData?.steps || 0
                  )}
                </div>
                <p className="text-xs text-cyan-100">of 10,000 goal</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-teal-400 to-emerald-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Distance</CardTitle>
                <BoltIcon className="h-4 w-4 text-white" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {activityLoading ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : (
                    `${activityData?.distance || 0} km`
                  )}
                </div>
                <p className="text-xs text-teal-100">of 5 km goal</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-400 to-lime-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Active Minutes</CardTitle>
                <BoltIcon className="h-4 w-4 text-white" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {activityLoading ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : (
                    `${activityData?.activeMinutes || 0} min`
                  )}
                </div>
                <p className="text-xs text-green-100">of 60 min goal</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-400 to-red-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Calories Burned</CardTitle>
                <FireIcon className="h-4 w-4 text-white" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {activityLoading ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : (
                    activityData?.caloriesBurned || 0
                  )}
                </div>
                <p className="text-xs text-orange-100">of 500 goal</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Enhanced Activity Charts and Insights */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
                <CardDescription>Visualize your daily activity patterns</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {activityLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2Icon className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <MultiActivityChart activityData={activityData?.timeline || []} />
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Activity Insights</CardTitle>
                <CardDescription>AI analysis of your activity patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <InsightCard
                  title="Activity Analysis"
                  description="Personalized recommendations based on your activity data"
                  insight={activityInsights}
                  onRefresh={handleGenerateActivityInsights}
                  isLoading={loadingInsights.activity}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="nutrition" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-amber-400 to-yellow-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Calories Intake</CardTitle>
                <UtensilsCrossedIcon className="h-4 w-4 text-white" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {nutritionLoading ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : (
                    nutritionData?.calories || 0
                  )}
                </div>
                <p className="text-xs text-amber-100">of 2,200 goal</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-indigo-400 to-blue-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Protein</CardTitle>
                <UtensilsCrossedIcon className="h-4 w-4 text-white" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {nutritionLoading ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : (
                    `${Math.round(nutritionData?.protein_g || 0)}g`
                  )}
                </div>
                <p className="text-xs text-indigo-100">of 90g goal</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-yellow-400 to-orange-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Carbs</CardTitle>
                <UtensilsCrossedIcon className="h-4 w-4 text-white" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {nutritionLoading ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : (
                    `${Math.round(nutritionData?.carbs_g || 0)}g`
                  )}
                </div>
                <p className="text-xs text-yellow-100">of 250g goal</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-400 to-rose-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Fat</CardTitle>
                <UtensilsCrossedIcon className="h-4 w-4 text-white" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {nutritionLoading ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : (
                    `${Math.round(nutritionData?.fats_g || 0)}g`
                  )}
                </div>
                <p className="text-xs text-red-100">of 70g goal</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Enhanced Nutrition Charts and Insights */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Macronutrient Analysis</CardTitle>
                <CardDescription>Visualize your nutritional intake</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {nutritionLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2Icon className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <MultiNutritionChart
                    protein={nutritionData?.protein_g || 0}
                    carbs={nutritionData?.carbs_g || 0}
                    fat={nutritionData?.fats_g || 0}
                  />
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Nutrition Insights</CardTitle>
                <CardDescription>AI analysis of your nutritional intake</CardDescription>
              </CardHeader>
              <CardContent>
                <InsightCard
                  title="Nutrition Analysis"
                  description="Personalized dietary recommendations"
                  insight={nutritionInsights}
                  onRefresh={handleGenerateNutritionInsights}
                  isLoading={loadingInsights.nutrition}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="exercise" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-emerald-400 to-green-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Exercises Completed</CardTitle>
                <DumbbellIcon className="h-4 w-4 text-white" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {exerciseLoading ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : (
                    exerciseData?.stats?.completed || 0
                  )}
                </div>
                <p className="text-xs text-emerald-100">Today's total</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-sky-400 to-cyan-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Total Sets</CardTitle>
                <DumbbellIcon className="h-4 w-4 text-white" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {exerciseLoading ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : (
                    exerciseData?.stats?.totalSets || 0
                  )}
                </div>
                <p className="text-xs text-sky-100">Across all exercises</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-lime-400 to-green-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Total Reps</CardTitle>
                <DumbbellIcon className="h-4 w-4 text-white" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {exerciseLoading ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : (
                    exerciseData?.stats?.totalReps || 0
                  )}
                </div>
                <p className="text-xs text-lime-100">Across all exercises</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-pink-400 to-rose-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Calories Burned</CardTitle>
                <FireIcon className="h-4 w-4 text-white" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {exerciseLoading ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : (
                    exerciseData?.stats?.totalCalories || 0
                  )}
                </div>
                <p className="text-xs text-pink-100">From exercises</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Enhanced Exercise Charts and Insights */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Exercise Progress</CardTitle>
                <CardDescription>Multiple views of your exercise data</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {exerciseLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2Icon className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <MultiExerciseChart exercises={exerciseData?.logs || []} />
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Exercise Insights</CardTitle>
                <CardDescription>AI analysis of your workout patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <InsightCard
                  title="Exercise Analysis"
                  description="Personalized workout recommendations"
                  insight={exerciseInsights}
                  onRefresh={handleGenerateExerciseInsights}
                  isLoading={loadingInsights.exercise}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="sleep" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-violet-400 to-purple-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Sleep Duration</CardTitle>
                <MoonIcon className="h-4 w-4 text-white" />
              </CardHeader>
              <CardContent>
                {sleepLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2Icon className="h-4 w-4 animate-spin text-white" />
                    <span className="text-violet-100">Loading...</span>
                  </div>
                ) : latestSleep ? (
                  <>
                    <div className="text-2xl font-bold text-white">{formatDuration(latestSleep.duration)}</div>
                    <p className="text-xs text-violet-100">Last night's sleep</p>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-white">No data</div>
                    <p className="text-xs text-violet-100">Track your first sleep</p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-400 to-indigo-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Sleep Quality</CardTitle>
                <MoonIcon className="h-4 w-4 text-white" />
              </CardHeader>
              <CardContent>
                {sleepLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2Icon className="h-4 w-4 animate-spin text-white" />
                    <span className="text-blue-100">Loading...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-white">{sleepQuality}</div>
                    <p className="text-xs text-blue-100">Based on recent sleep data</p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-fuchsia-400 to-pink-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Average Sleep</CardTitle>
                <MoonIcon className="h-4 w-4 text-white" />
              </CardHeader>
              <CardContent>
                {sleepLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2Icon className="h-4 w-4 animate-spin text-white" />
                    <span className="text-fuchsia-100">Loading...</span>
                  </div>
                ) : averageDuration > 0 ? (
                  <>
                    <div className="text-2xl font-bold text-white">{formatDuration(averageDuration)}</div>
                    <p className="text-xs text-fuchsia-100">Last 7 days average</p>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-white">No data</div>
                    <p className="text-xs text-fuchsia-100">Add sleep records first</p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-indigo-400 to-slate-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Sleep Streak</CardTitle>
                <BedIcon className="h-4 w-4 text-white" />
              </CardHeader>
              <CardContent>
                {sleepLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2Icon className="h-4 w-4 animate-spin text-white" />
                    <span className="text-indigo-100">Loading...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-white">{sleepStreak} days</div>
                    <p className="text-xs text-indigo-100">Consistent sleep tracking</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Enhanced Sleep Charts and Insights */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sleep Analysis</CardTitle>
                <CardDescription>Multiple views of your sleep patterns</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {sleepLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2Icon className="h-6 w-6 animate-spin" />
                  </div>
                ) : sleepData.length > 0 ? (
                  <MultiSleepChart sleepData={sleepData} />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground">No sleep data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Sleep Insights</CardTitle>
                <CardDescription>AI analysis of your sleep patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <InsightCard
                  title="Sleep Recommendations"
                  description="Personalized sleep improvement tips"
                  insight={sleepInsights}
                  onRefresh={handleGenerateSleepInsights}
                  isLoading={loadingInsights.sleep}
                />
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Sleep Records</CardTitle>
              <CardDescription>Your recent sleep history</CardDescription>
            </CardHeader>
            <CardContent>
              {sleepLoading ? (
                <div className="flex justify-center items-center h-[100px]">
                  <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : sleepData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sleepData.slice(0, 4).map((record) => (
                    <div key={record._id} className="bg-gradient-to-br from-purple-400/10 to-indigo-500/10 border rounded-md p-3 flex justify-between items-center">
                      <div>
                        <div className="font-medium">{format(new Date(record.date), 'MMM dd, yyyy')}</div>
                        <div className="text-sm text-muted-foreground capitalize">{record.quality} quality</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatDuration(record.duration)}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(record.startTime), 'hh:mm a')} - {format(new Date(record.endTime), 'hh:mm a')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[100px] flex flex-col items-center justify-center text-muted-foreground">
                  <p className="mb-2">No sleep records found</p>
                  <Button size="sm" asChild>
                    <Link href="/tracking/sleep">Add your first sleep record</Link>
                  </Button>
                </div>
              )}
              {sleepData.length > 4 && (
                <div className="mt-3 text-center">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/tracking/sleep">View all sleep records</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

