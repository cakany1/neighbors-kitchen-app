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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, CheckCircle2, Loader2, Lock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface VerificationDialogProps {
  userId: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string | null;
  rejectionDetails?: string | null;
  onSuccess: () => void;
}

const REASON_LABELS: Record<string, string> = {
  blurred_photo: 'Unscharfes oder unlesbares Foto',
  missing_document: 'Fehlendes Ausweisdokument',
  incomplete_profile: 'Unvollständiges Profil',
  duplicate_account: 'Duplikat-Konto erkannt',
  document_mismatch: 'Daten stimmen nicht mit Dokument überein',
  other: 'Anderer Grund',
};

export const VerificationDialog = ({ userId, verificationStatus, rejectionReason, rejectionDetails, onSuccess }: VerificationDialogProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [filePath, setFilePath] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Datei zu gross (max 5MB)');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Nur Bilder sind erlaubt');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/id-${Date.now()}.${fileExt}`;

      // Upload to PRIVATE id-documents bucket
      const { error: uploadError } = await supabase.storage
        .from('id-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Store the file path (NOT public URL since bucket is private)
      setFilePath(fileName);
      toast.success(t('toast.verification_doc_uploaded'));
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(t('toast.verification_upload_failed'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    // ID document is optional - only require confirmation if a document was uploaded
    if (filePath && !confirmed) {
      toast.error(t('toast.verification_confirm_id'));
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          verification_status: 'pending',
          id_document_url: filePath, // Store file path, not public URL
        })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Verifizierungsanfrage gesendet! ✓');
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Verification request error:', error);
      toast.error('Anfrage fehlgeschlagen. Bitte erneut versuchen.');
    } finally {
      setSubmitting(false);
    }
  };

  // Don't show if already approved
  if (verificationStatus === 'approved') {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full gap-2" variant={verificationStatus === 'pending' ? 'secondary' : 'default'}>
          <Shield className="w-4 h-4" />
          {verificationStatus === 'pending' ? '⏳ Verifizierung ausstehend' : '🪪 Jetzt verifizieren'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            ID-Verifizierung
          </DialogTitle>
          <DialogDescription>
            Beantrage dein ✓ Verifiziert-Badge. Ein Ausweisfoto ist <strong>optional</strong>, beschleunigt aber die Prüfung.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Privacy Notice */}
          <Alert className="bg-primary/5 border-primary/20">
            <Lock className="h-4 w-4 text-primary" />
            <AlertDescription className="text-xs">
              <strong>🔒 Sicher & Privat</strong>
              <ul className="mt-2 ml-4 space-y-1 list-disc">
                <li>Dein Dokument wird verschlüsselt gespeichert</li>
                <li>Nur Admins können es zur Prüfung einsehen</li>
                <li>Nach Genehmigung wird es automatisch gelöscht</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Benefits */}
          <Alert>
            <AlertDescription className="text-xs">
              <strong>Warum verifizieren?</strong>
              <ul className="mt-2 ml-4 space-y-1 list-disc">
                <li>Erhalte das ✓ Verifiziert-Badge</li>
                <li>Erhöhe deine Buchungschancen</li>
                <li>Baue Vertrauen in der Nachbarschaft auf</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Upload Section - Optional */}
          <div className="space-y-2">
            <Label htmlFor="verification-photo" className="font-medium">
              Ausweis-Foto hochladen <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              Pass, ID-Karte oder Führerschein – beschleunigt die Prüfung, ist aber nicht zwingend erforderlich
            </p>
            <Input
              id="verification-photo"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoUpload}
              disabled={uploading || submitting}
            />
            {uploading && (
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Hochladen...
              </p>
            )}
            {filePath && (
              <div className="mt-2 flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                Dokument hochgeladen! Bereit zum Absenden.
              </div>
            )}
          </div>

          {/* Confirmation Checkbox - Only show if document was uploaded */}
          {filePath && (
            <div className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
              <Checkbox
                id="confirm-ownership"
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(checked === true)}
                disabled={submitting}
              />
              <Label htmlFor="confirm-ownership" className="text-xs leading-relaxed cursor-pointer">
                Ich bestätige, dass dies mein eigener Ausweis ist und dass meine Angaben korrekt sind.
              </Label>
            </div>
          )}
          {/* Rejection Notice with Reason */}
          {verificationStatus === 'rejected' && (
            <Alert variant="destructive">
              <AlertDescription className="text-xs space-y-2">
                <p className="font-semibold">Deine vorherige Verifizierung wurde abgelehnt.</p>
                {rejectionReason && (
                  <p>
                    <span className="font-medium">Grund:</span> {REASON_LABELS[rejectionReason] || rejectionReason}
                  </p>
                )}
                {rejectionDetails && (
                  <p className="italic">"{rejectionDetails}"</p>
                )}
                <p className="mt-2">Bitte beachte die Hinweise oben und reiche erneut ein.</p>
              </AlertDescription>
            </Alert>
          )}

          {/* Delete Notice - Only show if document uploaded */}
          {filePath && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Trash2 className="w-3 h-3" />
              Dokument wird nach erfolgreicher Prüfung automatisch gelöscht
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="flex-1" disabled={submitting}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="flex-1" 
            disabled={(filePath && !confirmed) || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Sende...
              </>
            ) : (
              '📤 Verifizierung beantragen'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
