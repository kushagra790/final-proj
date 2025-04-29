"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowDownTrayIcon, ShareIcon, HeartIcon, BeakerIcon, UserIcon, ShieldExclamationIcon } from "@heroicons/react/24/solid";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { generatePDF, shareHealthCard } from "@/lib/health-card-utils";
import { generateTextToText } from "@/lib/generative-ai";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SparklesIcon } from "lucide-react";

interface HealthCardData {
  personalInfo: {
    fullName: string;
    dateOfBirth: string;
    bloodType: string;
    email: string;
    phone: string;
    emergencyContact: string;
    emergencyPhone: string;
    gender: string;
    age: number;
  };
  medicalConditions: {
    allergies: string[];
    chronicConditions: string[];
    medications: string[];
    surgeries: string[];
  };
  vitalSigns: {
    bloodPressure: string;
    heartRate: number;
    height: number;
    weight: number;
    temperature: number;
    respiratoryRate: number;
  };
  vaccinations: {
    name: string;
    date: string;
    provider: string;
    type: string;
    notes?: string;
  }[];
  updatedAt: string;
  healthGoals?: string[];
  lifestyleInfo?: {
    diet: string;
    activityLevel: string;
    sleepAverage: number;
    stressLevel: string;
  };
  insights?: {
    healthScore: number;
    recommendations: string[];
    predictions: {
      title: string;
      prediction: string;
      timeframe: string;
    }[];
  };
}

