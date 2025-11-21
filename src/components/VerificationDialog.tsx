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
import { Shield, Upload, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface VerificationDialogProps {
  userId: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  onSuccess: () => void;
}

export const VerificationDialog = ({ userId, verificationStatus, onSuccess }: VerificationDialogProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Datei zu groß (max 5MB)');
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
      const fileName = `${userId}-verification-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('gallery')
        .getPublicUrl(filePath);

      setPhotoUrl(data.publicUrl);
      toast.success('Foto hochgeladen!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Fehler beim Hochladen');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!photoUrl) {
      toast.error('Bitte laden Sie ein Foto hoch');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          verification_status: 'pending',
          partner_photo_url: photoUrl, // Reusing this field for verification photo
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
          {verificationStatus === 'pending' ? '⏳ Verifizierung ausstehend' : '✓ Verifizieren lassen'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Nutzer-Verifizierung
          </DialogTitle>
          <DialogDescription>
            Lade ein Selfie mit deinem Ausweis hoch, um dein Profil zu verifizieren. Dies erhöht das Vertrauen
            in der Community.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertDescription className="text-xs">
              <strong>Warum verifizieren?</strong>
              <ul className="mt-2 ml-4 space-y-1 list-disc">
                <li>Erhalte ein ✓ Verifiziert-Badge</li>
                <li>Erhöhe deine Buchungschancen</li>
                <li>Baue Vertrauen in der Nachbarschaft auf</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="verification-photo">Foto hochladen (mit Ausweis)</Label>
            <Input
              id="verification-photo"
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              disabled={uploading || submitting}
            />
            {uploading && (
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Hochladen...
              </p>
            )}
            {photoUrl && (
              <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                Foto hochgeladen! Bereit zum Absenden.
              </div>
            )}
          </div>

          {verificationStatus === 'rejected' && (
            <Alert variant="destructive">
              <AlertDescription className="text-xs">
                Deine vorherige Verifizierung wurde abgelehnt. Bitte versuche es mit einem klareren Foto erneut.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="flex-1" disabled={submitting}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} className="flex-1" disabled={!photoUrl || submitting}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Sende...
              </>
            ) : (
              'Anfrage senden'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
