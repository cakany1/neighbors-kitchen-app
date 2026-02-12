import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { XCircle, Loader2, AlertTriangle } from 'lucide-react';

export interface RejectionData {
  reason: string;
  details: string;
}

interface VerificationRejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  userEmail?: string;
  onConfirm: (data: RejectionData) => Promise<void>;
  isPending: boolean;
}

const REJECTION_REASON_KEYS = [
  'blurred_photo',
  'missing_document',
  'incomplete_profile',
  'duplicate_account',
  'document_mismatch',
  'other',
] as const;

const REASON_KEY_MAP: Record<string, string> = {
  blurred_photo: 'reject_reason_blurred',
  missing_document: 'reject_reason_missing',
  incomplete_profile: 'reject_reason_incomplete',
  duplicate_account: 'reject_reason_duplicate',
  document_mismatch: 'reject_reason_mismatch',
  other: 'reject_reason_other',
};

export const VerificationRejectDialog = ({
  open,
  onOpenChange,
  userName,
  userEmail,
  onConfirm,
  isPending,
}: VerificationRejectDialogProps) => {
  const { t } = useTranslation();
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [details, setDetails] = useState('');

  const handleConfirm = async () => {
    if (!selectedReason) return;
    await onConfirm({ reason: selectedReason, details: details.trim() });
    setSelectedReason('');
    setDetails('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedReason('');
      setDetails('');
    }
    onOpenChange(newOpen);
  };

  const isValid = selectedReason && (selectedReason !== 'other' || details.trim().length > 0);
  const selectedReasonLabel = selectedReason ? t(`admin.${REASON_KEY_MAP[selectedReason]}`) : '';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="w-5 h-5" />
            {t('admin.reject_title')}
          </DialogTitle>
          <DialogDescription>
            {t('admin.rejecting')} <strong>{userName}</strong>
            {userEmail && <span className="block text-xs mt-1">📧 {userEmail}</span>}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {t('admin.reject_title')}
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Label className="font-medium">
              {t('admin.reject_title')} <span className="text-destructive">*</span>
            </Label>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
              {REJECTION_REASON_KEYS.map((reasonKey) => {
                const i18nKey = REASON_KEY_MAP[reasonKey];
                return (
                  <div
                    key={reasonKey}
                    className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedReason === reasonKey
                        ? 'border-destructive bg-destructive/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedReason(reasonKey)}
                  >
                    <RadioGroupItem value={reasonKey} id={reasonKey} className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor={reasonKey} className="font-medium cursor-pointer">
                        {t(`admin.${i18nKey}`)}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t(`admin.${i18nKey}_desc`)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rejection-details" className="font-medium">
              {selectedReason === 'other' ? `* ` : ''}{t('common.cancel')}
            </Label>
            <Textarea
              id="rejection-details"
              placeholder={t('admin.reject_details_placeholder')}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {selectedReason && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs font-medium mb-1">{t('admin.reject_preview_label')}</p>
              <p className="text-sm italic text-muted-foreground">
                "{selectedReasonLabel.replace(/^[^\s]+\s/, '')}.
                {details && ` ${details}`}"
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isValid || isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('admin.rejecting')}
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 mr-2" />
                {t('admin.reject')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