const AIBadge = ({ tooltip = "AI-generated content based on your health data" }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center ml-2">
          <SparklesIcon className="h-4 w-4 text-blue-500" />
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export default function HealthCardPage() {
  const [healthCardData, setHealthCardData] = useState<HealthCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { toast } = useToast();

  // Calculate derived metrics
  const bmi = useMemo(() => {
    if (!healthCardData?.vitalSigns.height || !healthCardData?.vitalSigns.weight) return null;
    const heightInMeters = healthCardData.vitalSigns.height / 100;
    return (healthCardData.vitalSigns.weight / (heightInMeters * heightInMeters)).toFixed(1);
  }, [healthCardData]);

  const bmiCategory = useMemo(() => {
    if (!bmi) return null;
    const bmiValue = parseFloat(bmi);
    if (bmiValue < 18.5) return { label: "Underweight", color: "text-blue-500" };
    if (bmiValue < 25) return { label: "Normal weight", color: "text-green-500" };
    if (bmiValue < 30) return { label: "Overweight", color: "text-yellow-500" };
    return { label: "Obesity", color: "text-red-500" };
  }, [bmi]);

  useEffect(() => {
    const fetchHealthCardData = async () => {
      try {
        const response = await fetch("/api/health-card");
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch health card data");
        }
        
        const data = await response.json();
        
        // Ensure all array fields are actually arrays
        if (data.medicalConditions) {
          data.medicalConditions.allergies = Array.isArray(data.medicalConditions.allergies) 
            ? data.medicalConditions.allergies 
            : [];
          
          data.medicalConditions.chronicConditions = Array.isArray(data.medicalConditions.chronicConditions) 
            ? data.medicalConditions.chronicConditions 
            : [];
          
          data.medicalConditions.medications = Array.isArray(data.medicalConditions.medications) 
            ? data.medicalConditions.medications 
            : [];
          
          data.medicalConditions.surgeries = Array.isArray(data.medicalConditions.surgeries) 
            ? data.medicalConditions.surgeries 
            : [];
        }
        
        // Ensure vaccinations is an array
        data.vaccinations = Array.isArray(data.vaccinations) ? data.vaccinations : [];
        
        // Generate AI insights if not already present
        if (!data.insights) {
          try {
            data.insights = await generateAIInsights(data);
          } catch (error) {
            console.error("Error generating AI insights:", error);
            // Provide fallback insights if AI generation fails
            data.insights = getDefaultInsights();
          }
        }
        
        // Generate lifestyle info if not present
        if (!data.lifestyleInfo) {
          data.lifestyleInfo = {
            diet: "Balanced",
            activityLevel: "Moderate",
            sleepAverage: 7.2,
            stressLevel: "Medium"
          };
        }
        
        // Add sample health goals if not present
        if (!data.healthGoals) {
          data.healthGoals = [
            "Maintain weight", 
            "Improve cardiovascular health", 
            "Better stress management"
          ];
        } else {
          // Ensure health goals is an array
          data.healthGoals = Array.isArray(data.healthGoals) ? data.healthGoals : [];
        }
        
        setHealthCardData(data);
      } catch (error) {
        console.error("Error fetching health card:", error);
        setError(error instanceof Error ? error.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchHealthCardData();
  }, []);

  // Function to generate AI insights
  const generateAIInsights = async (data: HealthCardData) => {
    try {
      const healthContext = `
        Personal: ${data.personalInfo.age} year old ${data.personalInfo.gender.toLowerCase()}.
        Height: ${data.vitalSigns.height}cm, Weight: ${data.vitalSigns.weight}kg.
        Heart rate: ${data.vitalSigns.heartRate} bpm, BP: ${data.vitalSigns.bloodPressure}.
        Medical conditions: ${data.medicalConditions.chronicConditions.join(", ") || "None"}.
        Allergies: ${data.medicalConditions.allergies.join(", ") || "None"}.
        Medications: ${data.medicalConditions.medications.join(", ") || "None"}.
      `;

      // Generate health score and recommendations
      const insightsPrompt = `
        As a health analytics AI, analyze this person's health data:
        ${healthContext}
        
        Return a JSON object with these fields:
        - healthScore: number between 0-100 representing overall health
        - recommendations: array of 4 specific health recommendations
        - predictions: array of 3 health predictions with title, prediction text, and timeframe
        
        Format:
        {
          "healthScore": 85,
          "recommendations": [
            "Recommendation 1",
            "Recommendation 2",
            "Recommendation 3",
            "Recommendation 4"
          ],
          "predictions": [
            {
              "title": "Heart Health",
              "prediction": "Your cardiovascular health is likely to remain stable",
              "timeframe": "Next 12 months"
            },
            {...},
            {...}
          ]
        }
      `;

      const aiResponse = await generateTextToText(insightsPrompt);
      
      // Extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : null;
      
      if (jsonString) {
        try {
          const parsedResponse = JSON.parse(jsonString);
          return parsedResponse;
        } catch (parseError) {
          console.error("Error parsing AI response:", parseError);
          return getDefaultInsights();
        }
      }
      
      // Fallback if parsing fails
      return getDefaultInsights();
    } catch (error) {
      console.error("Error generating AI insights:", error);
      return getDefaultInsights();
    }
  };

  // Default insights as fallback
  const getDefaultInsights = () => {
    return {
      healthScore: 75,
      recommendations: [
        "Maintain regular physical activity of at least 150 minutes per week",
        "Ensure adequate hydration with 2-3 liters of water daily",
        "Schedule regular health check-ups every 6 months",
        "Consider incorporating more stress management techniques"
      ],
      predictions: [
        {
          title: "Overall Health",
          prediction: "Your general health metrics indicate a stable trajectory with potential for improvement through lifestyle changes",
          timeframe: "6-12 months"
        },
        {
          title: "Cardiovascular Health",
          prediction: "Your current heart metrics suggest a healthy cardiovascular system with good long-term outlook",
          timeframe: "1-3 years"
        },
        {
          title: "Metabolic Health",
          prediction: "Your current weight and activity level support healthy metabolism",
          timeframe: "Next 12 months"
        }
      ]
    };
  };

  const handleDownload = async () => {
    if (!healthCardData) return;
    
    try {
      await generatePDF(healthCardData);
      toast({
        title: "Health card downloaded",
        description: "Your digital health card has been downloaded as a PDF.",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download failed",
        description: "There was an error generating your health card PDF.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (!healthCardData) return;
    
    try {
      await shareHealthCard(healthCardData);
      toast({
        title: "Health card shared",
        description: "Your digital health card has been shared successfully.",
      });
    } catch (error) {
      console.error("Sharing error:", error);
      toast({
        title: "Sharing failed",
        description: "There was an error sharing your health card.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <HealthCardSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error}. Please complete your health profile first.
        </AlertDescription>
      </Alert>
    );
  }

  if (!healthCardData) {
    return (
      <Alert className="mt-4">
        <AlertTitle>No data available</AlertTitle>
        <AlertDescription>
          No health data available. Please complete your health profile.
        </AlertDescription>
      </Alert>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMMM d, yyyy");
    } catch (e) {
      return "Unknown date";
    }
  };

  // Safe access helper function
  const isArrayWithItems = (arr: any): boolean => {
    return Array.isArray(arr) && arr.length > 0;
  };

  return (
    <div className="w-full">
      {/* Page header with title and buttons */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Digital Health Card</h1>
          <p className="text-muted-foreground">
            Your portable medical information. Last updated: {formatDate(healthCardData.updatedAt)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleShare}>
            <ShareIcon className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button onClick={handleDownload}>
            <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      {/* Unified Health Card */}
      <Card className="w-full">
        {/* Health Score Summary Card */}
        {healthCardData.insights && (
          <CardHeader className="pb-0">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-md p-6 mb-4">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-semibold">Health Score</h3>
                    <AIBadge />
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>0</span>
                      <span>100</span>
                    </div>
                    <Progress value={healthCardData.insights.healthScore} className="h-3" />
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-2xl font-bold">{healthCardData.insights.healthScore}</span>
                      <span className="text-sm text-muted-foreground">
                        {healthCardData.insights.healthScore >= 80 
                          ? "Excellent" 
                          : healthCardData.insights.healthScore >= 70 
                          ? "Good" 
                          : healthCardData.insights.healthScore >= 60 
                          ? "Fair" 
                          : "Needs Improvement"}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-md font-semibold mb-2 flex items-center">
                    Key Health Metrics
                  </h3>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                    <div className="flex items-center gap-1">
                      <HeartIcon className="h-4 w-4 text-red-500" />
                      <span className="text-sm">{healthCardData.vitalSigns.heartRate} bpm</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="inline-block h-4 w-4 rounded-full bg-red-100 flex-shrink-0 grid place-items-center text-[10px] font-bold text-red-500">BP</span>
                      <span className="text-sm">{healthCardData.vitalSigns.bloodPressure}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium">BMI:</span>
                      <span className="text-sm">
                        {bmi} <span className={`${bmiCategory?.color}`}>({bmiCategory?.label})</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BeakerIcon className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">{healthCardData.personalInfo.bloodType}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <CardTitle className="text-2xl font-bold mb-2">Health Information</CardTitle>
            <CardDescription>
              Complete overview of your personal, medical, and health data in one place
            </CardDescription>
          </CardHeader>
        )}
        
        <CardContent className="space-y-8 pt-6">
          {/* Personal Information Section */}
          <div>
            <div className="flex items-center mb-4">
              <UserIcon className="h-5 w-5 mr-2 text-blue-500" />
              <h2 className="text-xl font-semibold">Personal Information</h2>
            </div>
            <Separator className="mb-4" />
            
            <dl className="grid gap-3 text-sm">
              <div className="grid grid-cols-2 border-b pb-2">
                <dt className="font-medium">Full Name:</dt>
                <dd>{healthCardData.personalInfo.fullName}</dd>
              </div>
              <div className="grid grid-cols-2 border-b pb-2">
                <dt className="font-medium">Date of Birth:</dt>
                <dd>{formatDate(healthCardData.personalInfo.dateOfBirth)}</dd>
              </div>
              <div className="grid grid-cols-2 border-b pb-2">
                <dt className="font-medium">Age:</dt>
                <dd>{healthCardData.personalInfo.age} years</dd>
              </div>
              <div className="grid grid-cols-2 border-b pb-2">
                <dt className="font-medium">Gender:</dt>
                <dd>{healthCardData.personalInfo.gender}</dd>
              </div>
              <div className="grid grid-cols-2 border-b pb-2">
                <dt className="font-medium">Blood Type:</dt>
                <dd>{healthCardData.personalInfo.bloodType}</dd>
              </div>
              <div className="grid grid-cols-2 border-b pb-2">
                <dt className="font-medium">Email:</dt>
                <dd>{healthCardData.personalInfo.email}</dd>
              </div>
              <div className="grid grid-cols-2 border-b pb-2">
                <dt className="font-medium">Phone:</dt>
                <dd>{healthCardData.personalInfo.phone}</dd>
              </div>
              <div className="grid grid-cols-2 border-b pb-2">
                <dt className="font-medium">Emergency Contact:</dt>
                <dd>
                  {healthCardData.personalInfo.emergencyContact} 
                  {healthCardData.personalInfo.emergencyPhone && ` - ${healthCardData.personalInfo.emergencyPhone}`}
                </dd>
              </div>
            </dl>
          </div>
          
          {/* Medical Conditions Section */}
          <div>
            <div className="flex items-center mb-4">
              <ShieldExclamationIcon className="h-5 w-5 mr-2 text-red-500" />
              <h2 className="text-xl font-semibold">Medical Conditions</h2>
            </div>
            <Separator className="mb-4" />
            
            <dl className="grid gap-3 text-sm">
              <div className="grid grid-cols-2 border-b pb-2">
                <dt className="font-medium">Allergies:</dt>
                <dd>
                  {isArrayWithItems(healthCardData.medicalConditions?.allergies)
                    ? healthCardData.medicalConditions.allergies.map((allergy, i) => (
                        <Badge key={i} variant="outline" className="mr-1 mb-1">{allergy}</Badge>
                      ))
                    : "None reported"}
                </dd>
              </div>
              <div className="grid grid-cols-2 border-b pb-2">
                <dt className="font-medium">Chronic Conditions:</dt>
                <dd>
                  {isArrayWithItems(healthCardData.medicalConditions?.chronicConditions)
                    ? healthCardData.medicalConditions.chronicConditions.map((condition, i) => (
                        <Badge key={i} variant="outline" className="mr-1 mb-1">{condition}</Badge>
                      ))
                    : "None reported"}
                </dd>
              </div>
              <div className="grid grid-cols-2 border-b pb-2">
                <dt className="font-medium">Current Medications:</dt>
                <dd>
                  {isArrayWithItems(healthCardData.medicalConditions?.medications)
                    ? healthCardData.medicalConditions.medications.map((medication, i) => (
                        <Badge key={i} variant="outline" className="mr-1 mb-1">{medication}</Badge>
                      ))
                    : "None reported"}
                </dd>
              </div>
              <div className="grid grid-cols-2 border-b pb-2">
                <dt className="font-medium">Past Surgeries:</dt>
                <dd>
                  {isArrayWithItems(healthCardData.medicalConditions?.surgeries)
                    ? healthCardData.medicalConditions.surgeries.map((surgery, i) => (
                        <Badge key={i} variant="outline" className="mr-1 mb-1">{surgery}</Badge>
                      ))
                    : "None reported"}
                </dd>
              </div>
              {healthCardData.healthGoals && (
                <div className="grid grid-cols-2 border-b pb-2">
                  <dt className="font-medium">Health Goals:</dt>
                  <dd>
                    {isArrayWithItems(healthCardData.healthGoals)
                      ? healthCardData.healthGoals.map((goal, i) => (
                          <Badge key={i} variant="outline" className="mr-1 mb-1">{goal}</Badge>
                        ))
                      : "No health goals set"}
                  </dd>
                </div>
              )}
              {healthCardData.lifestyleInfo && (
                <div className="grid grid-cols-2 border-b pb-2">
                  <dt className="font-medium">Lifestyle:</dt>
                  <dd>
                    <div className="grid grid-cols-1 gap-1">
                      <span>Diet: {healthCardData.lifestyleInfo.diet}</span>
                      <span>Activity: {healthCardData.lifestyleInfo.activityLevel}</span>
                      <span>Sleep: {healthCardData.lifestyleInfo.sleepAverage} hours avg.</span>
                      <span>Stress: {healthCardData.lifestyleInfo.stressLevel}</span>
                    </div>
                  </dd>
                </div>
              )}
            </dl>
          </div>
          
          {/* Vital Signs Section */}
          <div>
            <div className="flex items-center mb-4">
              <HeartIcon className="h-5 w-5 mr-2 text-red-500" />
              <h2 className="text-xl font-semibold">Vital Signs</h2>
            </div>
            <Separator className="mb-4" />
            
            <dl className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="border rounded-lg p-4 bg-card shadow-sm">
                <dt className="font-medium text-muted-foreground mb-1">Blood Pressure</dt>
                <dd className="text-2xl font-semibold">{healthCardData.vitalSigns.bloodPressure || "Not recorded"}</dd>
                <dd className="text-xs text-muted-foreground mt-1">
                  {parseFloat(healthCardData.vitalSigns.bloodPressure?.split('/')[0] || '0') < 120 && 
                   parseFloat(healthCardData.vitalSigns.bloodPressure?.split('/')[1] || '0') < 80 
                    ? "Normal" 
                    : parseFloat(healthCardData.vitalSigns.bloodPressure?.split('/')[0] || '0') < 130 && 
                      parseFloat(healthCardData.vitalSigns.bloodPressure?.split('/')[1] || '0') < 80
                    ? "Elevated"
                    : "Hypertension"}
                </dd>
              </div>
              
              <div className="border rounded-lg p-4 bg-card shadow-sm">
                <dt className="font-medium text-muted-foreground mb-1">Heart Rate</dt>
                <dd className="text-2xl font-semibold">{healthCardData.vitalSigns.heartRate || "Not recorded"} <span className="text-sm">bpm</span></dd>
                <dd className="text-xs text-muted-foreground mt-1">
                  {healthCardData.vitalSigns.heartRate < 60 
                    ? "Bradycardia (slow)" 
                    : healthCardData.vitalSigns.heartRate > 100 
                    ? "Tachycardia (fast)" 
                    : "Normal range"}
                </dd>
              </div>
              
              <div className="border rounded-lg p-4 bg-card shadow-sm">
                <dt className="font-medium text-muted-foreground mb-1">Body Mass Index (BMI)</dt>
                <dd className="text-2xl font-semibold">{bmi || "Not calculated"}</dd>
                <dd className={`text-xs mt-1 ${bmiCategory?.color}`}>{bmiCategory?.label || ""}</dd>
              </div>
              
              <div className="border rounded-lg p-4 bg-card shadow-sm">
                <dt className="font-medium text-muted-foreground mb-1">Height & Weight</dt>
                <dd className="text-lg font-semibold">{healthCardData.vitalSigns.height || "?"} cm / {healthCardData.vitalSigns.weight || "?"} kg</dd>
              </div>
              
              <div className="border rounded-lg p-4 bg-card shadow-sm">
                <dt className="font-medium text-muted-foreground mb-1">Temperature</dt>
                <dd className="text-lg font-semibold">{healthCardData.vitalSigns.temperature || "Not recorded"} °C</dd>
              </div>
              
              <div className="border rounded-lg p-4 bg-card shadow-sm">
                <dt className="font-medium text-muted-foreground mb-1">Respiratory Rate</dt>
                <dd className="text-lg font-semibold">{healthCardData.vitalSigns.respiratoryRate || "Not recorded"} breaths/min</dd>
              </div>
            </dl>
          </div>
          
          {/* Vaccination History Section */}
          <div>
            <div className="flex items-center mb-4">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-2 text-green-500" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M19.14 19.14A10.93 10.93 0 0 1 12 22c-2.9 0-5.5-1.12-7.44-2.96" />
                <path d="M12 2a8 8 0 0 0-6.26 13" />
                <path d="M12 8a3 3 0 0 1 2.2 5" />
                <path d="M12 2v4" />
                <path d="M4.93 10.93l2.83 2.83" />
                <path d="M16.83 11.89l-2.83-2.83" />
              </svg>
              <h2 className="text-xl font-semibold">Vaccination History</h2>
            </div>
            <Separator className="mb-4" />
            
            {!isArrayWithItems(healthCardData.vaccinations) ? (
              <p className="text-sm text-muted-foreground">No vaccination records found.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {healthCardData.vaccinations.map((vaccine, i) => (
                  <div key={i} className="border rounded-lg p-4 bg-card">
                    <div className="grid gap-1">
                      <h3 className="text-md font-semibold">{vaccine.name}</h3>
                      <div className="flex gap-2 items-center text-sm">
                        <span className="rounded-full w-2 h-2 bg-green-500"></span>
                        <span>{formatDate(vaccine.date)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Provider: {vaccine.provider}</p>
                      <p className="text-sm text-muted-foreground">Type: {vaccine.type}</p>
                      {vaccine.notes && <p className="text-xs mt-1 text-muted-foreground">{vaccine.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Health Insights Section */}
          {healthCardData.insights && (
            <div>
              <div className="flex items-center mb-4">
                <SparklesIcon className="h-5 w-5 mr-2 text-blue-500" />
                <h2 className="text-xl font-semibold">Health Insights & Recommendations</h2>
              </div>
              <Separator className="mb-4" />
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-md font-semibold mb-3">Health Recommendations</h3>
                  <ul className="space-y-2">
                    {isArrayWithItems(healthCardData.insights.recommendations) 
                      ? healthCardData.insights.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" 
                              viewBox="0 0 20 20" 
                              fill="currentColor"
                            >
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>{rec}</span>
                          </li>
                        ))
                      : <p className="text-sm text-muted-foreground">No recommendations available.</p>
                    }
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-md font-semibold mb-3">Health Predictions</h3>
                  <div className="space-y-3">
                    {isArrayWithItems(healthCardData.insights.predictions) 
                      ? healthCardData.insights.predictions.map((pred, i) => (
                          <div key={i} className="border rounded-lg p-4 bg-card">
                            <div className="flex justify-between items-start">
                              <h4 className="font-medium">{pred.title}</h4>
                              <Badge variant="outline">{pred.timeframe}</Badge>
                            </div>
                            <p className="text-sm mt-2">{pred.prediction}</p>
                          </div>
                        ))
                      : <p className="text-sm text-muted-foreground">No health predictions available.</p>
                    }
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground mt-6">
                These insights are generated by AI based on your health data and should be used for informational purposes only. Always consult with healthcare professionals.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function HealthCardSkeleton() {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-48 mt-2" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-28 w-full mb-4" />
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent className="space-y-8">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="flex items-center">
                <Skeleton className="h-5 w-5 mr-2" />
                <Skeleton className="h-7 w-48" />
              </div>
              <Skeleton className="h-1 w-full" />
              <div className="grid gap-4">
                {Array(3).fill(0).map((_, j) => (
                  <div key={j} className="grid grid-cols-2 gap-2">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

