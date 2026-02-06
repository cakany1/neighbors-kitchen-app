import { useState } from 'react';
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

const REJECTION_REASONS = [
  { value: 'blurred_photo', label: '📷 Unscharfes / unlesbares Foto', description: 'Das hochgeladene Dokument ist nicht lesbar' },
  { value: 'missing_document', label: '📄 Dokument fehlt', description: 'Kein gültiges Ausweisdokument hochgeladen' },
  { value: 'incomplete_profile', label: '👤 Unvollständiges Profil', description: 'Wichtige Profilangaben fehlen' },
  { value: 'duplicate_account', label: '👥 Duplikat-Konto', description: 'Ein anderes Konto mit gleichen Daten existiert bereits' },
  { value: 'document_mismatch', label: '❌ Daten stimmen nicht überein', description: 'Name/Foto auf Dokument passt nicht zum Profil' },
  { value: 'other', label: '📝 Anderer Grund', description: 'Bitte im Freitext erläutern' },
] as const;

export const VerificationRejectDialog = ({
  open,
  onOpenChange,
  userName,
  userEmail,
  onConfirm,
  isPending,
}: VerificationRejectDialogProps) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [details, setDetails] = useState('');

  const handleConfirm = async () => {
    if (!selectedReason) return;
    await onConfirm({ reason: selectedReason, details: details.trim() });
    // Reset state after successful submission
    setSelectedReason('');
    setDetails('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset state when closing
      setSelectedReason('');
      setDetails('');
    }
    onOpenChange(newOpen);
  };

  const isValid = selectedReason && (selectedReason !== 'other' || details.trim().length > 0);
  const selectedReasonData = REJECTION_REASONS.find(r => r.value === selectedReason);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="w-5 h-5" />
            Verifizierung ablehnen
          </DialogTitle>
          <DialogDescription>
            Ablehnung für <strong>{userName}</strong>
            {userEmail && <span className="block text-xs mt-1">📧 {userEmail}</span>}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning */}
          <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Der Nutzer erhält eine <strong>E-Mail</strong> mit dem Ablehnungsgrund und kann danach erneut verifizieren.
            </AlertDescription>
          </Alert>

          {/* Reason Selection - MANDATORY */}
          <div className="space-y-3">
            <Label className="font-medium">
              Ablehnungsgrund <span className="text-destructive">*</span>
            </Label>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
              {REJECTION_REASONS.map((reason) => (
                <div
                  key={reason.value}
                  className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedReason === reason.value
                      ? 'border-destructive bg-destructive/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedReason(reason.value)}
                >
                  <RadioGroupItem value={reason.value} id={reason.value} className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor={reason.value} className="font-medium cursor-pointer">
                      {reason.label}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {reason.description}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Optional Details */}
          <div className="space-y-2">
            <Label htmlFor="rejection-details" className="font-medium">
              Zusätzliche Details{' '}
              <span className="text-muted-foreground font-normal">
                {selectedReason === 'other' ? '(erforderlich)' : '(optional)'}
              </span>
            </Label>
            <Textarea
              id="rejection-details"
              placeholder="Z.B. 'Bitte lade ein klareres Foto hoch' oder 'Der Name auf dem Ausweis stimmt nicht mit dem Profil überein'"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Dieser Text wird dem Nutzer in der E-Mail angezeigt.
            </p>
          </div>

          {/* Preview */}
          {selectedReason && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs font-medium mb-1">Vorschau der Nutzer-Nachricht:</p>
              <p className="text-sm italic text-muted-foreground">
                "Deine Verifizierung wurde abgelehnt: {selectedReasonData?.label.replace(/^[^\s]+\s/, '')}.
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
            Abbrechen
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isValid || isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Ablehnen...
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 mr-2" />
                Ablehnung bestätigen
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
