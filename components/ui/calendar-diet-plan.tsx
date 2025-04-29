"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Calendar, Clock, Utensils, Coffee, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks } from "date-fns"
import Image from "next/image"
import { capitalizeFirst } from "@/utils/formatting"

interface MealData {
  name: string;
  calories: number;
  foods: Array<{
    name: string;
    portion: string;
    imageUrl?: string;
  }>;
}

interface DayPlanData {
  date: Date;
  breakfast: MealData | null;
  lunch: MealData | null;
  dinner: MealData | null;
}

interface CalendarDietPlanProps {
  dietPlan: any;
  weeklyData: DayPlanData[];
  className?: string;
  onDayClick?: (dayIndex: number) => void;
}

export function CalendarDietPlan({ dietPlan, weeklyData, className, onDayClick }: CalendarDietPlanProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  // Calculate the week range
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }) // Week starts on Monday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
  const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd })
  
  // Navigation functions
  const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1))
  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1))
  const today = () => setCurrentDate(new Date())
  
  // Get meal data for a specific day
  const getDayPlan = (date: Date): DayPlanData | undefined => {
    return weeklyData.find(day => isSameDay(day.date, date))
  }
  
  // Helper function to render meal card
  const renderMealCard = (meal: MealData | null, mealType: string, icon: React.ReactNode, date: Date) => {
    if (!meal) {
      return (
        <div className="border rounded-md p-3 h-32 flex flex-col items-center justify-center text-muted-foreground bg-muted/30">
          {icon}
          <p className="mt-2 text-xs">No {mealType} planned</p>
        </div>
      )
    }
    
    // Create a function to handle clicking on a meal
    const handleMealClick = () => {
      // Format the date to include in our query params
      const formattedDate = format(date, "yyyy-MM-dd");
      // You could dispatch a custom event or use a state management solution here
      // For simplicity, we'll just set a URL parameter and let the parent component handle it
      const event = new CustomEvent('selectMeal', {
        bubbles: true,
        detail: { date: formattedDate, mealType }
      });
      document.dispatchEvent(event);
    };
    
    return (
      <div 
        className="border rounded-md p-3 h-32 overflow-hidden relative cursor-pointer hover:border-primary transition-colors"
        onClick={handleMealClick}
      >
        {meal.foods[0]?.imageUrl && (
          <div className="absolute inset-0 opacity-10">
            <Image
              src={meal.foods[0]?.imageUrl}
              alt={meal.foods[0]?.name}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="flex justify-between items-start mb-1">
          <div className="flex items-center">
            {icon}
            <h4 className="text-sm font-medium ml-1">{capitalizeFirst(mealType)}</h4>
          </div>
          <Badge variant="outline" className="text-xs">
            {meal.calories} kcal
          </Badge>
        </div>
        <div className="space-y-1 mt-2">
          {meal.foods.slice(0, 2).map((food, idx) => (
            <div key={idx} className="flex items-start gap-1 text-xs">
              <Utensils className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-1">{food.name}</span>
            </div>
          ))}
          {meal.foods.length > 2 && (
            <span className="text-xs text-muted-foreground">
              + {meal.foods.length - 2} more items
            </span>
          )}
        </div>
      </div>
    )
  }
  
  return (
    <div className={className}>
      <div className="flex flex-col space-y-4">
        {/* Calendar header with navigation */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Weekly Meal Plan
            </h2>
            <p className="text-sm text-muted-foreground">
              {format(weekStart, "MMMM d")} - {format(weekEnd, "MMMM d, yyyy")}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={prevWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={today}>Today</Button>
            <Button variant="outline" size="icon" onClick={nextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Days of week grid */}
        <div className="grid grid-cols-7 gap-4">
          {daysOfWeek.map((day) => {
            const dayPlan = getDayPlan(day)
            const isToday = isSameDay(day, new Date())
            
            return (
              <Card key={day.toString()} className={`${isToday ? 'border-primary' : ''}`}>
                <CardHeader className="p-3 pb-2">
                  <CardTitle className={`text-sm ${isToday ? 'text-primary' : ''}`}>
                    {format(day, "EEE")}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {format(day, "d MMM")}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="p-2 space-y-2">
                  {/* Breakfast */}
                  {renderMealCard(
                    dayPlan?.breakfast || null, 
                    'breakfast',
                    <Coffee className="h-3.5 w-3.5 text-orange-500" />,
                    day
                  )}
                  
                  {/* Lunch */}
                  {renderMealCard(
                    dayPlan?.lunch || null,
                    'lunch',
                    <Sun className="h-3.5 w-3.5 text-yellow-500" />,
                    day
                  )}
                  
                  {/* Dinner */}
                  {renderMealCard(
                    dayPlan?.dinner || null,
                    'dinner',
                    <Moon className="h-3.5 w-3.5 text-blue-500" />,
                    day
                  )}
                </CardContent>
                
                <CardFooter className="p-2 pt-0">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full h-7 text-xs"
                          onClick={() => {
                            // Find the index of the day in the weekly data array
                            const dayIndex = daysOfWeek.findIndex(d => 
                              isSameDay(d, day)
                            );
                            // Call the onDayClick handler if provided
                            if (onDayClick) {
                              onDayClick(dayIndex);
                            }
                          }}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View detailed meal plan for this day</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
