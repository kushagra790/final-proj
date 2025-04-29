'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EnvelopeIcon } from "@heroicons/react/24/outline";
import { useToast } from "@/components/ui/use-toast";

interface ShareReportDialogProps {
  open: boolean;
  onClose: () => void;
  reportId: string;
  reportTitle: string;
}

export function ShareReportDialog({
  open,
  onClose,
  reportId,
  reportTitle,
}: ShareReportDialogProps) {
  const [email, setEmail] = useState('');
  const [isEmailMode, setIsEmailMode] = useState(false);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleSendEmail = async () => {
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

      toast({
        title: "Email sent!",
        description: `The report was successfully emailed to ${email}.`,
      });

      handleClose();
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

  const handleShareWhatsApp = async () => {
    setSending(true);

    try {
      // Get the PDF url from our API
      const pdfUrl = `${window.location.origin}/api/reports/${reportId}/pdf`;
      
      // Generate a shareable message
      const shareText = `Check out this health report from WellTrack: ${reportTitle}`;
      
      // Create WhatsApp share URL (WhatsApp doesn't directly support file sharing via URL)
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + pdfUrl)}`;
      
      // Open WhatsApp in a new tab
      window.open(whatsappUrl, '_blank');
      
      toast({
        title: "WhatsApp opened",
        description: "Share the link to the PDF report with your contacts.",
      });
      
      handleClose();
    } catch (err) {
      console.error('Error sharing to WhatsApp:', err);
      toast({
        title: "Sharing failed",
        description: "Could not open WhatsApp share. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setIsEmailMode(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Report</DialogTitle>
          <DialogDescription>
            Share "{reportTitle || 'Health Report'}" with others
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {!isEmailMode ? (
            <div className="flex flex-col space-y-4">
              <Button 
                className="flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600" 
                onClick={handleShareWhatsApp}
                disabled={sending}
              >
                <svg viewBox="0 0 32 32" className="h-5 w-5" fill="white">
                  <path d="M16 2C8.28 2 2 8.28 2 16c0 2.24.53 4.35 1.44 6.23L2 26l4.04-1.3C7.8 26.15 9.82 27 12 27c7.72 0 14-6.28 14-14S23.72 2 16 2zm0 25.45c-2.14 0-4.12-.6-5.8-1.65l-.4-.26-4.2 1.1 1.12-4.09-.27-.44A11.47 11.47 0 0 1 4.56 16C4.56 9.66 9.66 4.56 16 4.56S27.44 9.66 27.44 16 22.34 27.44 16 27.44z"></path>
                  <path d="M22.18 18.22c-.33-.17-1.94-.96-2.24-1.06-.3-.11-.52-.17-.74.16-.22.33-.84 1.06-1.04 1.28-.19.22-.38.25-.71.08-.33-.17-1.4-.51-2.65-1.64-.98-.88-1.64-1.96-1.83-2.29-.19-.33-.02-.5.14-.67.15-.15.33-.38.49-.57.17-.19.22-.33.33-.55.11-.22.06-.41-.03-.57-.08-.17-.73-1.76-1-2.4-.26-.63-.53-.55-.73-.56h-.62c-.22 0-.59.08-.9.43-.3.35-1.15 1.15-1.15 2.8s1.18 3.25 1.34 3.47c.17.22 2.36 3.6 5.73 5.05.8.35 1.42.56 1.91.71.8.25 1.53.22 2.1.13.64-.1 1.98-.81 2.25-1.6.28-.78.28-1.45.2-1.6-.08-.14-.3-.23-.64-.4z"></path>
                </svg>
                Share via WhatsApp
              </Button>

              <Button 
                className="flex items-center justify-center gap-3"
                onClick={() => setIsEmailMode(true)}
                disabled={sending}
              >
                <EnvelopeIcon className="h-5 w-5" />
                Share via Email
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  placeholder="recipient@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={sending}
                  autoComplete="email"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEmailMode(false)}
                  disabled={sending}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleSendEmail}
                  disabled={sending}
                >
                  {sending ? "Sending..." : "Send Email"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
