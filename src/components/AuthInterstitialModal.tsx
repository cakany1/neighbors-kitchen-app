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
import { useTranslation } from 'react-i18next';

interface AuthInterstitialModalProps {
  open: boolean;
  onClose: () => void;
  onSignup: () => void;
}

export const AuthInterstitialModal = ({ open, onClose, onSignup }: AuthInterstitialModalProps) => {
  const { t } = useTranslation();
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-16 h-16 text-primary" />
          </div>
          <DialogTitle className="text-2xl text-center">{t('modal.almost_done')}</DialogTitle>
          <DialogDescription className="text-center pt-4">
            {t('modal.registration_required')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-col gap-2">
          <Button onClick={onSignup} className="w-full" size="lg">
            {t('modal.register_now')}
          </Button>
          <Button onClick={onClose} variant="ghost" className="w-full">
            {t('modal.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
