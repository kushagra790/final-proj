"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format, parseISO } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import {
  MoonIcon,
  SunIcon,
  CalendarIcon,
  ClockIcon,
  PlusIcon,
  Loader2Icon,
} from "lucide-react";

interface SleepRecord {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  quality: "poor" | "fair" | "good" | "excellent";
  notes?: string;
  createdAt: string;
}

export default function SleepTrackingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>([]);

  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: "",
    endTime: "",
    quality: "good",
    notes: "",
  });

  useEffect(() => {
    async function fetchSleepRecords() {
      setIsLoading(true);
      try {
        const response = await fetch("/api/sleep");
        if (response.ok) {
          const data = await response.json();
          setSleepRecords(data);
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch sleep records",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching sleep data:", error);
        toast({
          title: "Error",
          description: "Something went wrong while loading your sleep data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchSleepRecords();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    // Validate the form data
    const startTime = new Date(formData.startTime);
    const endTime = new Date(formData.endTime);
  
    // Check if end time is after start time
    if (endTime <= startTime) {
      toast({
        title: "Invalid Time Range",
        description: "Wake time must be after bedtime",
        variant: "destructive",
      });
      return;
    }
  
    // Check if the duration is realistic (e.g., not more than 24 hours)
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
  
    if (durationHours > 24) {
      toast({
        title: "Invalid Duration",
        description: "Sleep duration cannot exceed 24 hours",
        variant: "destructive",
      });
      return;
    }
  
    setFormLoading(true);
  
    try {
      // Calculate duration in minutes for storage
      const durationMinutes = Math.round(durationMs / (1000 * 60));
      
      const response = await fetch("/api/sleep", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          quality: formData.quality,
          notes: formData.notes,
          duration: durationMinutes
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save sleep record");
      }
  
      // Success - refresh the sleep records
      const data = await response.json();
      
      // Add the new record to the existing records
      setSleepRecords(prev => [data, ...prev]);
      
      // Reset form
      setFormData({
        date: format(new Date(), "yyyy-MM-dd"),
        startTime: "",
        endTime: "",
        quality: "good",
        notes: "",
      });
  
      toast({
        title: "Success",
        description: "Sleep record saved successfully",
      });
    } catch (error) {
      console.error("Error adding sleep record:", error);
      toast({
        title: "Error",
        description: "Something went wrong while saving your sleep data",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Function to format duration in hours and minutes
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Function to get color class based on sleep quality
  const getQualityColorClass = (quality: string) => {
    switch (quality) {
      case "poor":
        return "text-red-500";
      case "fair":
        return "text-yellow-500";
      case "good":
        return "text-green-500";
      case "excellent":
        return "text-blue-500";
      default:
        return "";
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sleep Tracking</h1>
          <p className="text-muted-foreground">
            Track and monitor your sleep patterns
          </p>
        </div>
        <Button onClick={() => router.push("/tracking")}>
          Back to Dashboard
        </Button>
      </div>

      <Tabs defaultValue="add" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="add" className="flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            Add Sleep Record
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Sleep History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle>Add New Sleep Record</CardTitle>
              <CardDescription>
                Track your sleep hours and quality
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="date"
                        name="date"
                        type="date"
                        value={formData.date}
                        onChange={handleChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quality">Sleep Quality</Label>
                    <Select
                      value={formData.quality}
                      onValueChange={(value) =>
                        handleSelectChange("quality", value)
                      }
                    >
                      <SelectTrigger id="quality">
                        <SelectValue placeholder="Select quality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="poor">Poor</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="excellent">Excellent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Bedtime</Label>
                    <div className="relative">
                      <MoonIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="startTime"
                        name="startTime"
                        type="datetime-local"
                        value={formData.startTime}
                        onChange={handleChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endTime">Wake Time</Label>
                    <div className="relative">
                      <SunIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="endTime"
                        name="endTime"
                        type="datetime-local"
                        value={formData.endTime}
                        onChange={handleChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Add any notes about your sleep quality, dreams, interruptions, etc."
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" type="submit" disabled={formLoading}>
                  {formLoading ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>Save Sleep Record</>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Sleep History</CardTitle>
              <CardDescription>Your recent sleep records</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : sleepRecords.length > 0 ? (
                <div className="space-y-4">
                  {sleepRecords.map((record) => (
                    <Card key={record._id} className="overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                        <div className="bg-muted p-4 flex flex-col justify-center items-center md:w-1/5">
                          <p className="text-lg font-bold">
                            {format(new Date(record.date), "MMM dd, yyyy")}
                          </p>
                          <p
                            className={`text-sm font-medium mt-1 capitalize ${getQualityColorClass(
                              record.quality
                            )}`}
                          >
                            {record.quality} Quality
                          </p>
                        </div>
                        <div className="p-4 md:w-4/5">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex flex-col">
                              <span className="text-sm text-muted-foreground">
                                Bedtime
                              </span>
                              <div className="flex items-center">
                                <MoonIcon className="h-4 w-4 mr-2" />
                                <span>
                                  {format(
                                    new Date(record.startTime),
                                    "hh:mm a"
                                  )}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm text-muted-foreground">
                                Wake Time
                              </span>
                              <div className="flex items-center">
                                <SunIcon className="h-4 w-4 mr-2" />
                                <span>
                                  {format(new Date(record.endTime), "hh:mm a")}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm text-muted-foreground">
                                Duration
                              </span>
                              <div className="flex items-center">
                                <ClockIcon className="h-4 w-4 mr-2" />
                                <span className="font-medium">
                                  {formatDuration(record.duration)}
                                </span>
                              </div>
                            </div>
                          </div>
                          {record.notes && (
                            <>
                              <Separator className="my-3" />
                              <div>
                                <span className="text-sm text-muted-foreground">
                                  Notes:
                                </span>
                                <p className="mt-1">{record.notes}</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No sleep records found.
                  </p>
                  <p className="mt-2">
                    Start tracking your sleep by adding new records.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
