"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
// Define the type for exercise logs
interface ExerciseLog {
  _id: string;
  name: string;
  category: string;
  sets: number;
  reps: number;
  caloriesBurned: number;
  date: string;
  imageUrl?: string;
}

// Restructured exercises data with categories
const exercises = [
  // Home exercises
  { name: "Push-ups", caloriesPerRep: 0.5, category: "home" },
  { name: "Sit-ups", caloriesPerRep: 0.3, category: "home" },
  { name: "Squats", caloriesPerRep: 0.6, category: "home" },
  { name: "Jumping Jacks", caloriesPerRep: 0.2, category: "home" },
  { name: "Burpees", caloriesPerRep: 1.0, category: "home" },
  { name: "Lunges", caloriesPerRep: 0.4, category: "home" },
  { name: "Planks", caloriesPerRep: 0.3, category: "home" },
  { name: "Mountain Climbers", caloriesPerRep: 0.4, category: "home" },
  { name: "High Knees", caloriesPerRep: 0.3, category: "home" },
  { name: "Crunches", caloriesPerRep: 0.2, category: "home" },
  { name: "Bicycle Crunches", caloriesPerRep: 0.3, category: "home" },
  { name: "Glute Bridges", caloriesPerRep: 0.3, category: "home" },
  { name: "Tricep Dips", caloriesPerRep: 0.4, category: "home" },
  { name: "Wall Sits", caloriesPerRep: 0.4, category: "home" },
  { name: "Superman", caloriesPerRep: 0.2, category: "home" },
  { name: "Russian Twists", caloriesPerRep: 0.3, category: "home" },
  { name: "Leg Raises", caloriesPerRep: 0.3, category: "home" },
  { name: "Jump Rope", caloriesPerRep: 0.2, category: "home" },
  { name: "Jump Squats", caloriesPerRep: 0.7, category: "home" },
  { name: "Bear Crawls", caloriesPerRep: 0.5, category: "home" },
  
  // Gym exercises
  { name: "Bench Press", caloriesPerRep: 0.7, category: "gym" },
  { name: "Lat Pulldown", caloriesPerRep: 0.6, category: "gym" },
  { name: "Leg Press", caloriesPerRep: 0.8, category: "gym" },
  { name: "Deadlift", caloriesPerRep: 1.2, category: "gym" },
  { name: "Shoulder Press", caloriesPerRep: 0.7, category: "gym" },
  { name: "Bicep Curls", caloriesPerRep: 0.4, category: "gym" },
  { name: "Tricep Extensions", caloriesPerRep: 0.4, category: "gym" },
  { name: "Leg Curls", caloriesPerRep: 0.5, category: "gym" },
  { name: "Leg Extensions", caloriesPerRep: 0.5, category: "gym" },
  { name: "Chest Fly", caloriesPerRep: 0.6, category: "gym" },
  { name: "Back Row", caloriesPerRep: 0.7, category: "gym" },
  { name: "Calf Raises", caloriesPerRep: 0.3, category: "gym" },
  { name: "Pull-ups", caloriesPerRep: 0.8, category: "gym" },
  { name: "Dips", caloriesPerRep: 0.7, category: "gym" },
  { name: "Cable Crossovers", caloriesPerRep: 0.5, category: "gym" },
  { name: "Barbell Squats", caloriesPerRep: 1.0, category: "gym" },
  { name: "Hack Squats", caloriesPerRep: 0.9, category: "gym" },
  { name: "Seated Rows", caloriesPerRep: 0.6, category: "gym" },
  { name: "Military Press", caloriesPerRep: 0.8, category: "gym" },
  { name: "Romanian Deadlift", caloriesPerRep: 1.0, category: "gym" },
  { name: "Preacher Curls", caloriesPerRep: 0.5, category: "gym" },
  { name: "Lateral Raises", caloriesPerRep: 0.4, category: "gym" },
  { name: "Face Pulls", caloriesPerRep: 0.5, category: "gym" },
  { name: "Hip Abductor", caloriesPerRep: 0.4, category: "gym" },
  { name: "Hip Adductor", caloriesPerRep: 0.4, category: "gym" }
]

