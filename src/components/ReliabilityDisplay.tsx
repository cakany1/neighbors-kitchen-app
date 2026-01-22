import { useTranslation } from 'react-i18next';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ReliabilityDisplayProps {
  successfulPickups: number;
  noShows: number;
}

export const ReliabilityDisplay = ({ successfulPickups, noShows }: ReliabilityDisplayProps) => {
  const { t } = useTranslation();
  
  const totalBookings = successfulPickups + noShows;
  const reliabilityRate = totalBookings > 0 
    ? Math.round((successfulPickups / totalBookings) * 100) 
    : 100;
  
  // Warning thresholds
  const warningsRemaining = Math.max(0, 3 - noShows);
  const showWarning = noShows > 0 && noShows <= 3;
  const showPenalty = noShows > 3;
  
  // Determine status
  const getStatusColor = () => {
    if (noShows === 0) return 'text-green-600';
    if (noShows <= 3) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getStatusIcon = () => {
    if (noShows === 0) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (noShows <= 3) return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  return (
    <div className="space-y-3">
      {/* Main reliability display */}
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <p className="font-medium text-sm">
              {t('profile.reliability_title')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('profile.reliability_stats', { 
                successful: successfulPickups, 
                total: totalBookings 
              })}
            </p>
          </div>
        </div>
        <div className={`text-lg font-bold ${getStatusColor()}`}>
          {reliabilityRate}%
        </div>
      </div>
      
      {/* Warning for 1-3 no-shows */}
      {showWarning && (
        <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-sm text-yellow-800 dark:text-yellow-300">
            <strong>⚠️ {t('profile.reliability_warning_title')}</strong>
            <br />
            {t('profile.reliability_warning_desc', { remaining: warningsRemaining })}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Penalty notice for 4+ no-shows */}
      {showPenalty && (
        <Alert className="border-red-500 bg-red-50 dark:bg-red-950/20">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-sm text-red-800 dark:text-red-300">
            <strong>🚫 {t('profile.reliability_penalty_title')}</strong>
            <br />
            {t('profile.reliability_penalty_desc')}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
