import { TooltipProvider } from "@/components/ui/tooltip"

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TooltipProvider>
      <div className="container mx-auto py-6">
        {children}
      </div>
    </TooltipProvider>
  )
}