export default function ExerciseTrackingPage() {
  const [inputMethod, setInputMethod] = useState<"predefined" | "manual">("predefined")
  const [exerciseCategory, setExerciseCategory] = useState<"home" | "gym">("home")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedExercise, setSelectedExercise] = useState(exercises.find(e => e.category === "home") || exercises[0])
  const [manualExerciseName, setManualExerciseName] = useState("")
  const [manualCaloriesPerRep, setManualCaloriesPerRep] = useState(0.5)
  const [manualCaloriesInput, setManualCaloriesInput] = useState(true)
  const [isGeneratingCalories, setIsGeneratingCalories] = useState(false)
  const [sets, setSets] = useState(3)
  const [reps, setReps] = useState(10)
  const [caloriesBurned, setCaloriesBurned] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [exerciseImage, setExerciseImage] = useState<string | null>(null)
  const [isLoadingImage, setIsLoadingImage] = useState(false)
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([])
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Filter exercises based on category and search query
  const filteredExercises = useMemo(() => {
    return exercises
      .filter(exercise => exercise.category === exerciseCategory)
      .filter(exercise => 
        searchQuery === "" || 
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
  }, [exerciseCategory, searchQuery])

  // Reset selected exercise when changing categories
  const handleCategoryChange = (category: "home" | "gym") => {
    setExerciseCategory(category)
    const defaultExercise = exercises.find(e => e.category === category)
    if (defaultExercise) {
      setSelectedExercise(defaultExercise)
    }
  }

  const calculateCalories = () => {
    const totalReps = sets * reps
    const calories = totalReps * 
      (inputMethod === "predefined" 
        ? selectedExercise.caloriesPerRep 
        : manualCaloriesPerRep)
    setCaloriesBurned(Math.round(calories))
  }

  const generateCaloriesPerRep = async () => {
    if (!manualExerciseName) return;
    
    setIsGeneratingCalories(true);
    try {
      const response = await fetch('/api/exercise/calories-per-reps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ exerciseName: manualExerciseName }),
      });
      
      const data = await response.json();
      
      if (response.ok && typeof data.caloriesPerRep === 'number') {
        setManualCaloriesPerRep(data.caloriesPerRep);
      } else {
        // If the API returns an error or non-numeric value, set a default
        console.error('Failed to get accurate calories estimate:', data.error || 'Unknown error');
        setManualCaloriesPerRep(0.5); // Default fallback value
      }
    } catch (error) {
      console.error('Error generating calories per rep:', error);
    } finally {
      setIsGeneratingCalories(false);
    }
  }

  const getCurrentExerciseName = () => {
    return inputMethod === "predefined" ? selectedExercise.name : manualExerciseName
  }

  const fetchExerciseImage = async (exerciseName: string) => {
    if (!exerciseName) return null
    
    setIsLoadingImage(true)
    try {
      const response = await fetch('/api/exercise/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ exerciseName }),
      })
      
      const data = await response.json()
      
      if (response.ok && data.imageUrl) {
        setExerciseImage(data.imageUrl)
        return data.imageUrl
      } else {
        console.error('Failed to get exercise image:', data.error || 'Unknown error')
        setExerciseImage(null)
        return null
      }
    } catch (error) {
      console.error('Error generating exercise image:', error)
      setExerciseImage(null)
      return null
    } finally {
      setIsLoadingImage(false)
    }
  }

  const calculateAndSaveCalories = async () => {
    const totalReps = sets * reps
    const calories = totalReps * 
      (inputMethod === "predefined" 
        ? selectedExercise.caloriesPerRep 
        : manualCaloriesPerRep)
    const roundedCalories = Math.round(calories)
    setCaloriesBurned(roundedCalories)
    
    const exerciseName = getCurrentExerciseName()
    
    // Fetch image for the exercise first and wait for it to complete
    setIsSaving(true)
    let imageUrl = null
    try {
      imageUrl = await fetchExerciseImage(exerciseName)
      
      // After getting the image (or null if it failed), save the exercise data
      const response = await fetch('/api/exercise/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: exerciseName,
          category: inputMethod === "predefined" ? selectedExercise.category : "custom",
          sets,
          reps,
          caloriesBurned: roundedCalories,
          imageUrl: imageUrl, // Now we have the actual image URL to save
        }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: "Exercise Logged",
          description: `${exerciseName} has been saved successfully.`,
        })
        
        // Refresh the exercise logs after saving
        fetchExerciseLogs();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to save exercise",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error saving exercise:', error)
      toast({
        title: "Error",
        description: "Failed to connect to the server",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Fetch exercise logs
  const fetchExerciseLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const response = await fetch('/api/exercise/log');
      const data = await response.json();
      
      if (response.ok && Array.isArray(data.logs)) {
        setExerciseLogs(data.logs);
      } else {
        console.error('Failed to fetch exercise logs:', data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error fetching exercise logs:', error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Load exercise logs when the component mounts
  useEffect(() => {
    fetchExerciseLogs();
  }, []);

  // Format date function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="container mx-auto py-8">
       <div className="flex items-center gap-2 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/tracking')}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <h1 className="text-3xl font-bold">Exercise Tracking</h1>
            </div>
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Log Exercise</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label>Exercise Input Method</Label>
                <RadioGroup 
                  defaultValue="predefined" 
                  value={inputMethod}
                  onValueChange={(value) => setInputMethod(value as "predefined" | "manual")}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="predefined" id="predefined" />
                    <Label htmlFor="predefined">Choose from list</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="manual" id="manual" />
                    <Label htmlFor="manual">Enter manually</Label>
                  </div>
                </RadioGroup>
              </div>

              {inputMethod === "predefined" && (
                <>
                  <div className="space-y-2">
                    <Label>Exercise Category</Label>
                    <RadioGroup 
                      value={exerciseCategory}
                      onValueChange={(value) => handleCategoryChange(value as "home" | "gym")}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="home" id="home" />
                        <Label htmlFor="home">Home Exercises</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="gym" id="gym" />
                        <Label htmlFor="gym">Gym Exercises</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="search-exercise">Search Exercise</Label>
                    <Input
                      id="search-exercise"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Type to search..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exercise">Select Exercise</Label>
                    <Select
                      onValueChange={(value) =>
                        setSelectedExercise(exercises.find((e) => e.name === value) || filteredExercises[0])
                      }
                      value={selectedExercise.name}
                    >
                      <SelectTrigger id="exercise">
                        <SelectValue placeholder="Select an exercise" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredExercises.length > 0 ? (
                          filteredExercises.map((exercise) => (
                            <SelectItem key={exercise.name} value={exercise.name}>
                              {exercise.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            No exercises found
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {inputMethod === "manual" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="exercise-name">Exercise Name</Label>
                    <Input
                      id="exercise-name"
                      value={manualExerciseName}
                      onChange={(e) => setManualExerciseName(e.target.value)}
                      placeholder="E.g. Mountain Climbers"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Calories per Rep</Label>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroup 
                        defaultValue="manual" 
                        value={manualCaloriesInput ? "manual" : "ai"}
                        onValueChange={(value) => setManualCaloriesInput(value === "manual")}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="manual" id="manual-calories" />
                          <Label htmlFor="manual-calories">Enter manually</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="ai" id="ai-calories" />
                          <Label htmlFor="ai-calories">Generate with AI</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    {manualCaloriesInput ? (
                      <Input
                        id="calories-per-rep"
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={manualCaloriesPerRep}
                        onChange={(e) => setManualCaloriesPerRep(Number(e.target.value))}
                      />
                    ) : (
                      <div className="flex space-x-2">
                        <Input
                          value={manualCaloriesPerRep}
                          readOnly
                        />
                        <Button
                          type="button" 
                          onClick={generateCaloriesPerRep} 
                          disabled={!manualExerciseName || isGeneratingCalories}
                        >
                          {isGeneratingCalories ? "Generating..." : "Generate"}
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="sets">Number of Sets</Label>
                <Input
                  id="sets"
                  type="number"
                  min="1"
                  value={sets}
                  onChange={(e) => setSets(Number.parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reps">Reps per Set</Label>
                <Input
                  id="reps"
                  type="number"
                  min="1"
                  value={reps}
                  onChange={(e) => setReps(Number.parseInt(e.target.value))}
                />
              </div>
              <Button 
                type="button" 
                onClick={calculateAndSaveCalories} 
                className="w-full"
                disabled={(inputMethod === "manual" && !manualExerciseName) || 
                          (inputMethod === "predefined" && filteredExercises.length === 0) ||
                          isSaving}
              >
                {isSaving ? "Saving..." : "Log Exercise"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Calories Burned</CardTitle>
          </CardHeader>
          <CardContent>
            {caloriesBurned === null ? (
              <p className="text-center text-gray-500">Log an exercise to see calories burned</p>
            ) : (
              <div className="text-center">
                <p className="text-4xl font-bold text-primary">{caloriesBurned}</p>
                <p className="text-xl text-gray-500">Estimated Calories Burned</p>
                <p className="mt-2 text-gray-500">Exercise: {getCurrentExerciseName()}</p>
                <p className="mt-4 text-sm text-gray-400">Logged at: {new Date().toLocaleTimeString()}</p>
                
                {/* Exercise image section */}
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-2">Exercise Reference</h3>
                  <div className="relative w-full h-60 border rounded-md overflow-hidden">
                    {isLoadingImage ? (
                      <Skeleton className="w-full h-full" />
                    ) : exerciseImage ? (
                      <Image 
                        src={exerciseImage} 
                        alt={`${getCurrentExerciseName()} exercise demonstration`}
                        fill
                        style={{ objectFit: 'contain' }}
                        className="p-2"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        No image available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Previous Exercise Logs Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Previous Exercise Logs</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchExerciseLogs}
              disabled={isLoadingLogs}
            >
              {isLoadingLogs ? "Refreshing..." : "Refresh"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingLogs ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="w-full h-16" />
              ))}
            </div>
          ) : exerciseLogs.length > 0 ? (
            <div className="space-y-4">
              {exerciseLogs.map((log) => (
                <div 
                  key={log._id} 
                  className="flex items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="relative w-16 h-16 mr-4 rounded-md overflow-hidden border">
                    {log.imageUrl ? (
                      <Image 
                        src={log.imageUrl} 
                        alt={log.name}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <span className="text-xs text-muted-foreground">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <div className="font-medium">{log.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {log.sets} sets × {log.reps} reps • {log.caloriesBurned} calories
                    </div>
                    <div className="text-xs text-muted-foreground">{formatDate(log.date)}</div>
                  </div>
                  <div className="ml-4">
                    <div className="px-2 py-1 rounded-full text-xs bg-muted">
                      {log.category}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No exercise logs available. Start by logging an exercise!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

