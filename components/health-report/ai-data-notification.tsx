import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AiDataNotificationProps {
  missingDataTypes: string[];
}

export function AiDataNotification({ missingDataTypes }: AiDataNotificationProps) {
  const [dismissed, setDismissed] = useState(false);
  
  if (dismissed || missingDataTypes.length === 0) {
    return null;
  }
  
  return (
    <Alert className="mb-4 pr-12 relative">
      <InfoIcon className="h-4 w-4" />
      <AlertTitle>AI-Generated Data Notice</AlertTitle>
      <AlertDescription>
        Some data was not available in your records, so we've used AI to generate estimates for: {missingDataTypes.join(", ")}.
        Add more health records to improve the accuracy of your reports.
      </AlertDescription>
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-2 right-2 h-6 w-6" 
        onClick={() => setDismissed(true)}
      >
        <XIcon className="h-4 w-4" />
        <span className="sr-only">Dismiss</span>
      </Button>
    </Alert>
  );
}
