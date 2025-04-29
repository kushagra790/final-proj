"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FlameIcon as FireIcon, CameraIcon, Loader2, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation"
import Image from "next/image";
import { useSession } from "next-auth/react";

type EntryMethod = "percentages" | "grams" | "image";

interface FoodEntry {
  id: string;
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  protein_percent?: number;
  carbs_percent?: number;
  fats_percent?: number;
  recorded_at: string;
  image_url?: string;
}

export default function FoodTrackingPage() {
  const [entryMethod, setEntryMethod] = useState<EntryMethod>("image");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [calories, setCalories] = useState<number | null>(null);
  const [foodName, setFoodName] = useState<string>("");
  const [proteinPercent, setProteinPercent] = useState<number>(30);
  const [carbsPercent, setCarbsPercent] = useState<number>(40);
  const [fatsPercent, setFatsPercent] = useState<number>(30);
  const [proteinGrams, setProteinGrams] = useState<number | null>(null);
  const [carbsGrams, setCarbsGrams] = useState<number | null>(null);
  const [fatsGrams, setFatsGrams] = useState<number | null>(null);
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [totalCalories, setTotalCalories] = useState<number>(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);
  const router = useRouter()
  const { data: session } = useSession();

  // Calculate macros from percentages and calories
  const calculateMacrosFromPercentages = (): {
    protein: number;
    carbs: number;
    fats: number;
  } => {
    if (!calories) return { protein: 0, carbs: 0, fats: 0 };

    const protein = Math.round((calories * (proteinPercent / 100)) / 4);
    const carbs = Math.round((calories * (carbsPercent / 100)) / 4);
    const fats = Math.round((calories * (fatsPercent / 100)) / 9);

    return { protein, carbs, fats };
  };

  // Calculate calories from macros in grams
  const calculateCaloriesFromMacros = (): number => {
    if (!proteinGrams || !carbsGrams || !fatsGrams) return 0;

    return Math.round(proteinGrams * 4 + carbsGrams * 4 + fatsGrams * 9);
  };

  // Handle percentage change and recalculate other percentages to ensure they total 100%
  const handlePercentageChange = (
    type: "protein" | "carbs" | "fats",
    value: number
  ) => {
    // Ensure value is between 0 and 100
    const newValue = Math.min(100, Math.max(0, value));

    if (type === "protein") {
      setProteinPercent(newValue);
      // Adjust other percentages proportionally
      const remaining = 100 - newValue;
      const currentOtherTotal = carbsPercent + fatsPercent;
      if (currentOtherTotal > 0) {
        setCarbsPercent(
          Math.round((carbsPercent / currentOtherTotal) * remaining)
        );
        setFatsPercent(
          Math.round((fatsPercent / currentOtherTotal) * remaining)
        );
      } else {
        setCarbsPercent(Math.round(remaining / 2));
        setFatsPercent(Math.round(remaining / 2));
      }
    } else if (type === "carbs") {
      setCarbsPercent(newValue);
      // Adjust other percentages proportionally
      const remaining = 100 - newValue;
      const currentOtherTotal = proteinPercent + fatsPercent;
      if (currentOtherTotal > 0) {
        setProteinPercent(
          Math.round((proteinPercent / currentOtherTotal) * remaining)
        );
        setFatsPercent(
          Math.round((fatsPercent / currentOtherTotal) * remaining)
        );
      } else {
        setProteinPercent(Math.round(remaining / 2));
        setFatsPercent(Math.round(remaining / 2));
      }
    } else {
      setFatsPercent(newValue);
      // Adjust other percentages proportionally
      const remaining = 100 - newValue;
      const currentOtherTotal = proteinPercent + carbsPercent;
      if (currentOtherTotal > 0) {
        setProteinPercent(
          Math.round((proteinPercent / currentOtherTotal) * remaining)
        );
        setCarbsPercent(
          Math.round((carbsPercent / currentOtherTotal) * remaining)
        );
      } else {
        setProteinPercent(Math.round(remaining / 2));
        setCarbsPercent(Math.round(remaining / 2));
      }
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsAnalyzing(true);
      setValidationError(null);

      // Show preview of the image (for immediate feedback)
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        setSelectedImage(imageData);
      };
      reader.readAsDataURL(file);

      // Send the file to our backend for Cloudinary upload and AI analysis
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/food/analyze-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          `API returned ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Store the raw analysis for debugging
      setAiAnalysisResult(data.raw_analysis || JSON.stringify(data));

      // Update form with the analyzed data
      setFoodName(data.food_name || "");
      setCalories(data.calories || null);
      setProteinGrams(data.protein_g || null);
      setCarbsGrams(data.carbs_g || null);
      setFatsGrams(data.fats_g || null);

      // Update the image with the Cloudinary URL
      if (data.image_url) {
        setSelectedImage(data.image_url);
      }

      // Set entry method to grams since we have the gram data
      setEntryMethod("grams");
    } catch (error: any) {
      setValidationError(`Failed to analyze the image: ${error.message}`);
      console.error("Image upload error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const validateForm = (): boolean => {
    if (!foodName || foodName.trim() === "") {
      setValidationError("Please enter a food name");
      return false;
    }

    if (entryMethod === "percentages") {
      if (!calories || calories <= 0) {
        setValidationError("Please enter a valid calorie amount");
        return false;
      }

      if (proteinPercent + carbsPercent + fatsPercent !== 100) {
        setValidationError("Macronutrient percentages must add up to 100%");
        return false;
      }
    } else {
      if (
        !proteinGrams ||
        !carbsGrams ||
        !fatsGrams ||
        proteinGrams < 0 ||
        carbsGrams < 0 ||
        fatsGrams < 0
      ) {
        setValidationError("Please enter valid macronutrient values");
        return false;
      }
    }

    setValidationError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    let newEntry: FoodEntry;

    if (entryMethod === "percentages") {
      const macros = calculateMacrosFromPercentages();

      newEntry = {
        id: Math.random().toString(36).substring(2, 9),
        food_name: foodName,
        calories: calories || 0,
        protein_g: macros.protein,
        carbs_g: macros.carbs,
        fats_g: macros.fats,
        protein_percent: proteinPercent,
        carbs_percent: carbsPercent,
        fats_percent: fatsPercent,
        recorded_at: new Date().toISOString(),
        image_url: selectedImage || undefined,
      };
    } else {
      const calculatedCalories = calculateCaloriesFromMacros();

      newEntry = {
        id: Math.random().toString(36).substring(2, 9),
        food_name: foodName,
        calories: calculatedCalories,
        protein_g: proteinGrams || 0,
        carbs_g: carbsGrams || 0,
        fats_g: fatsGrams || 0,
        recorded_at: new Date().toISOString(),
        image_url: selectedImage || undefined,
      };
    }

    try {
      // Send the entry to our API
      const response = await fetch("/api/food", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newEntry,
          userId: session?.user.id, // In a real app, this would be the authenticated user's ID
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save food entry");
      }

      const savedEntry = await response.json();

      // Update local state
      const updatedEntries = [savedEntry, ...foodEntries];
      setFoodEntries(updatedEntries);
      setTotalCalories(totalCalories + savedEntry.calories);

      // Reset form
      setFoodName("");
      setCalories(null);
      setSelectedImage(null);
      setProteinGrams(null);
      setCarbsGrams(null);
      setFatsGrams(null);
      setAiAnalysisResult(null);
    } catch (error) {
      console.error("Error saving food entry:", error);
      setValidationError("Failed to save food entry");
    }
  };

  // Fetch food entries for the user
  useEffect(() => {
    const fetchFoodEntries = async () => {
      try {
        if (session?.user?.id) {
          const response = await fetch(`/api/food?userId=${session.user.id}`);
          if (response.ok) {
            const data = await response.json();
            setFoodEntries(data);
            setTotalCalories(
              data.reduce(
                (sum: number, entry: FoodEntry) => sum + entry.calories,
                0
              )
            );
          }
        }
      } catch (error) {
        console.error("Error fetching food entries:", error);
      }
    };

    fetchFoodEntries();
  }, [session]);

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
        <h1 className="text-3xl font-bold">Food Tracking</h1>
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Log Your Food</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              value={entryMethod}
              onValueChange={(value) => setEntryMethod(value as EntryMethod)}
            >
              <TabsList className="w-full mb-4">
                <TabsTrigger value="image" className="flex-1">
                  By Image
                </TabsTrigger>
                <TabsTrigger value="grams" className="flex-1">
                  By Grams
                </TabsTrigger>
                <TabsTrigger value="percentages" className="flex-1">
                  By Calories & Percents
                </TabsTrigger>
              </TabsList>

              {validationError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{validationError}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="food-name">Food Name</Label>
                  <Input
                    id="food-name"
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                    placeholder="Enter food name"
                  />
                </div>

                <TabsContent value="image">
                  <div className="space-y-4">
                    <div className="flex flex-col items-center justify-center">
                      <Label
                        htmlFor="food-image"
                        className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        {selectedImage ? (
                          <img
                            src={selectedImage}
                            alt="Food preview"
                            className="h-full object-contain"
                          />
                        ) : (
                          <>
                            <CameraIcon className="h-10 w-10 text-gray-400" />
                            <span className="mt-2 text-sm text-gray-500">
                              Upload food image
                            </span>
                          </>
                        )}
                      </Label>
                      <Input
                        id="food-image"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </div>

                    {isAnalyzing && (
                      <div className="flex flex-col items-center justify-center p-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="mt-2 text-sm text-gray-500">
                          Analyzing food image...
                        </p>
                      </div>
                    )}

                    {selectedImage && !isAnalyzing && (
                      <div className="mt-4 p-3 bg-muted rounded-md">
                        <p className="text-sm font-medium mb-2">
                          AI Analysis Results:
                        </p>
                        {aiAnalysisResult ? (
                          <div className="space-y-1 text-sm">
                            <p>
                              Food:{" "}
                              <span className="font-medium">{foodName}</span>
                            </p>
                            <p>
                              Calories:{" "}
                              <span className="font-medium">{calories}</span>
                            </p>
                            <p>
                              Protein:{" "}
                              <span className="font-medium">
                                {proteinGrams}g
                              </span>
                            </p>
                            <p>
                              Carbs:{" "}
                              <span className="font-medium">{carbsGrams}g</span>
                            </p>
                            <p>
                              Fats:{" "}
                              <span className="font-medium">{fatsGrams}g</span>
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">
                            No analysis available
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="grams">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="protein-grams">Protein (grams)</Label>
                      <Input
                        id="protein-grams"
                        type="number"
                        value={proteinGrams || ""}
                        onChange={(e) =>
                          setProteinGrams(Number(e.target.value))
                        }
                        placeholder="Enter protein in grams"
                      />
                    </div>
                    <div>
                      <Label htmlFor="carbs-grams">Carbs (grams)</Label>
                      <Input
                        id="carbs-grams"
                        type="number"
                        value={carbsGrams || ""}
                        onChange={(e) => setCarbsGrams(Number(e.target.value))}
                        placeholder="Enter carbs in grams"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fats-grams">Fats (grams)</Label>
                      <Input
                        id="fats-grams"
                        type="number"
                        value={fatsGrams || ""}
                        onChange={(e) => setFatsGrams(Number(e.target.value))}
                        placeholder="Enter fats in grams"
                      />
                    </div>

                    {proteinGrams && carbsGrams && fatsGrams && (
                      <div className="mt-4 p-3 bg-muted rounded-md">
                        <p className="text-sm font-medium">
                          Calculated calories: {calculateCaloriesFromMacros()}
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="percentages">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="calories">Calories</Label>
                      <Input
                        id="calories"
                        type="number"
                        value={calories || ""}
                        onChange={(e) => setCalories(Number(e.target.value))}
                        placeholder="Enter calories"
                      />
                    </div>
                    <div>
                      <Label htmlFor="protein-percent">
                        Protein ({proteinPercent}%)
                      </Label>
                      <Input
                        className="accent-primary"
                        id="protein-percent"
                        type="range"
                        min="0"
                        max="100"
                        value={proteinPercent}
                        onChange={(e) =>
                          handlePercentageChange(
                            "protein",
                            Number(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="carbs-percent">
                        Carbs ({carbsPercent}%)
                      </Label>
                      <Input
                        className="accent-primary"
                        id="carbs-percent"
                        type="range"
                        min="0"
                        max="100"
                        value={carbsPercent}
                        onChange={(e) =>
                          handlePercentageChange(
                            "carbs",
                            Number(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="fats-percent">
                        Fats ({fatsPercent}%)
                      </Label>
                      <Input
                        className="accent-primary"
                        id="fats-percent"
                        type="range"
                        min="0"
                        max="100"
                        value={fatsPercent}
                        onChange={(e) =>
                          handlePercentageChange("fats", Number(e.target.value))
                        }
                      />
                    </div>

                    {calories && (
                      <div className="mt-4 p-3 bg-muted rounded-md">
                        <p className="text-sm font-medium mb-1">
                          Calculated macros:
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            Protein: {calculateMacrosFromPercentages().protein}g
                          </div>
                          <div>
                            Carbs: {calculateMacrosFromPercentages().carbs}g
                          </div>
                          <div>
                            Fats: {calculateMacrosFromPercentages().fats}g
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <Button type="submit" className="w-full" disabled={isAnalyzing}>
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Log Food"
                  )}
                </Button>
              </form>
            </Tabs>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-center">
              <FireIcon className="mr-2 h-6 w-6 text-primary" />
              Total Calories Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div className="text-6xl font-bold text-primary animate-pulse">
                {totalCalories}
              </div>
              <p className="mt-2 text-xl text-muted-foreground">calories</p>
            </div>
            <CardDescription className="flex justify-center my-4">
            <Image 
              src="/over-weight-girl.png" 
              alt="Overweight Girl" 
              width={200} 
              height={100}
              className="mx-auto" 
            />
            </CardDescription>
          </CardContent>
        </Card>
      </div>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Recent Food Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {foodEntries.map((entry) => (
              <li key={entry.id} className="border-b pb-3">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    {entry.image_url && (
                      <img
                        src={entry.image_url}
                        alt={entry.food_name}
                        className="w-10 h-10 rounded-md object-cover mr-3"
                      />
                    )}
                    <span className="font-medium text-lg">
                      {entry.food_name}
                    </span>
                  </div>
                  <span className="font-bold">{entry.calories} calories</span>
                </div>
                <div className="text-sm text-muted-foreground grid grid-cols-3">
                  <div>Protein: {entry.protein_g}g</div>
                  <div>Carbs: {entry.carbs_g}g</div>
                  <div>Fats: {entry.fats_g}g</div>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
