import { Shield, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

interface VerificationBadgesProps {
  phoneVerified?: boolean;
  idVerified?: boolean;
  className?: string;
}

export const VerificationBadges = ({ 
  phoneVerified, 
  idVerified, 
  className = '' 
}: VerificationBadgesProps) => {
  const { t } = useTranslation();

  if (!phoneVerified && !idVerified) return null;

  return (
    <div className={`flex gap-2 flex-wrap ${className}`}>
      {phoneVerified && (
        <Badge variant="secondary" className="text-xs gap-1">
          <Phone className="h-3 w-3" />
          {t('verification.phoneVerified')}
        </Badge>
      )}
      {idVerified && (
        <Badge variant="secondary" className="text-xs gap-1">
          <Shield className="h-3 w-3" />
          {t('verification.idVerified')}
        </Badge>
      )}
    </div>
  );
};
