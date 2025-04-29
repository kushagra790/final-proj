import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SparklesIcon } from "lucide-react";

interface AIBadgeProps {
  size?: "sm" | "md" | "lg";
  tooltip?: string;
}

export function AIBadge({ size = "sm", tooltip = "This content was generated using AI based on your health data" }: AIBadgeProps) {
  const sizeClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center cursor-help">
            <SparklesIcon className={`${sizeClasses[size]} text-blue-500`} />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
