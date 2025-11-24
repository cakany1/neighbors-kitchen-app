import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportedUserId?: string;
  reportedMealId?: string;
}

export const ReportDialog = ({
  open,
  onOpenChange,
  reportedUserId,
  reportedMealId,
}: ReportDialogProps) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState<string>('safety_concern');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('reports').insert({
        reporter_id: user.id,
        reported_user_id: reportedUserId,
        reported_meal_id: reportedMealId,
        reason,
        description: description.trim() || null,
      });

      if (error) throw error;

      toast.success(t('reporting.reportSubmitted'));
      onOpenChange(false);
      setDescription('');
      setReason('safety_concern');
    } catch (error) {
      console.error('Report error:', error);
      toast.error('Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('reporting.title')}</DialogTitle>
          <DialogDescription>
            {t('guestComposition.safetyNote')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>{t('reporting.reasonLabel')}</Label>
            <RadioGroup value={reason} onValueChange={setReason} className="mt-2">
              {reportedMealId && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="wrong_image" id="wrong_image" />
                  <Label htmlFor="wrong_image">{t('reporting.wrongImage')}</Label>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="spam" id="spam" />
                <Label htmlFor="spam">{t('reporting.spam')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="inappropriate_content" id="inappropriate" />
                <Label htmlFor="inappropriate">{t('reporting.inappropriateContent')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="safety_concern" id="safety" />
                <Label htmlFor="safety">{t('reporting.safetyConcern')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="harassment" id="harassment" />
                <Label htmlFor="harassment">{t('reporting.harassment')}</Label>
              </div>
              {reportedUserId && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fake_profile" id="fake" />
                  <Label htmlFor="fake">{t('reporting.fakeProfile')}</Label>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other">{t('reporting.other')}</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="description">{t('reporting.descriptionLabel')}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="..."
              rows={4}
              className="mt-1"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full"
          >
            {t('reporting.submitReport')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
