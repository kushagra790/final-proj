"use client"

import { useState } from "react"
import { Button } from "./button"
import { FileDown, Loader2 } from "lucide-react"
import { saveAs } from "file-saver"
import { toast } from "./use-toast"

interface DietPlanPdfProps {
  plan: any
  className?: string
}

export function DietPlanPdf({ plan, className }: DietPlanPdfProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const generatePdf = async () => {
    if (!plan || !plan.meals) {
      toast({
        title: "Error",
        description: "No diet plan data available to generate PDF",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    try {
      // Server-side PDF generation
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ 
          type: 'dietPlan',
          data: plan,
          id: plan._id // Make sure to pass the plan ID
        }),
        // Add cache control to prevent duplicate requests
        cache: 'no-store'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to generate PDF')
      }

      // Get the blob from the response
      const blob = await response.blob()
      
      // Use file-saver to save the file
      saveAs(blob, `diet-plan-${plan._id || 'new'}-${new Date().toISOString().split('T')[0]}.pdf`)

      toast({
        title: "Success!",
        description: "Your diet plan PDF has been generated",
      })
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate PDF. Please try again.",
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
      onClick={generatePdf}
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
          Download PDF
        </>
      )}
    </Button>
  )
}
