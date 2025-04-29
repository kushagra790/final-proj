"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { useSession } from "next-auth/react"
import { 
  Loader2, Check, ArrowLeft, ArrowRight, Weight, Activity, Brain, 
  Moon, Zap, AlertCircle, Heart, Apple, Smile, Frown, Droplets, 
  Pill, Thermometer, Dumbbell, Star, UserCircle, BarChart3, Cake,
  Clock, Pizza, Medal, Ruler, ChevronRight, Sparkles, Coffee, 
  Flame, Scale, ArrowUpRight
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "@/components/ui/use-toast"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"

// Define the form schema with Zod
const healthFormSchema = z.object({
  height: z.string().min(1, "Height is required"),
  weight: z.string().min(1, "Weight is required"),
  age: z.string().min(1, "Age is required"),
  gender: z.string().min(1, "Gender is required"),
  activityLevel: z.string().min(1, "Activity level is required"),
  smokingStatus: z.string(),
  dietType: z.string(),
  bloodPressure: z.string().optional(),
  heartRate: z.string().optional(),
  temperature: z.string().optional(),
  respiratoryRate: z.string().optional(),
  sleepDuration: z.string().optional(),
  stressLevel: z.number().min(1).max(10).default(5),
  allergies: z.string().optional(),
  medications: z.string().optional(),
  chronicConditions: z.string().optional(),
  familyHistory: z.string().optional(),
  surgeries: z.string().optional(),
  fitnessGoals: z.array(z.string()).default([]),
  goalDeadlines: z.record(z.string(), z.string()).default({}), // Map of goal to deadline
  alcoholConsumption: z.string(),
  exercisePreference: z.string(),
})

type HealthFormValues = z.infer<typeof healthFormSchema>

export default function InitialHealthFormPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTips, setShowTips] = useState(true)
  const [progress, setProgress] = useState(0)
  const [completedFields, setCompletedFields] = useState<string[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const [hasHistoricalData, setHasHistoricalData] = useState(false)
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.3 }
    }
  }
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    },
    exit: {
      y: -20,
      opacity: 0,
      transition: { duration: 0.2 }
    }
  }

  const fadeInVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { duration: 0.5 }
    }
  }

  const form = useForm<HealthFormValues>({
    resolver: zodResolver(healthFormSchema),
    defaultValues: {
      height: "",
      weight: "",
      age: "",
      gender: "",
      activityLevel: "",
      smokingStatus: "never",
      dietType: "omnivore",
      bloodPressure: "",
      heartRate: "",
      temperature: "",
      respiratoryRate: "",
      sleepDuration: "",
      stressLevel: 5,
      allergies: "",
      medications: "",
      chronicConditions: "",
      familyHistory: "",
      surgeries: "",
      fitnessGoals: [],
      goalDeadlines: {},
      alcoholConsumption: "none",
      exercisePreference: "cardio",
    },
    mode: "onChange"
  })


  useEffect(() => {
    // Only fetch data if the user is authenticated
    if (status === "authenticated") {
      fetchHealthMetrics()
    } else if (status === "unauthenticated") {
      // If definitely not authenticated, redirect to login
      router.push("/login")
    }
    // Don't do anything while status is "loading"
  }, [status, router])

  const fetchHealthMetrics = async () => {
    try {
      const response = await fetch("/api/health/latest")
      
      if (!response.ok) {
        throw new Error("Failed to fetch health metrics")
      }
      
      const data = await response.json()
      
      // If we have historical data available, show a message
      if (data && data.history && data.history.length > 0) {
        toast({
          title: "Previous health data found",
          description: `We found ${data.history.length} previous health records. Your latest data will be pre-filled.`,
          duration: 5000,
        })
        setHasHistoricalData(true)
      }
      
      // Convert numeric values to strings before setting form values to match schema
      const formattedData = {
        ...data,
        height: data.height?.toString() || "",
        weight: data.weight?.toString() || "",
        age: data.age?.toString() || "",
        heartRate: data.heartRate?.toString() || "",
        sleepDuration: data.sleepDuration?.toString() || "",
        stressLevel: typeof data.stressLevel === 'number' ? data.stressLevel : 5,
        // goalDeadlines is now a plain object, just ensure it's defined
        goalDeadlines: data.goalDeadlines || {}
      }
      
      form.reset(formattedData)
    } catch (error) {
      console.error("Error fetching health metrics:", error)
    }
  }

  
  // Define the steps for the form
  const steps = [
    {
      title: "Basic Information",
      description: "Let's start with some basic health metrics",
      icon: <UserCircle className="h-5 w-5" />,
      fields: ["height", "weight", "age", "gender", "activityLevel"],
    },
    {
      title: "Lifestyle",
      description: "Tell us about your lifestyle habits",
      icon: <Activity className="h-5 w-5" />,
      fields: ["smokingStatus", "dietType", "sleepDuration", "stressLevel", "alcoholConsumption", "exercisePreference"],
    },
    {
      title: "Medical Information",
      description: "Share your medical history to help us personalize your experience",
      icon: <Heart className="h-5 w-5" />,
      fields: ["bloodPressure", "heartRate", "allergies", "medications", "chronicConditions", "familyHistory", "surgeries"],
    },
    {
      title: "Goals & Aspirations",
      description: "Setting clear, achievable goals is the first step toward improving your health",
      icon: <Medal className="h-5 w-5" />,
      fields: ["fitnessGoals"],
    },
  ]

  // Fix the useEffect to avoid infinite loops
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      const allFields = steps.flatMap(step => step.fields);
      const filledFields = allFields.filter(field => {
        const fieldValue = form.getValues(field as any);
        return fieldValue !== undefined && fieldValue !== "" && fieldValue !== null;
      });
      
      setCompletedFields(filledFields);
      
      const newProgress = Math.round((filledFields.length / allFields.length) * 100);
      setProgress(newProgress);
    });
    
    // Cleanup subscription on component unmount
    return () => subscription.unsubscribe();
  }, [form, steps]);

  // Check if the user is authenticated
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <motion.div 
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Heart className="h-12 w-12 text-primary/40" />
              </motion.div>
            </div>
          </motion.div>
          <motion.p 
            className="text-muted-foreground text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Loading your health profile...
          </motion.p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  async function onSubmit(values: HealthFormValues) {
    setIsSubmitting(true)
    setError(null)

    try {
      // Convert string values to appropriate types
      const formattedValues = {
        ...values,
        height: parseFloat(values.height),
        weight: parseFloat(values.weight),
        age: parseInt(values.age),
        heartRate: values.heartRate ? parseInt(values.heartRate) : undefined,
        sleepDuration: values.sleepDuration ? parseFloat(values.sleepDuration) : undefined,
        // Ensure goalDeadlines is properly formatted (it's already a plain object)
        goalDeadlines: values.goalDeadlines || {},
      }

      // Add timestamp for history tracking
      const dataWithTimestamp = {
        ...formattedValues,
        recordedAt: new Date(),
      };

      const response = await fetch("/api/health/initial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataWithTimestamp),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to save health data")
      }

      setShowConfetti(true)
      
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (err: any) {
      console.error("Error saving health data:", err)
      setError(err.message || "An error occurred while saving your health data. Please try again.")
      setIsSubmitting(false)
    }
  }

  function nextStep() {
    const fields = steps[currentStep].fields
    const output = form.trigger(fields as any)
    
    output.then((valid) => {
      if (valid) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
      }
    })
  }

  function prevStep() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  // Replace the handleSubmit function with this implementation
  function handleFinalSubmit() {
    // Always submit the form when in edit mode
    if (hasHistoricalData) {
      form.handleSubmit(onSubmit)();
      return;
    }
    
    // For new entries, only submit if on the last step
    if (currentStep === steps.length - 1) {
      form.handleSubmit(onSubmit)();
    }
  }

  function jumpToStep(stepIndex: number) {
    if (stepIndex < currentStep) {
      setCurrentStep(stepIndex)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // Check if previous steps are valid before jumping forward
      const previousFields = steps.slice(0, stepIndex).flatMap(step => step.fields)
      form.trigger(previousFields as any).then(isValid => {
        if (isValid) {
          setCurrentStep(stepIndex)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        } else {
          toast({
            title: "Please complete previous steps first",
            description: "Make sure to fill all required fields from previous steps",
            variant: "destructive",
          })
        }
      })
    }
  }

  const currentStepData = steps[currentStep]

  return (
    <div className="bg-gradient-to-b from-background to-background/95 min-h-screen pb-20">
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <motion.div 
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* This would be where you'd add confetti animation */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-primary/20 rounded-full p-20"
              >
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="bg-primary/30 rounded-full p-16"
                >
                  <motion.div 
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                    className="bg-primary/40 rounded-full p-12 flex items-center justify-center"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Check className="h-20 w-20 text-primary" />
                    </motion.div>
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
          <motion.div 
            className="absolute top-1/3 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-4xl font-bold text-primary mb-2">Health Profile Complete!</h2>
            <p className="text-lg text-muted-foreground">Redirecting you to your personalized dashboard...</p>
          </motion.div>
        </div>
      )}

      <div className="container mx-auto py-10">
        {/* Progress indicator */}
        <div className="fixed top-0 left-0 w-full bg-background/80 backdrop-blur-sm z-30 border-b">
          <div className="container max-w-6xl mx-auto py-4 px-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Heart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-medium">Health Profile</h2>
                  <p className="text-sm text-muted-foreground">
                    {progress === 100 ? 'Ready to submit!' : `${progress}% complete`}
                  </p>
                </div>
              </div>
              
              <div className="flex-1 max-w-md">
                <div className="flex items-center gap-3">
                  <Progress value={progress} className="h-2" />
                  <span className="text-xs font-medium w-8">{progress}%</span>
                </div>
              </div>
              
              <div className="hidden lg:flex items-center gap-4">
                {steps.map((step, idx) => (
                  <motion.button
                    key={idx}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm",
                      currentStep === idx 
                        ? "bg-primary text-primary-foreground" 
                        : idx < currentStep
                        ? "bg-primary/10 text-primary hover:bg-primary/20" 
                        : "bg-muted hover:bg-muted/80"
                    )}
                    onClick={() => jumpToStep(idx)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium",
                      currentStep === idx
                        ? "bg-primary-foreground text-primary" 
                        : idx < currentStep
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted-foreground/20 text-muted-foreground"
                    )}>
                      {idx + 1}
                    </span>
                    {step.title}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Mobile step indicators */}
          <div className="lg:hidden w-full overflow-x-auto scrollbar-hide">
            <div className="flex w-full px-4 py-2 gap-2 min-w-max">
              {steps.map((step, idx) => (
                <motion.button
                  key={idx}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm whitespace-nowrap",
                    currentStep === idx 
                      ? "bg-primary text-primary-foreground" 
                      : idx < currentStep
                      ? "bg-primary/10 text-primary hover:bg-primary/20" 
                      : "bg-muted hover:bg-muted/80"
                  )}
                  onClick={() => jumpToStep(idx)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium",
                    currentStep === idx
                      ? "bg-primary-foreground text-primary" 
                      : idx < currentStep
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted-foreground/20 text-muted-foreground"
                  )}>
                    {idx + 1}
                  </span>
                  {step.title}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-24 pb-20">
          {/* Main content and sidebar layout */}
          <div className="flex flex-col md:flex-row gap-6 max-w-7xl mx-auto">
            {/* Main form content */}
            <div className="flex-1">
              <motion.div
                key={`step-${currentStep}`}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={containerVariants}
              >
                {/* Step Header */}
                <motion.div variants={itemVariants} className="mb-8">
                  <motion.div
                    className="flex items-start gap-4"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="bg-primary/10 p-3 rounded-xl">
                      {currentStepData.icon}
                    </div>
                    <div>
                      <motion.h1 
                        className="text-3xl font-bold"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        {currentStepData.title}
                      </motion.h1>
                      <motion.p 
                        className="text-muted-foreground mt-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        {currentStepData.description}
                      </motion.p>
                    </div>
                  </motion.div>
                </motion.div>

                <Form {...form}>
                  <form onSubmit={(e) => e.preventDefault()} className="space-y-10">
                    {/* Step 1: Basic Information */}
                    {currentStep === 0 && (
                      <motion.div variants={containerVariants} className="space-y-10">
                        <motion.div variants={itemVariants} className="bg-gradient-to-br from-card/50 to-card rounded-xl shadow-sm overflow-hidden">
                          <div className="bg-primary/5 px-6 py-4 border-b border-border/50">
                            <div className="flex items-center gap-2">
                              <Ruler className="h-5 w-5 text-primary" />
                              <h2 className="font-medium text-lg">Body Measurements</h2>
                            </div>
                          </div>
                          <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <FormField
                                control={form.control}
                                name="height"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-base flex items-center gap-2">
                                      <Ruler className="h-4 w-4 text-muted-foreground" />
                                      Height
                                    </FormLabel>
                                    <FormControl>
                                      <div className="relative mt-2">
                                        <Input 
                                          type="number" 
                                          placeholder="175" 
                                          {...field} 
                                          className="pl-4 pr-14 h-12 text-lg" 
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground font-medium">
                                          cm
                                        </div>
                                      </div>
                                    </FormControl>
                                    <FormDescription className="flex items-center gap-2 mt-2">
                                      <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: field.value ? parseInt(field.value) / 4 : 0 }}
                                        className="w-1 bg-primary rounded-full"
                                        style={{ maxHeight: '100px' }}
                                      />
                                      Enter your height in centimeters
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="weight"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-base flex items-center gap-2">
                                      <Weight className="h-4 w-4 text-muted-foreground" />
                                      Weight
                                    </FormLabel>
                                    <FormControl>
                                      <div className="relative mt-2">
                                        <Input 
                                          type="number" 
                                          placeholder="70" 
                                          {...field} 
                                          className="pl-4 pr-12 h-12 text-lg" 
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground font-medium">
                                          kg
                                        </div>
                                      </div>
                                    </FormControl>
                                    <FormDescription className="flex items-center gap-2 mt-2">
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: field.value ? 1 : 0 }}
                                        className="text-2xl"
                                      >
                                        <Scale className="h-5 w-5 text-primary" />
                                      </motion.div>
                                      Enter your weight in kilograms
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="bg-gradient-to-br from-card/50 to-card rounded-xl shadow-sm overflow-hidden">
                          <div className="bg-primary/5 px-6 py-4 border-b border-border/50">
                            <div className="flex items-center gap-2">
                              <UserCircle className="h-5 w-5 text-primary" />
                              <h2 className="font-medium text-lg">Personal Details</h2>
                            </div>
                          </div>
                          <div className="p-6 space-y-8">
                            <FormField
                              control={form.control}
                              name="age"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-base flex items-center gap-2">
                                    <Cake className="h-4 w-4 text-muted-foreground" />
                                    Age
                                  </FormLabel>
                                  <FormControl>
                                    <div className="relative mt-2 max-w-xs">
                                      <Input 
                                        type="number" 
                                        placeholder="30" 
                                        {...field} 
                                        className="pl-4 pr-14 h-12 text-lg" 
                                      />
                                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground font-medium">
                                        years
                                      </div>
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="gender"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-base flex items-center gap-2">
                                    <UserCircle className="h-4 w-4 text-muted-foreground" />
                                    Gender
                                  </FormLabel>
                                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                                    {[
                                      { value: "male", label: "Male" },
                                      { value: "female", label: "Female" },
                                      { value: "non-binary", label: "Non-binary" },
                                      { value: "other", label: "Other" },
                                      { value: "prefer-not-to-say", label: "Prefer not to say" }
                                    ].map((option) => (
                                      <motion.div
                                        key={option.value}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                      >
                                        <Button
                                          type="button"
                                          variant="outline"
                                          className={cn(
                                            "w-full h-auto py-3 justify-center transition-all",
                                            field.value === option.value 
                                              ? "border-primary bg-primary/5 text-foreground" 
                                              : "hover:bg-primary/5 hover:border-primary/30"
                                          )}
                                          onClick={() => field.onChange(option.value)}
                                        >
                                          <div className="text-center">
                                            {option.label}
                                          </div>
                                        </Button>
                                      </motion.div>
                                    ))}
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="activityLevel"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-base flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-muted-foreground" />
                                    Activity Level
                                  </FormLabel>
                                  <div className="space-y-3 pt-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-muted-foreground">Sedentary</span>
                                      <span className="text-sm text-muted-foreground">Very Active</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                                      {[
                                        { 
                                          value: "sedentary", 
                                          label: "Sedentary", 
                                          description: "Little or no exercise",
                                          color: "bg-blue-500/80"
                                        },
                                        { 
                                          value: "light", 
                                          label: "Light", 
                                          description: "Exercise 1-3 days/week",
                                          color: "bg-cyan-500/80"
                                        },
                                        { 
                                          value: "moderate", 
                                          label: "Moderate", 
                                          description: "Exercise 3-5 days/week",
                                          color: "bg-green-500/80"
                                        },
                                        { 
                                          value: "active", 
                                          label: "Active", 
                                          description: "Exercise 6-7 days/week",
                                          color: "bg-yellow-500/80"
                                        },
                                        { 
                                          value: "very-active", 
                                          label: "Very active", 
                                          description: "Very hard daily exercise",
                                          color: "bg-orange-500/80"
                                        }
                                      ].map((option, idx) => (
                                        <motion.div
                                          key={option.value}
                                          whileHover={{ scale: 1.03, y: -2 }}
                                          whileTap={{ scale: 0.97 }}
                                        >
                                          <Button
                                            type="button"
                                            variant="outline"
                                            className={cn(
                                              "w-full h-auto py-3 justify-center transition-all relative overflow-hidden",
                                              field.value === option.value 
                                                ? "border-primary text-foreground" 
                                                : "hover:border-primary/30"
                                            )}
                                            onClick={() => field.onChange(option.value)}
                                          >
                                            {field.value === option.value && (
                                              <motion.div
                                                layoutId="activityBg"
                                                className={cn(
                                                  "absolute inset-0 opacity-10",
                                                )}
                                                style={{ backgroundColor: option.color }}
                                              />
                                            )}
                                            <div className="relative z-10">
                                              <div className="font-medium">{option.label}</div>
                                              <div className="text-xs text-muted-foreground">{option.description}</div>
                                            </div>
                                          </Button>
                                        </motion.div>
                                      ))}
                                    </div>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </motion.div>
                      </motion.div>
                    )}

                    {/* Step 2: Lifestyle */}
                    {currentStep === 1 && (
                      <motion.div variants={containerVariants} className="space-y-10">
                        <motion.div variants={itemVariants} className="bg-gradient-to-br from-card/50 to-card rounded-xl shadow-sm overflow-hidden">
                          <div className="bg-primary/5 px-6 py-4 border-b border-border/50">
                            <div className="flex items-center gap-2">
                              <Droplets className="h-5 w-5 text-primary" />
                              <h2 className="font-medium text-lg">Lifestyle Habits</h2>
                            </div>
                          </div>
                          <div className="p-6 space-y-8">
                            <FormField
                              control={form.control}
                              name="smokingStatus"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-base flex items-center gap-2">
                                    <Droplets className="h-4 w-4 text-muted-foreground" />
                                    Smoking Status
                                  </FormLabel>
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                                    {[
                                      { value: "never", label: "Never" },
                                      { value: "former", label: "Former" },
                                      { value: "occasional", label: "Occasional" },
                                      { value: "regular", label: "Regular" }
                                    ].map((option) => (
                                      <motion.div
                                        key={option.value}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                      >
                                        <Button
                                          type="button"
                                          variant="outline"
                                          className={cn(
                                            "w-full h-auto py-3 justify-center transition-all",
                                            field.value === option.value 
                                              ? "border-primary bg-primary/5 text-foreground" 
                                              : "hover:bg-primary/5 hover:border-primary/30"
                                          )}
                                          onClick={() => field.onChange(option.value)}
                                        >
                                          <div className="text-center">
                                            {option.label}
                                          </div>
                                        </Button>
                                      </motion.div>
                                    ))}
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="dietType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-base flex items-center gap-2">
                                    <Pizza className="h-4 w-4 text-muted-foreground" />
                                    Diet Type
                                  </FormLabel>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                                    {[
                                      { value: "omnivore", label: "Omnivore" },
                                      { value: "pescatarian", label: "Pescatarian" },
                                      { value: "vegetarian", label: "Vegetarian" },
                                      { value: "vegan", label: "Vegan" },
                                      { value: "keto", label: "Keto" },
                                      { value: "paleo", label: "Paleo" },
                                      { value: "other", label: "Other" }
                                    ].map((option) => (
                                      <motion.div
                                        key={option.value}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                      >
                                        <Button
                                          type="button"
                                          variant="outline"
                                          className={cn(
                                            "w-full h-auto py-3 justify-center transition-all",
                                            field.value === option.value 
                                              ? "border-primary bg-primary/5 text-foreground" 
                                              : "hover:bg-primary/5 hover:border-primary/30"
                                          )}
                                          onClick={() => field.onChange(option.value)}
                                        >
                                          <div className="text-center">
                                            {option.label}
                                          </div>
                                        </Button>
                                      </motion.div>
                                    ))}
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="sleepDuration"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-base flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    Average Sleep Duration
                                  </FormLabel>
                                  <FormControl>
                                    <div className="relative mt-2 max-w-xs">
                                      <Input 
                                        type="number" 
                                        placeholder="7.5" 
                                        {...field} 
                                        className="pl-4 pr-14 h-12 text-lg" 
                                      />
                                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground font-medium">
                                        hours
                                      </div>
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="stressLevel"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-base flex items-center gap-2">
                                    <Flame className="h-4 w-4 text-muted-foreground" />
                                    Stress Level
                                  </FormLabel>
                                  <FormControl>
                                    <div className="space-y-2 mt-2">
                                      <Slider
                                        min={1}
                                        max={10}
                                        step={1}
                                        value={[field.value]}
                                        onValueChange={(vals) => field.onChange(vals[0])}
                                      />
                                      <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Low Stress (1)</span>
                                        <span>High Stress (10)</span>
                                      </div>
                                    </div>
                                  </FormControl>
                                  <FormDescription>Current value: {field.value}</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="alcoholConsumption"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-base flex items-center gap-2">
                                    <Droplets className="h-4 w-4 text-muted-foreground" />
                                    Alcohol Consumption
                                  </FormLabel>
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                                    {[
                                      { value: "none", label: "None" },
                                      { value: "occasional", label: "Occasional" },
                                      { value: "moderate", label: "Moderate" },
                                      { value: "frequent", label: "Frequent" }
                                    ].map((option) => (
                                      <motion.div
                                        key={option.value}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                      >
                                        <Button
                                          type="button"
                                          variant="outline"
                                          className={cn(
                                            "w-full h-auto py-3 justify-center transition-all",
                                            field.value === option.value 
                                              ? "border-primary bg-primary/5 text-foreground" 
                                              : "hover:bg-primary/5 hover:border-primary/30"
                                          )}
                                          onClick={() => field.onChange(option.value)}
                                        >
                                          <div className="text-center">
                                            {option.label}
                                          </div>
                                        </Button>
                                      </motion.div>
                                    ))}
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="exercisePreference"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-base flex items-center gap-2">
                                    <Dumbbell className="h-4 w-4 text-muted-foreground" />
                                    Exercise Preference
                                  </FormLabel>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                                    {[
                                      { 
                                        value: "cardio", 
                                        label: "Cardio", 
                                        icon: <Activity className="h-4 w-4" />,
                                        description: "Running, cycling, swimming" 
                                      },
                                      { 
                                        value: "strength", 
                                        label: "Strength", 
                                        icon: <Dumbbell className="h-4 w-4" />,
                                        description: "Weight training, resistance" 
                                      },
                                      { 
                                        value: "balanced", 
                                        label: "Balanced", 
                                        icon: <Zap className="h-4 w-4" />,
                                        description: "Mix of cardio and strength" 
                                      }
                                    ].map((option) => (
                                      <motion.div
                                        key={option.value}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                      >
                                        <Button
                                          type="button"
                                          variant="outline"
                                          className={cn(
                                            "w-full h-auto py-4 justify-start transition-all",
                                            field.value === option.value 
                                              ? "border-primary bg-primary/5 text-foreground" 
                                              : "hover:bg-primary/5 hover:border-primary/30"
                                          )}
                                          onClick={() => field.onChange(option.value)}
                                        >
                                          <div className="flex flex-col items-center w-full text-center gap-2">
                                            <div className={cn(
                                              "w-10 h-10 rounded-full flex items-center justify-center",
                                              field.value === option.value 
                                                ? "bg-primary text-primary-foreground" 
                                                : "bg-muted"
                                            )}>
                                              {option.icon}
                                            </div>
                                            <div>
                                              <div className="font-medium">{option.label}</div>
                                              <div className="text-xs text-muted-foreground">{option.description}</div>
                                            </div>
                                          </div>
                                        </Button>
                                      </motion.div>
                                    ))}
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </motion.div>
                      </motion.div>
                    )}

                    {/* Step 3: Medical Information */}
                    {currentStep === 2 && (
                      <motion.div variants={containerVariants} className="space-y-10">
                        <motion.div variants={itemVariants} className="bg-gradient-to-br from-card/50 to-card rounded-xl shadow-sm overflow-hidden">
                          <div className="bg-primary/5 px-6 py-4 border-b border-border/50">
                            <div className="flex items-center gap-2">
                              <Heart className="h-5 w-5 text-primary" />
                              <h2 className="font-medium text-lg">Medical Information</h2>
                            </div>
                          </div>
                          <div className="p-6 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <FormField
                                control={form.control}
                                name="bloodPressure"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-base flex items-center gap-2">
                                      <Heart className="h-4 w-4 text-muted-foreground" />
                                      Blood Pressure
                                    </FormLabel>
                                    <FormControl>
                                      <Input placeholder="120/80" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                      Format: systolic/diastolic
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="heartRate"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-base flex items-center gap-2">
                                      <Activity className="h-4 w-4 text-muted-foreground" />
                                      Resting Heart Rate
                                    </FormLabel>
                                    <FormControl>
                                      <Input type="number" placeholder="70" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                      Beats per minute (BPM)
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <FormField
                                control={form.control}
                                name="temperature"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-base flex items-center gap-2">
                                      <Thermometer className="h-4 w-4 text-muted-foreground" />
                                      Body Temperature
                                    </FormLabel>
                                    <FormControl>
                                      <Input type="number" step="0.1" placeholder="36.8" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                      Degrees Celsius (°C)
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="respiratoryRate"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-base flex items-center gap-2">
                                      <Droplets className="h-4 w-4 text-muted-foreground" />
                                      Respiratory Rate
                                    </FormLabel>
                                    <FormControl>
                                      <Input type="number" placeholder="16" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                      Breaths per minute
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <Tabs defaultValue="allergies" className="w-full">
                              <TabsList className="grid grid-cols-3 mb-4">
                                <TabsTrigger value="allergies">Allergies</TabsTrigger>
                                <TabsTrigger value="medications">Medications</TabsTrigger>
                                <TabsTrigger value="conditions">Conditions</TabsTrigger>
                              </TabsList>
                              <TabsContent value="allergies">
                                <motion.div variants={itemVariants}>
                                  <FormField
                                    control={form.control}
                                    name="allergies"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-base flex items-center gap-2">
                                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                          Allergies
                                        </FormLabel>
                                        <FormControl>
                                          <Textarea
                                            placeholder="List any allergies you have (food, medication, environmental, etc.)"
                                            className="min-h-[120px] resize-none"
                                            {...field}
                                          />
                                        </FormControl>
                                        <FormDescription>
                                          Leave blank if none
                                        </FormDescription>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </motion.div>
                              </TabsContent>
                              <TabsContent value="medications">
                                <motion.div variants={itemVariants}>
                                  <FormField
                                    control={form.control}
                                    name="medications"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-base flex items-center gap-2">
                                          <Pill className="h-4 w-4 text-muted-foreground" />
                                          Current Medications
                                        </FormLabel>
                                        <FormControl>
                                          <Textarea
                                            placeholder="List any medications you're currently taking"
                                            className="min-h-[120px] resize-none"
                                            {...field}
                                          />
                                        </FormControl>
                                        <FormDescription>
                                          Include dosage if known
                                        </FormDescription>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </motion.div>
                              </TabsContent>
                              <TabsContent value="conditions">
                                <motion.div variants={itemVariants}>
                                  <FormField
                                    control={form.control}
                                    name="chronicConditions"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-base flex items-center gap-2">
                                          <Thermometer className="h-4 w-4 text-muted-foreground" />
                                          Chronic Conditions
                                        </FormLabel>
                                        <FormControl>
                                          <Textarea
                                            placeholder="List any chronic health conditions you have"
                                            className="min-h-[120px] resize-none"
                                            {...field}
                                          />
                                        </FormControl>
                                        <FormDescription>
                                          E.g., diabetes, hypertension, asthma
                                        </FormDescription>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </motion.div>
                              </TabsContent>
                            </Tabs>
                            
                            <motion.div variants={itemVariants}>
                              <FormField
                                control={form.control}
                                name="familyHistory"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-base flex items-center gap-2">
                                      <Heart className="h-4 w-4 text-muted-foreground" />
                                      Family Medical History
                                    </FormLabel>
                                    <FormControl>
                                      <Textarea
                                        placeholder="List any significant health conditions in your immediate family"
                                        className="min-h-[100px] resize-none"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      Include conditions in parents, siblings, and grandparents
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </motion.div>
                            
                            <motion.div variants={itemVariants}>
                              <FormField
                                control={form.control}
                                name="surgeries"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-base flex items-center gap-2">
                                      <Thermometer className="h-4 w-4 text-muted-foreground" />
                                      Past Surgeries
                                    </FormLabel>
                                    <FormControl>
                                      <Textarea
                                        placeholder="List any surgeries you've had"
                                        className="min-h-[100px] resize-none"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      Include approximate dates if possible
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </motion.div>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}

                    {/* Step 4: Goals & Aspirations */}
                    {currentStep === 3 && (
                      <motion.div variants={containerVariants} className="space-y-10">
                        <motion.div
                          variants={itemVariants}
                          className="bg-primary/5 p-6 rounded-lg border border-primary/10"
                        >
                          <FormField
                            control={form.control}
                            name="fitnessGoals"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2 text-base font-medium">
                                  <Dumbbell className="h-4 w-4 text-primary" />
                                  Your Health & Fitness Goals
                                </FormLabel>
                                <FormDescription className="mb-4">
                                  Select all goals that apply to you. These will help us personalize your experience.
                                </FormDescription>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  { [
                                    {
                                      value: "weight-loss",
                                      label: "Weight Loss",
                                      description: "Reduce body fat and improve body composition",
                                      icon: <Weight className="h-4 w-4" />
                                    },
                                    {
                                      value: "muscle-gain",
                                      label: "Muscle Gain", 
                                      description: "Build strength and increase muscle mass",
                                      icon: <Dumbbell className="h-4 w-4" />
                                    },
                                    {
                                      value: "endurance",
                                      label: "Improve Endurance",
                                      description: "Enhance cardiovascular fitness and stamina",
                                      icon: <Activity className="h-4 w-4" />
                                    },
                                    {
                                      value: "flexibility",
                                      label: "Increase Flexibility",
                                      description: "Improve mobility and range of motion",
                                      icon: <Zap className="h-4 w-4" />
                                    },
                                    {
                                      value: "stress-reduction",
                                      label: "Stress Reduction",
                                      description: "Better stress management and mental wellbeing",
                                      icon: <Brain className="h-4 w-4" />
                                    },
                                    {
                                      value: "sleep-improvement",
                                      label: "Sleep Improvement",
                                      description: "Better sleep quality and duration",
                                      icon: <Moon className="h-4 w-4" />
                                    },
                                    {
                                      value: "nutrition",
                                      label: "Better Nutrition",
                                      description: "Improve eating habits and diet quality",
                                      icon: <Apple className="h-4 w-4" />
                                    },
                                    {
                                      value: "chronic-condition",
                                      label: "Manage Chronic Condition",
                                      description: "Better management of ongoing health issues",
                                      icon: <Heart className="h-4 w-4" />
                                    }
                                  ].map((goal) => {
                                    return (
                                      <div className="flex flex-col space-y-3" key={goal.value}>
                                        <div className="flex items-start space-x-2">
                                          <Checkbox
                                            id={`goal-${goal.value}`}
                                            checked={field.value?.includes(goal.value)}
                                            onCheckedChange={(checked) => {
                                              const currentValues = field.value || [];
                                              if (checked) {
                                                field.onChange([...currentValues, goal.value]);
                                              } else {
                                                field.onChange(
                                                  currentValues.filter((value) => value !== goal.value)
                                                );
                                                
                                                // Remove deadline when goal is unchecked
                                                const currentDeadlines = form.getValues("goalDeadlines") || {};
                                                delete currentDeadlines[goal.value];
                                                form.setValue("goalDeadlines", currentDeadlines);
                                              }
                                            }}
                                          />
                                          <div className="grid gap-1.5 leading-none">
                                            <label
                                              htmlFor={`goal-${goal.value}`}
                                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                                            >
                                              <div className="bg-primary/10 p-1.5 rounded-full text-primary">
                                                {goal.icon}
                                              </div>
                                              {goal.label}
                                            </label>
                                            <p className="text-xs text-muted-foreground">
                                              {goal.description}
                                            </p>
                                          </div>
                                        </div>
                                        
                                        {/* Deadline input appears when goal is selected */}
                                        {field.value?.includes(goal.value) && (
                                          <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="ml-6 pl-2 border-l border-primary/20"
                                          >
                                            <FormField
                                              control={form.control}
                                              name={`goalDeadlines.${goal.value}`}
                                              render={({ field: deadlineField }) => (
                                                <FormItem className="flex flex-col">
                                                  <FormLabel className="text-xs flex items-center gap-1 text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    Target Deadline
                                                  </FormLabel>
                                                  <FormControl>
                                                    <Input
                                                      type="date"
                                                      {...deadlineField}
                                                      className="h-8 text-sm"
                                                      min={new Date().toISOString().split('T')[0]} // Set min to today
                                                    />
                                                  </FormControl>
                                                  <FormDescription className="text-xs">
                                                    When do you want to achieve this goal?
                                                  </FormDescription>
                                                </FormItem>
                                              )}
                                            />
                                          </motion.div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </motion.div>
                        
                        <motion.div 
                          variants={itemVariants}
                          className="bg-green-50 dark:bg-green-950/30 p-6 rounded-lg mt-6 border border-green-200 dark:border-green-900"
                        >
                          <h3 className="text-lg font-medium flex items-center gap-2 mb-2 text-green-700 dark:text-green-400">
                            <Check className="h-5 w-5" />
                            Almost Done!
                          </h3>
                          <p className="text-sm text-green-600 dark:text-green-300">
                            Thank you for taking the time to provide your health information. This will help us create a personalized experience for you.
                            Click "Complete" below to submit your information and start your health journey with us.
                          </p>
                        </motion.div>
                      </motion.div>
                    )}
                  </form>
                </Form>
              </motion.div>
            </div>
            
            {/* Health Tips Sidebar - MOVED OUTSIDE THE MAIN FORM CONTENT DIV */}
            <div className="w-full md:w-80 xl:w-96">
              <div className="md:sticky md:top-32">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Health Tips
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowTips(!showTips)}
                    className="text-xs"
                  >
                    {showTips ? "Hide Tips" : "Show Tips"}
                  </Button>
                </div>
                
                <AnimatePresence>
                  {showTips && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-3">
                            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full text-blue-600 dark:text-blue-400">
                              <Heart className="h-4 w-4" />
                            </div>
                            <div>
                              <h3 className="font-medium text-blue-700 dark:text-blue-400">Health Tip</h3>
                              <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                                Regular physical activity can help reduce the risk of chronic diseases and improve your mental health.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-3">
                            <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full text-green-600 dark:text-green-400">
                              <Apple className="h-4 w-4" />
                            </div>
                            <div>
                              <h3 className="font-medium text-green-700 dark:text-green-400">Nutrition Tip</h3>
                              <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                                Aim for at least 5 servings of fruits and vegetables daily to get essential vitamins and minerals.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-3">
                            <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-full text-purple-600 dark:text-purple-400">
                              <Moon className="h-4 w-4" />
                            </div>
                            <div>
                              <h3 className="font-medium text-purple-700 dark:text-purple-400">Wellness Tip</h3>
                              <p className="text-sm text-purple-600 dark:text-purple-300 mt-1">
                                Adults should aim for 7-9 hours of quality sleep each night for optimal health and wellbeing.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-3">
                            <div className="bg-amber-100 dark:bg-amber-900 p-2 rounded-full text-amber-600 dark:text-amber-400">
                              <Coffee className="h-4 w-4" />
                            </div>
                            <div>
                              <h3 className="font-medium text-amber-700 dark:text-amber-400">Hydration Tip</h3>
                              <p className="text-sm text-amber-600 dark:text-amber-300 mt-1">
                                Staying well-hydrated improves energy levels, cognitive function, and helps maintain healthy skin.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-3">
                            <div className="bg-rose-100 dark:bg-rose-900 p-2 rounded-full text-rose-600 dark:text-rose-400">
                              <Brain className="h-4 w-4" />
                            </div>
                            <div>
                              <h3 className="font-medium text-rose-700 dark:text-rose-400">Mental Health Tip</h3>
                              <p className="text-sm text-rose-600 dark:text-rose-300 mt-1">
                                Practice mindfulness or meditation for just 10 minutes daily to reduce stress and improve focus.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
        
        {/* Fixed footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t z-30">
          <div className="container mx-auto max-w-7xl">
            <div className="flex justify-between py-4 px-4">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center gap-2 transition-all hover:bg-primary/5"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>
              
              {currentStep < steps.length - 1 ? (
                <Button 
                  type="button" 
                  onClick={nextStep}
                  className="flex items-center gap-2 transition-all"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  type="button" 
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 transition-all relative overflow-hidden group bg-green-600 hover:bg-green-700 text-white"
                >
                  <span className={cn(
                    "transition-all duration-300",
                    isSubmitting ? "opacity-0" : "opacity-100"
                  )}>
                    Complete
                  </span>
                  <span className={cn(
                    "absolute inset-0 flex items-center justify-center transition-all duration-300",
                    isSubmitting ? "opacity-100" : "opacity-0"
                  )}>
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </span>
                  <Check className={cn(
                    "h-4 w-4 transition-all duration-300",
                    isSubmitting ? "opacity-0" : "opacity-100"
                  )} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

