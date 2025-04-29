"use client"

import { useState } from "react"
import { Button } from "./button"
import { FileDown, Loader2 } from "lucide-react"
import { saveAs } from "file-saver"
import { toast } from "./use-toast"

interface WeeklyPlanExportProps {
  planId: string
  className?: string
}

export function WeeklyPlanExport({ planId, className }: WeeklyPlanExportProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const exportWeeklyPlan = async () => {
    if (!planId) {
      toast({
        title: "Error",
        description: "No plan ID provided for export",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    try {
      // Server-side PDF generation
      const response = await fetch('/api/diet-plan/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ 
          id: planId,
          format: 'pdf'
        }),
        // Add cache control to prevent duplicate requests
        cache: 'no-store'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to export weekly plan')
      }

      // Get the blob from the response
      const blob = await response.blob()
      
      // Use file-saver to save the file
      saveAs(blob, `weekly-meal-plan-${new Date().toISOString().split('T')[0]}.pdf`)

      toast({
        title: "Success!",
        description: "Your weekly meal plan has been exported",
      })
    } catch (error) {
      console.error('Error exporting weekly plan:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to export weekly plan. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={exportWeeklyPlan}
      disabled={isGenerating}
      className={className}
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <FileDown className="mr-2 h-4 w-4" />
          Export Meal Plan
        </>
      )}
    </Button>
  )
}
