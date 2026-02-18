import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

interface FeedbackDialogProps {
  userId: string;
}

export const FeedbackDialog = ({ userId }: FeedbackDialogProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
  });

  const submitFeedback = useMutation({
    mutationFn: async () => {
      if (!formData.subject.trim() || !formData.message.trim()) {
        throw new Error(t('validation.all_fields_required'));
      }

      const { error } = await supabase.from('app_feedback').insert({
        user_id: userId,
        subject: formData.subject,
        message: formData.message,
        status: 'pending',
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t('toast.feedback_submitted'));
      setFormData({ subject: '', message: '' });
      setOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || t('toast.feedback_failed'));
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <MessageSquare className="w-4 h-4 mr-2" />
          App Feedback / Bug Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            Help us improve Neighbors Kitchen! Report bugs or suggest new features.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="e.g., Bug: Map not loading"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Describe the issue or suggestion in detail..."
              rows={6}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={() => submitFeedback.mutate()}
            disabled={submitFeedback.isPending}
            className="flex-1"
          >
            Submit Feedback
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
