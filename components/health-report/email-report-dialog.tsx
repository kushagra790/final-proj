'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckIcon, EnvelopeIcon } from "@heroicons/react/24/outline";
import { useToast } from "@/components/ui/use-toast";

interface EmailReportDialogProps {
  open: boolean;
  onClose: () => void;
  reportId: string;
  reportTitle: string;
}

export function EmailReportDialog({
  open,
  onClose,
  reportId,
  reportTitle,
}: EmailReportDialogProps) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter an email address.",
        variant: "destructive",
      });
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    setSuccess(false);

    try {
      const response = await fetch('/api/reports/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId,
          recipientEmail: email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }

      setSuccess(true);
      toast({
        title: "Email sent!",
        description: `The report was successfully emailed to ${email}.`,
      });

      // Close dialog after success
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      console.error('Error sending email:', err);
      toast({
        title: "Sending failed",
        description: "Could not send the email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Email Report</DialogTitle>
          <DialogDescription>
            Send a copy of "{reportTitle || 'Health Report'}" to the recipient's email address.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="flex items-center gap-2">
                <EnvelopeIcon className="h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  placeholder="recipient@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={sending || success}
                  autoComplete="email"
                />
              </div>
            </div>

            {success && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500">
                <CheckIcon className="h-5 w-5" />
                <span>Report successfully emailed!</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex space-x-2 sm:space-x-0">
          <Button variant="outline" onClick={handleClose} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending || success}>
            {sending ? "Sending..." : "Send Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
