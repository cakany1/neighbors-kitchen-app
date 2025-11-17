import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ShieldCheck } from 'lucide-react';

interface SafetyAlertProps {
  matchingAllergens: string[];
  className?: string;
}

export const SafetyAlert = ({ matchingAllergens, className = '' }: SafetyAlertProps) => {
  if (matchingAllergens.length === 0) {
    return (
      <Alert className={`border-alert-safe bg-alert-safe-bg ${className}`}>
        <ShieldCheck className="h-5 w-5 text-alert-safe" />
        <AlertDescription className="text-sm">
          <strong className="text-alert-safe">✓ Safe for you!</strong> No allergens match your profile.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className={`border-alert-danger bg-alert-danger-bg ${className}`}>
      <AlertCircle className="h-5 w-5 text-alert-danger" />
      <AlertDescription>
        <strong className="text-alert-danger text-base">⚠️ ALLERGEN WARNING</strong>
        <p className="text-sm mt-1">
          This dish contains <strong>{matchingAllergens.join(', ')}</strong>, which matches your allergen profile!
        </p>
        <p className="text-xs mt-2 text-muted-foreground">
          Please verify ingredients with the chef before booking.
        </p>
      </AlertDescription>
    </Alert>
  );
};
