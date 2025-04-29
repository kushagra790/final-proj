'use client';

import { cn } from "@/lib/utils";

interface HealthScoreMeterProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function HealthScoreMeter({ 
  score, 
  size = 'md', 
  showLabel = true,
  className 
}: HealthScoreMeterProps) {
  // Normalize score to be between 0 and 100
  const normalizedScore = Math.min(100, Math.max(0, score));
  
  // Determine color based on score
  const getColor = () => {
    if (normalizedScore >= 80) return "text-green-500";
    if (normalizedScore >= 60) return "text-amber-500";
    return "text-red-500";
  };
  
  // Calculate circle properties
  const radius = size === 'sm' ? 30 : size === 'md' ? 40 : 50;
  const strokeWidth = size === 'sm' ? 4 : size === 'md' ? 5 : 6;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (normalizedScore / 100) * circumference;
  
  // Size-dependent classes
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32"
  };
  
  // Text size classes
  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl"
  };
  
  // Label size classes
  const labelSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  return (
    <div className={cn("relative flex items-center justify-center", sizeClasses[size], className)}>
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${radius * 2 + strokeWidth} ${radius * 2 + strokeWidth}`}>
        {/* Background circle */}
        <circle
          cx={radius + strokeWidth/2}
          cy={radius + strokeWidth/2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted stroke-opacity-20"
        />
        
        {/* Progress circle */}
        <circle
          cx={radius + strokeWidth/2}
          cy={radius + strokeWidth/2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          className={getColor()}
          strokeLinecap="round"
        />
      </svg>
      
      <div className="absolute flex flex-col items-center justify-center">
        <span className={cn("font-bold", textSizeClasses[size], getColor())}>
          {normalizedScore}
        </span>
        {showLabel && (
          <span className={cn("text-muted-foreground", labelSizeClasses[size])}>
            {normalizedScore >= 80 ? "Excellent" : 
             normalizedScore >= 60 ? "Good" : "Needs Work"}
          </span>
        )}
      </div>
    </div>
  );
}
