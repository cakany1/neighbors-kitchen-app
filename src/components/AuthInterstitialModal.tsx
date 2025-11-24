import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

interface AuthInterstitialModalProps {
  open: boolean;
  onClose: () => void;
  onSignup: () => void;
}

export const AuthInterstitialModal = ({ open, onClose, onSignup }: AuthInterstitialModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-16 h-16 text-primary" />
          </div>
          <DialogTitle className="text-2xl text-center">Fast geschafft!</DialogTitle>
          <DialogDescription className="text-center pt-4">
            Für die Sicherheit der Nachbarschaft benötigen wir eine kurze Registrierung.
            Nur verifizierte Nachbarn können Essen abholen.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-col gap-2">
          <Button onClick={onSignup} className="w-full" size="lg">
            Jetzt registrieren
          </Button>
          <Button onClick={onClose} variant="ghost" className="w-full">
            Abbrechen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
