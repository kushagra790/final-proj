"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  Heart, 
  Activity, 
  Thermometer, 
  Wind, 
  Moon, 
  Brain, 
  Pill, 
  AlertTriangle, 
  Users, 
  Scissors, 
  Target, 
  Cigarette, 
  Utensils,
  TrendingUp,
  Scale,
  Droplets,
  Dumbbell,
  Salad,
  CalendarClock,
  Clock,
  Award,
  CheckCircle2
} from "lucide-react";

interface HealthMetricsDisplayProps {
  healthMetrics: any;
}

export function HealthMetricsDisplay({ healthMetrics }: HealthMetricsDisplayProps) {
  if (!healthMetrics) return null;

  return (
    <Tabs defaultValue="vitals" className="w-full">
      <TabsList className="grid grid-cols-4 mb-4">
        <TabsTrigger value="vitals">Vitals</TabsTrigger>
        <TabsTrigger value="conditions">Medical History</TabsTrigger>
        <TabsTrigger value="lifestyle">Lifestyle</TabsTrigger>
        <TabsTrigger value="goals">Goals</TabsTrigger>
      </TabsList>
      
      <TabsContent value="vitals">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <VitalCard 
            title="Heart Rate" 
            value={`${healthMetrics.heartRate || "--"} bpm`}
            icon={<Heart className="h-5 w-5 text-red-500" />}
            description="Resting heart rate"
          />
          
          <VitalCard 
            title="Blood Pressure" 
            value={healthMetrics.bloodPressure || "--"}
            icon={<Activity className="h-5 w-5 text-blue-500" />}
            description="Systolic/Diastolic"
          />
          
          <VitalCard 
            title="Temperature" 
            value={`${healthMetrics.temperature || "--"} °C`}
            icon={<Thermometer className="h-5 w-5 text-amber-500" />}
            description="Body temperature"
          />
          
          <VitalCard 
            title="Respiratory Rate" 
            value={`${healthMetrics.respiratoryRate || "--"} bpm`}
            icon={<Wind className="h-5 w-5 text-cyan-500" />}
            description="Breaths per minute"
          />
          
          <VitalCard 
            title="Sleep Duration" 
            value={`${healthMetrics.sleepDuration || "--"} hrs`}
            icon={<Moon className="h-5 w-5 text-purple-500" />}
            description="Average daily sleep"
          />
          
          <VitalCard 
            title="Stress Level" 
            value={healthMetrics.stressLevel ? `${healthMetrics.stressLevel}/10` : "--"}
            icon={<Brain className="h-5 w-5 text-pink-500" />}
            description="Self-reported stress"
          />
        </div>
      </TabsContent>
      
      <TabsContent value="conditions">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ListCard 
            title="Chronic Conditions" 
            items={healthMetrics.chronicConditions || []}
            icon={<Activity className="h-5 w-5 text-red-500" />}
            emptyMessage="No chronic conditions reported"
          />
          
          <ListCard 
            title="Medications" 
            items={healthMetrics.medications || []}
            icon={<Pill className="h-5 w-5 text-blue-500" />}
            emptyMessage="No medications reported"
          />
          
          <ListCard 
            title="Allergies" 
            items={healthMetrics.allergies || []}
            icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
            emptyMessage="No allergies reported"
          />
          
          <ListCard 
            title="Family History" 
            items={healthMetrics.familyHistory || []}
            icon={<Users className="h-5 w-5 text-green-500" />}
            emptyMessage="No family history reported"
          />
          
          <ListCard 
            title="Surgeries" 
            items={healthMetrics.surgeries || []}
            icon={<Scissors className="h-5 w-5 text-purple-500" />}
            emptyMessage="No surgeries reported"
          />
        </div>
      </TabsContent>
      
      <TabsContent value="lifestyle">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <VitalCard 
            title="Activity Level" 
            value={healthMetrics.activityLevel || "--"}
            icon={<Activity className="h-5 w-5 text-green-500" />}
            description="Self-reported activity"
          />
          
          <VitalCard 
            title="Smoking Status" 
            value={healthMetrics.smokingStatus || "--"}
            icon={<Cigarette className="h-5 w-5 text-gray-500" />}
            description="Smoking habits"
          />
          
          <VitalCard 
            title="Diet Type" 
            value={healthMetrics.dietType || "--"}
            icon={<Utensils className="h-5 w-5 text-amber-500" />}
            description="Dietary preference"
          />
          
          <VitalCard 
            title="Height" 
            value={`${healthMetrics.height || "--"} cm`}
            icon={<Activity className="h-5 w-5 text-blue-500" />}
            description="Body height"
          />
          
          <VitalCard 
            title="Weight" 
            value={`${healthMetrics.weight || "--"} kg`}
            icon={<Activity className="h-5 w-5 text-purple-500" />}
            description="Body weight"
          />
          
          <VitalCard 
            title="BMI" 
            value={healthMetrics.height && healthMetrics.weight 
              ? (healthMetrics.weight / ((healthMetrics.height / 100) ** 2)).toFixed(1) 
              : "--"}
            icon={<Activity className="h-5 w-5 text-red-500" />}
            description="Body Mass Index"
          />
        </div>
      </TabsContent>
      
      <TabsContent value="goals">
        {healthMetrics.fitnessGoals && healthMetrics.fitnessGoals.length > 0 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
                <CardHeader className="pb-2">
                  <div className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-blue-500" />
                    <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {healthMetrics.fitnessGoals.length}
                    <span className="text-sm font-normal text-muted-foreground ml-1">total</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-100">
                <CardHeader className="pb-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">
                    {Math.floor(Math.random() * 5)}
                    <span className="text-sm font-normal text-muted-foreground ml-1">this month</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-100">
                <CardHeader className="pb-2">
                  <div className="flex items-center space-x-2">
                    <Award className="h-5 w-5 text-amber-500" />
                    <CardTitle className="text-sm font-medium">Goal Streak</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-600">
                    {Math.floor(Math.random() * 10) + 1}
                    <span className="text-sm font-normal text-muted-foreground ml-1">days</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader className="border-b bg-slate-50">
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-sm font-medium">Health & Fitness Goals</CardTitle>
                </div>
                <CardDescription>Track your progress toward your health objectives</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-5">
                  {healthMetrics.fitnessGoals.map((goal: string, index: number) => {
                    // Generate a random progress value for demo purposes
                    // You should replace this with actual progress data
                    const progress = Math.floor(Math.random() * 100);
                    
                    // Assign different icons and colors based on the goal content
                    let icon = <TrendingUp className="h-5 w-5" />;
                    let bgColor = "bg-blue-100";
                    let textColor = "text-blue-600";
                    let borderColor = "border-blue-200";
                    
                    if (goal.toLowerCase().includes("weight")) {
                      icon = <Scale className="h-5 w-5" />;
                      bgColor = "bg-purple-100";
                      textColor = "text-purple-600";
                      borderColor = "border-purple-200";
                    } else if (goal.toLowerCase().includes("sleep")) {
                      icon = <Moon className="h-5 w-5" />;
                      bgColor = "bg-indigo-100";
                      textColor = "text-indigo-600";
                      borderColor = "border-indigo-200";
                    } else if (goal.toLowerCase().includes("stress")) {
                      icon = <Wind className="h-5 w-5" />;
                      bgColor = "bg-green-100";
                      textColor = "text-green-600";
                      borderColor = "border-green-200";
                    } else if (goal.toLowerCase().includes("exercise") || goal.toLowerCase().includes("workout")) {
                      icon = <Dumbbell className="h-5 w-5" />;
                      bgColor = "bg-amber-100";
                      textColor = "text-amber-600";
                      borderColor = "border-amber-200";
                    } else if (goal.toLowerCase().includes("diet") || goal.toLowerCase().includes("nutrition")) {
                      icon = <Salad className="h-5 w-5" />;
                      bgColor = "bg-emerald-100";
                      textColor = "text-emerald-600";
                      borderColor = "border-emerald-200";
                    } else if (goal.toLowerCase().includes("water") || goal.toLowerCase().includes("hydration")) {
                      icon = <Droplets className="h-5 w-5" />;
                      bgColor = "bg-cyan-100";
                      textColor = "text-cyan-600";
                      borderColor = "border-cyan-200";
                    }
                    
                    // Status based on progress
                    let status = "Just started";
                    let statusColor = "text-slate-500";
                    
                    if (progress >= 75) {
                      status = "Almost there!";
                      statusColor = "text-emerald-600";
                    } else if (progress >= 50) {
                      status = "Good progress";
                      statusColor = "text-amber-600";
                    } else if (progress >= 25) {
                      status = "Making progress";
                      statusColor = "text-blue-600";
                    }
                    
                    return (
                      <div key={index} className={`border ${borderColor} rounded-lg p-4 transition-shadow hover:shadow-md`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start">
                            <div className={`${bgColor} p-2 rounded-full mr-3`}>
                              <div className={textColor}>{icon}</div>
                            </div>
                            <div>
                              <h4 className="font-medium text-base">{goal}</h4>
                              <div className="flex items-center text-sm mt-1">
                                <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                <span className="text-muted-foreground">Updated 3 days ago</span>
                              </div>
                            </div>
                          </div>
                          <Badge className={statusColor}>{status}</Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progress</span>
                            <span className="font-medium">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 border-t px-6 py-3">
                <div className="text-sm text-muted-foreground flex items-center">
                  <CalendarClock className="h-4 w-4 mr-2" />
                  Goals are updated weekly to track your progress
                </div>
              </CardFooter>
            </Card>
          </div>
        ) : (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <div className="rounded-full bg-blue-50 p-3 mb-4">
                <Target className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-medium mb-2">No goals set yet</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                Setting health and fitness goals is a great way to track your progress 
                and stay motivated on your wellness journey.
              </p>
              <Badge variant="outline" className="px-4 py-1 text-base cursor-pointer hover:bg-blue-50">
                + Add your first goal
              </Badge>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}

interface VitalCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  description: string;
}

function VitalCard({ title, value, icon, description }: VitalCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center space-x-2">
          {icon}
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </div>
        <Badge variant="outline" className="font-normal">
          {value}
        </Badge>
      </CardHeader>
      <CardContent>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

interface ListCardProps {
  title: string;
  items: string | string[] | undefined;
  icon: React.ReactNode;
  emptyMessage: string;
  fullWidth?: boolean;
}

function ListCard({ title, items, icon, emptyMessage, fullWidth }: ListCardProps) {
  // Process items - handle both string and array formats
  let safeItems: string[] = [];
  
  if (Array.isArray(items)) {
    safeItems = items;
  } else if (typeof items === 'string' && items?.trim()) {
    // If it's a non-empty string, treat it as a single item
    safeItems = [items];
  }
  
  return (
    <Card className={fullWidth ? "col-span-full" : ""}>
      <CardHeader className="flex flex-row items-center space-x-2 pb-2">
        {icon}
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {safeItems.length > 0 ? (
          <ScrollArea className="h-32">
            <ul className="space-y-1">
              {safeItems.map((item, index) => (
                <li key={index} className="text-sm">
                  • {item}
                </li>
              ))}
            </ul>
          </ScrollArea>
        ) : (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        )}
      </CardContent>
    </Card>
  );
}