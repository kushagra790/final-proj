"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from 'react-markdown';

interface InsightCardProps {
  title: string;
  description?: string;
  insight: string | null;
  onRefresh?: () => Promise<void>;
  isLoading: boolean;
}

export function InsightCard({
  title,
  description,
  insight,
  onRefresh,
  isLoading,
}: InsightCardProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing || isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          )}
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[95%]" />
            <Skeleton className="h-4 w-[85%]" />
          </div>
        ) : (
          <div className="text-sm text-muted-foreground prose prose-sm max-w-none">
            {insight ? (
              <ReactMarkdown>
                {insight}
              </ReactMarkdown>
            ) : (
              "No insights available. Try refreshing to generate new insights."
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
