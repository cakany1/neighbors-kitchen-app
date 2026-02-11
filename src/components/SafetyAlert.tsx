import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getDisplayLabel } from '@/utils/canonical_map';

interface SafetyAlertProps {
  matchingAllergens: string[];
  className?: string;
}

export const SafetyAlert = ({ matchingAllergens, className = '' }: SafetyAlertProps) => {
  const { t } = useTranslation();

  if (matchingAllergens.length === 0) {
    return (
      <Alert className={`border-alert-safe bg-alert-safe-bg ${className}`}>
        <ShieldCheck className="h-5 w-5 text-alert-safe" />
        <AlertDescription className="text-sm">
          <strong className="text-alert-safe">{t('safety_alert.safe_title')}</strong>{' '}
          {t('safety_alert.safe_description')}
        </AlertDescription>
      </Alert>
    );
  }

  const allergenLabels = matchingAllergens.map(getDisplayLabel).join(', ');

  return (
    <Alert className={`border-alert-danger bg-alert-danger-bg ${className}`}>
      <AlertCircle className="h-5 w-5 text-alert-danger" />
      <AlertDescription>
        <strong className="text-alert-danger text-base">{t('safety_alert.warning_title')}</strong>
        <p
          className="text-sm mt-1"
          dangerouslySetInnerHTML={{
            __html: t('safety_alert.warning_contains', { allergens: allergenLabels }),
          }}
        />
        <p className="text-xs mt-2 text-muted-foreground">
          {t('safety_alert.warning_verify')}
        </p>
      </AlertDescription>
    </Alert>
  );
};
