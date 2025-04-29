import React from "react";
import Image from "next/image";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Utensils } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MealFood {
  name: string;
  portion: string;
  imageUrl?: string;
}

interface MealProps {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  foods?: MealFood[];
}

export function MealCard({ meal }: { meal: MealProps }) {
  // Check for valid meal data
  if (!meal || typeof meal !== 'object') {
    return (
      <Card className="overflow-hidden h-full flex flex-col">
        <CardHeader className="bg-primary/5 pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Missing Meal Data</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6 flex-grow flex items-center justify-center">
          <p className="text-muted-foreground">Meal information unavailable</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate macros percentage for visualization
  const calculateMacroPercentage = (meal: MealProps) => {
    const totalCaloriesFromMacros = 
      ((meal.protein || 0) * 4) + ((meal.carbs || 0) * 4) + ((meal.fat || 0) * 9);
    
    if (totalCaloriesFromMacros === 0) {
      return { protein: 0, carbs: 0, fat: 0 };
    }
    
    return {
      protein: Math.round(((meal.protein || 0) * 4 / totalCaloriesFromMacros) * 100),
      carbs: Math.round(((meal.carbs || 0) * 4 / totalCaloriesFromMacros) * 100),
      fat: Math.round(((meal.fat || 0) * 9 / totalCaloriesFromMacros) * 100)
    };
  };

  const macroPercentages = calculateMacroPercentage(meal);

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <CardHeader className="bg-primary/5 pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{meal.name}</CardTitle>
          <Badge>{meal.calories} kcal</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-4 flex-grow">
        {meal.foods && meal.foods[0]?.imageUrl ? (
          <div className="aspect-video relative rounded-md overflow-hidden">
            <Image
              src={meal.foods[0].imageUrl}
              alt={meal.foods[0].name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        ) : (
          <div className="aspect-video relative rounded-md overflow-hidden bg-muted flex items-center justify-center">
            <Utensils className="h-10 w-10 text-muted-foreground/50" />
          </div>
        )}
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Macronutrients</span>
              <span className="text-muted-foreground">
                {meal.protein || 0}g P • {meal.carbs || 0}g C • {meal.fat || 0}g F
              </span>
            </div>
            
            <div className="flex items-center gap-1 h-2">
              <div style={{ width: `${macroPercentages.protein}%` }} className="h-full bg-blue-500 rounded-l-full" />
              <div style={{ width: `${macroPercentages.carbs}%` }} className="h-full bg-green-500" />
              <div style={{ width: `${macroPercentages.fat}%` }} className="h-full bg-yellow-500 rounded-r-full" />
            </div>
            
            <div className="flex text-xs justify-between">
              <span>Protein {macroPercentages.protein}%</span>
              <span>Carbs {macroPercentages.carbs}%</span>
              <span>Fat {macroPercentages.fat}%</span>
            </div>
          </div>
          
          {meal.foods && meal.foods.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm">Recommended Foods</Label>
              <ul className="space-y-2">
                {meal.foods.map((food, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Utensils className="h-4 w-4 flex-shrink-0" />
                    <span>
                      <span className="font-medium">{food.name}</span>
                      <span className="text-muted-foreground"> - {food.portion}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function MealCardSkeleton() {
  return (
    <Card className="overflow-hidden h-full">
      <CardHeader className="bg-primary/5 pb-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-16" />
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-4">
        <Skeleton className="aspect-video w-full" />
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
            
            <Skeleton className="h-2 w-full" />
            
            <div className="flex justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-4/5" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
