import { Card, CardContent } from "@/components/ui/card";
import { CalendarDaysIcon, LightBulbIcon, ArrowTrendingUpIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

interface PredictionCardProps {
  title: string;
  prediction: string;
  recommendation: string;
  timeframe: string;
  className?: string;
}

export function PredictionCard({
  title,
  prediction,
  recommendation,
  timeframe,
  className,
}: PredictionCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">{title}</h3>
          <LightBulbIcon className="h-5 w-5 text-white/80" />
        </div>
      </div>
      
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div className="flex gap-3">
            <ArrowTrendingUpIcon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Prediction</p>
              <p className="text-sm text-muted-foreground">{prediction}</p>
            </div>
          </div>
          
          <div className="border-t pt-3">
            <p className="text-sm font-medium mb-1">Recommendation</p>
            <p className="text-sm text-muted-foreground">{recommendation}</p>
          </div>
          
          <div className="flex items-center text-xs text-muted-foreground">
            <CalendarDaysIcon className="h-4 w-4 mr-1" /> 
            <span>Timeframe: {timeframe}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
