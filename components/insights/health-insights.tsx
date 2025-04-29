"use client";

import { useState, useEffect } from "react";
import { InsightCard } from "./insight-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface HealthInsightsProps {
  userId: string;
}

export function HealthInsights({ userId }: HealthInsightsProps) {
  const [summaryInsight, setSummaryInsight] = useState<string | null>(null);
  const [predictionsInsight, setPredictionsInsight] = useState<string | null>(null);
  const [lifestyleInsight, setLifestyleInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState({
    summary: true,
    predictions: true,
    lifestyle: true
  });

  useEffect(() => {
    fetchInsights("summary");
    fetchInsights("predictions");
    fetchInsights("lifestyle");
  }, [userId]);

  const fetchInsights = async (type: "summary" | "predictions" | "lifestyle") => {
    setLoading(prev => ({ ...prev, [type]: true }));
    try {
      const response = await fetch(`/api/health/insights?type=${type}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${type} insights`);
      }
      
      const data = await response.json();
      
      switch (type) {
        case "summary":
          setSummaryInsight(data.insight);
          break;
        case "predictions":
          setPredictionsInsight(data.insight);
          break;
        case "lifestyle":
          setLifestyleInsight(data.insight);
          break;
      }
    } catch (error) {
      console.error(`Error fetching ${type} insights:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleRefresh = async (type: "summary" | "predictions" | "lifestyle") => {
    await fetchInsights(type);
  };

  return (
    <Tabs defaultValue="summary" className="w-full">
      <TabsList className="grid grid-cols-3 mb-4">
        <TabsTrigger value="summary">Health Summary</TabsTrigger>
        <TabsTrigger value="predictions">Predictions</TabsTrigger>
        <TabsTrigger value="lifestyle">Lifestyle</TabsTrigger>
      </TabsList>
      
      <TabsContent value="summary">
        <InsightCard
          title="Health Summary"
          description="AI-generated summary of your current health status"
          insight={summaryInsight}
          onRefresh={() => handleRefresh("summary")}
          isLoading={loading.summary}
        />
      </TabsContent>
      
      <TabsContent value="predictions">
        <InsightCard
          title="Health Predictions"
          description="AI-generated predictions and recommendations based on your health data"
          insight={predictionsInsight}
          onRefresh={() => handleRefresh("predictions")}
          isLoading={loading.predictions}
        />
      </TabsContent>
      
      <TabsContent value="lifestyle">
        <InsightCard
          title="Lifestyle Recommendations"
          description="AI-generated lifestyle suggestions to improve your health"
          insight={lifestyleInsight}
          onRefresh={() => handleRefresh("lifestyle")}
          isLoading={loading.lifestyle}
        />
      </TabsContent>
    </Tabs>
  );
} 