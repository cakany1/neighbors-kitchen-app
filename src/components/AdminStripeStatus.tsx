import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface WebhookEvent {
  id: string;
  event_id: string;
  event_type: string;
  stripe_mode: string;
  success: boolean;
  processed_at: string;
  error_message: string | null;
}

export const AdminStripeStatus = () => {
  // Fetch last webhook events for both TEST and LIVE modes
  const { data: webhookEvents, isLoading } = useQuery({
    queryKey: ['stripeWebhookStatus'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stripe_webhook_events')
        .select('*')
        .order('processed_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as WebhookEvent[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Get last event per mode
  const lastTestEvent = webhookEvents?.find(e => e.stripe_mode === 'test');
  const lastLiveEvent = webhookEvents?.find(e => e.stripe_mode === 'live');

  // Count events by mode
  const testEventCount = webhookEvents?.filter(e => e.stripe_mode === 'test').length || 0;
  const liveEventCount = webhookEvents?.filter(e => e.stripe_mode === 'live').length || 0;

  // Check for recent errors
  const recentErrors = webhookEvents?.filter(e => !e.success).slice(0, 3) || [];

  const formatEventTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: de });
  };

  const formatEventType = (type: string) => {
    // Make event types more readable
    return type
      .replace('checkout.session.', 'Checkout: ')
      .replace('payment_intent.', 'Payment: ')
      .replace('_', ' ')
      .replace(/^\w/, c => c.toUpperCase());
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Stripe Status</CardTitle>
          </div>
          <div className="flex gap-2">
            <Badge variant={liveEventCount > 0 ? "default" : "secondary"} className="gap-1">
              {liveEventCount > 0 ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <AlertTriangle className="h-3 w-3" />
              )}
              LIVE
            </Badge>
            <Badge variant="outline" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              TEST
            </Badge>
          </div>
        </div>
        <CardDescription>
          Webhook-Events der letzten Tage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Live Mode Status */}
        <div className="rounded-lg border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Live Mode
            </span>
            <Badge variant={lastLiveEvent ? "default" : "secondary"}>
              {liveEventCount} Events
            </Badge>
          </div>
          {lastLiveEvent ? (
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex items-center justify-between">
                <span>Letztes Event:</span>
                <span className="font-mono text-xs">{formatEventType(lastLiveEvent.event_type)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Zeitpunkt:
                </span>
                <span>{formatEventTime(lastLiveEvent.processed_at)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Status:</span>
                {lastLiveEvent.success ? (
                  <Badge variant="outline" className="text-primary border-primary gap-1">
                    <CheckCircle className="h-3 w-3" /> Erfolgreich
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" /> Fehler
                  </Badge>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Noch keine Live-Webhooks empfangen
            </p>
          )}
        </div>

        {/* Test Mode Status */}
        <div className="rounded-lg border border-dashed p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-muted-foreground" />
              Test Mode
            </span>
            <Badge variant="outline">
              {testEventCount} Events
            </Badge>
          </div>
          {lastTestEvent ? (
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex items-center justify-between">
                <span>Letztes Event:</span>
                <span className="font-mono text-xs">{formatEventType(lastTestEvent.event_type)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Zeitpunkt:
                </span>
                <span>{formatEventTime(lastTestEvent.processed_at)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Status:</span>
                {lastTestEvent.success ? (
                  <Badge variant="outline" className="text-primary border-primary gap-1">
                    <CheckCircle className="h-3 w-3" /> Erfolgreich
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" /> Fehler
                  </Badge>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Noch keine Test-Webhooks empfangen
            </p>
          )}
        </div>

        {/* Recent Errors */}
        {recentErrors.length > 0 && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3">
            <div className="flex items-center gap-2 text-destructive font-medium text-sm mb-2">
              <AlertTriangle className="h-4 w-4" />
              Letzte Fehler
            </div>
            <div className="space-y-1">
              {recentErrors.map((event) => (
                <div key={event.id} className="text-xs text-muted-foreground flex justify-between">
                  <span className="font-mono">{formatEventType(event.event_type)}</span>
                  <span>{formatEventTime(event.processed_at)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
