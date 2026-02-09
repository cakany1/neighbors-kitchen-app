import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Play, 
  RefreshCw, 
  Shield,
  Clock,
  Database,
  Users,
  MessageSquare,
  CreditCard,
  Lock,
  Zap,
  Globe,
  ClipboardCheck,
  ExternalLink,
  Bell
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Total number of checklist items - keep in sync with AdminReleaseChecklist
const TOTAL_CHECKLIST_ITEMS = 14;

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  details: string;
  duration_ms: number;
}

interface SelfTestResponse {
  run_id: string;
  status: 'passed' | 'failed' | 'partial';
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration_ms: number;
  };
  results: TestResult[];
  timestamp: string;
}

// Release Checklist Summary Component
const ReleaseChecklistSummary = ({ navigate }: { navigate: (path: string) => void }) => {
  const today = new Date();
  const releaseVersion = `v${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;

  const { data: checklistData, isLoading } = useQuery({
    queryKey: ['releaseChecklistSummary', releaseVersion],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('release_checks')
        .select('is_checked')
        .eq('release_version', releaseVersion);

      if (error) throw error;
      
      const checkedCount = data?.filter(c => c.is_checked).length || 0;
      return { checkedCount, total: TOTAL_CHECKLIST_ITEMS };
    },
  });

  const checkedCount = checklistData?.checkedCount || 0;
  const total = checklistData?.total || TOTAL_CHECKLIST_ITEMS;
  const progress = Math.round((checkedCount / total) * 100);

  const statusEmoji = progress === 100 ? "🟢" : progress > 0 ? "🟡" : "🔴";
  const statusText = progress === 100 ? "Ready" : progress > 0 ? "In Progress" : "Not Started";

  return (
    <Card className="border-2 border-primary/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-primary" />
            Release Checklist
          </CardTitle>
          <Badge variant="outline" className="text-lg px-3 py-1">
            {statusEmoji} {checkedCount} / {total}
          </Badge>
        </div>
        <CardDescription>
          Manuelle QA-Prüfpunkte vor Go-Live
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Lädt...
          </div>
        ) : (
          <>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  progress === 100 
                    ? "bg-green-500" 
                    : progress > 0 
                      ? "bg-yellow-500" 
                      : "bg-red-500"
                }`}
                style={{ width: `${Math.max(progress, 5)}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {statusText} • Version {releaseVersion}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/admin/release-checklist')}
                className="gap-1"
              >
                <ExternalLink className="w-4 h-4" />
                Zur Checklist
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

const AdminHealth = () => {
  const navigate = useNavigate();
  const [lastTestResult, setLastTestResult] = useState<SelfTestResponse | null>(null);

  // Check if current user is admin
  const { data: isAdmin, isLoading: adminCheckLoading, error: adminError } = useQuery({
    queryKey: ['isAdminHealth'],
    queryFn: async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('[AdminHealth] Auth user:', user?.id, userError);
      
      if (!user) {
        console.log('[AdminHealth] No user logged in');
        return false;
      }

      // Check user_roles table for admin role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      console.log('[AdminHealth] Role query result:', roleData, roleError);

      // Check if any of the roles is 'admin'
      const hasAdminRole = roleData?.some(r => r.role === 'admin') || false;
      console.log('[AdminHealth] Has admin role:', hasAdminRole);
      
      return hasAdminRole;
    },
  });

  // Fetch previous QA runs
  const { data: previousRuns, isLoading: runsLoading, refetch: refetchRuns } = useQuery({
    queryKey: ['qaRuns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qa_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: isAdmin === true,
  });

  // Fetch Stripe status
  const { data: stripeStatus } = useQuery({
    queryKey: ['stripeStatus'],
    queryFn: async () => {
      // Get current Stripe mode from admin_settings
      const { data: modeData } = await supabase
        .from('admin_settings')
        .select('setting_value, updated_at')
        .eq('setting_key', 'stripe_mode')
        .single();

      // Get last webhook event
      const { data: webhookData } = await supabase
        .from('stripe_webhook_events')
        .select('*')
        .order('processed_at', { ascending: false })
        .limit(1)
        .single();

      // Get webhook stats
      const { data: statsData } = await supabase
        .from('stripe_webhook_events')
        .select('stripe_mode, success')
        .gte('processed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const testCount = statsData?.filter(e => e.stripe_mode === 'test').length || 0;
      const liveCount = statsData?.filter(e => e.stripe_mode === 'live').length || 0;
      const failedCount = statsData?.filter(e => !e.success).length || 0;

      return {
        currentMode: modeData?.setting_value ? JSON.parse(modeData.setting_value as string) : 'test',
        lastWebhook: webhookData,
        stats24h: { test: testCount, live: liveCount, failed: failedCount }
      };
    },
    enabled: isAdmin === true,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch Push Notification status
  const { data: pushStatus } = useQuery({
    queryKey: ['pushStatus'],
    queryFn: async () => {
      // Get total active tokens by platform
      const { data: tokenStats, error: tokenError } = await supabase
        .from('device_push_tokens')
        .select('platform, environment, is_active')
        .eq('is_active', true);

      if (tokenError) throw tokenError;

      const stats = {
        ios: tokenStats?.filter(t => t.platform === 'ios').length || 0,
        android: tokenStats?.filter(t => t.platform === 'android').length || 0,
        web: tokenStats?.filter(t => t.platform === 'web').length || 0,
        production: tokenStats?.filter(t => t.environment === 'production').length || 0,
        development: tokenStats?.filter(t => t.environment === 'development').length || 0,
        total: tokenStats?.length || 0,
      };

      // Get last registered token
      const { data: lastToken } = await supabase
        .from('device_push_tokens')
        .select('platform, environment, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      // Get recent push notifications (last 24h)
      const { data: recentPushes } = await supabase
        .from('push_notification_logs')
        .select('status, notification_type')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const pushStats = {
        sent: recentPushes?.filter(p => p.status === 'sent').length || 0,
        failed: recentPushes?.filter(p => p.status === 'failed').length || 0,
        total: recentPushes?.length || 0,
      };

      return {
        tokens: stats,
        lastToken,
        pushStats,
      };
    },
    enabled: isAdmin === true,
    refetchInterval: 30000,
  });

  // Run self-test mutation
  const runTestMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('run-self-test');
      
      if (error) throw error;
      return data as SelfTestResponse;
    },
    onSuccess: (data) => {
      setLastTestResult(data);
      refetchRuns();
      
      if (data.status === 'passed') {
        toast.success(`✅ Self-Test bestanden! ${data.summary.passed}/${data.summary.total} Tests erfolgreich.`);
      } else {
        toast.error(`❌ Self-Test fehlgeschlagen! ${data.summary.failed} Tests nicht bestanden.`);
      }
    },
    onError: (error: Error) => {
      toast.error(`Test-Fehler: ${error.message}`);
    },
  });

  if (adminCheckLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <Alert variant="destructive">
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Zugang verweigert. Admin-Berechtigung erforderlich.
              {adminError && <span className="block mt-2 text-xs">Fehler: {adminError.message}</span>}
            </AlertDescription>
          </Alert>
          <div className="mt-4 space-y-2">
            <Button onClick={() => navigate('/admin')}>
              Zurück zum Admin Dashboard
            </Button>
            <Button variant="outline" onClick={() => navigate('/login')}>
              Zur Anmeldung
            </Button>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
      case 'passed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'FAIL':
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'SKIP':
      case 'partial':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PASS':
      case 'passed':
        return <Badge className="bg-green-100 text-green-800">PASS</Badge>;
      case 'FAIL':
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">FAIL</Badge>;
      case 'SKIP':
        return <Badge className="bg-yellow-100 text-yellow-800">SKIP</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              System Healthcheck
            </h1>
            <p className="text-muted-foreground">Go-Live Bereitschaftstest & QA Dashboard</p>
          </div>
          <Button 
            onClick={() => navigate('/admin')}
            variant="outline"
          >
            Zurück zum Admin
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Database className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{previousRuns?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">QA Runs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {previousRuns?.filter(r => r.status === 'passed').length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Bestanden</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <XCircle className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {previousRuns?.filter(r => r.status === 'failed').length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Fehlgeschlagen</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">
                    {lastTestResult?.summary?.duration_ms 
                      ? `${(lastTestResult.summary.duration_ms / 1000).toFixed(1)}s`
                      : '-'}
                  </p>
                  <p className="text-sm text-muted-foreground">Letzte Laufzeit</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Globe className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-xs font-bold">🇨🇭 Schweiz</p>
                  <p className="text-xs text-muted-foreground">Zürich (eu-central-2)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stripe Status Card */}
        <Card className="border-2 border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Stripe Zahlungssystem
            </CardTitle>
            <CardDescription>
              Webhook-Status und Transaktionsübersicht
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Current Mode */}
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Aktueller Modus</span>
                  <Badge 
                    variant={stripeStatus?.currentMode === 'live' ? 'default' : 'secondary'}
                    className={stripeStatus?.currentMode === 'live' ? 'bg-green-600' : 'bg-yellow-600'}
                  >
                    {stripeStatus?.currentMode === 'live' ? '🔴 LIVE' : '🟡 TEST'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stripeStatus?.currentMode === 'live' 
                    ? 'Echte Transaktionen aktiv' 
                    : 'Sandbox-Modus für Tests'}
                </p>
              </div>

              {/* Last Webhook */}
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Letzter Webhook</span>
                  {stripeStatus?.lastWebhook?.success ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : stripeStatus?.lastWebhook ? (
                    <XCircle className="w-4 h-4 text-red-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                {stripeStatus?.lastWebhook ? (
                  <>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stripeStatus.lastWebhook.event_type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(stripeStatus.lastWebhook.processed_at).toLocaleString('de-DE')}
                    </p>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {stripeStatus.lastWebhook.stripe_mode}
                    </Badge>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    Noch keine Webhooks empfangen
                  </p>
                )}
              </div>

              {/* 24h Stats */}
              <div className="p-4 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">Letzte 24h</span>
                <div className="flex gap-4 mt-2">
                  <div className="text-center">
                    <p className="text-lg font-bold">{stripeStatus?.stats24h?.test || 0}</p>
                    <p className="text-xs text-muted-foreground">Test</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">{stripeStatus?.stats24h?.live || 0}</p>
                    <p className="text-xs text-muted-foreground">Live</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-destructive">{stripeStatus?.stats24h?.failed || 0}</p>
                    <p className="text-xs text-muted-foreground">Fehler</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Warning if no webhooks configured */}
            {!stripeStatus?.lastWebhook && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Noch keine Stripe-Webhooks empfangen. Stellen Sie sicher, dass der Webhook in Stripe Dashboard konfiguriert ist.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Push Notification Status Card */}
        <Card className="border-2 border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Push Notifications
            </CardTitle>
            <CardDescription>
              Registrierte Geräte und Benachrichtigungsstatus
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Token Stats by Platform */}
              <div className="p-4 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">Aktive Geräte</span>
                <div className="flex gap-4 mt-2">
                  <div className="text-center">
                    <p className="text-lg font-bold">{pushStatus?.tokens?.ios || 0}</p>
                    <p className="text-xs text-muted-foreground">iOS</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">{pushStatus?.tokens?.android || 0}</p>
                    <p className="text-xs text-muted-foreground">Android</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">{pushStatus?.tokens?.web || 0}</p>
                    <p className="text-xs text-muted-foreground">Web</p>
                  </div>
                </div>
              </div>

              {/* Environment Stats */}
              <div className="p-4 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">Nach Umgebung</span>
                <div className="flex gap-4 mt-2">
                  <div className="text-center">
                    <p className="text-lg font-bold">{pushStatus?.tokens?.production || 0}</p>
                    <p className="text-xs text-muted-foreground">Prod</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">{pushStatus?.tokens?.development || 0}</p>
                    <p className="text-xs text-muted-foreground">Dev</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">{pushStatus?.tokens?.total || 0}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>
              </div>

              {/* Last Token Registered */}
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Letztes Token</span>
                  {pushStatus?.lastToken ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                {pushStatus?.lastToken ? (
                  <>
                    <Badge variant="outline" className="mt-2">
                      {pushStatus.lastToken.platform} • {pushStatus.lastToken.environment}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(pushStatus.lastToken.updated_at).toLocaleString('de-DE')}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    Noch keine Tokens registriert
                  </p>
                )}
              </div>
            </div>

            {/* Push Stats (last 24h) */}
            <div className="p-4 rounded-lg bg-muted/50">
              <span className="text-sm font-medium">Letzte 24h Benachrichtigungen</span>
              <div className="flex gap-6 mt-2">
                <div className="text-center">
                  <p className="text-lg font-bold">{pushStatus?.pushStats?.sent || 0}</p>
                  <p className="text-xs text-muted-foreground">Gesendet</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-destructive">{pushStatus?.pushStats?.failed || 0}</p>
                  <p className="text-xs text-muted-foreground">Fehlgeschlagen</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{pushStatus?.pushStats?.total || 0}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </div>

            {/* Warning if no tokens */}
            {pushStatus?.tokens?.total === 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Noch keine Push-Tokens registriert. Stellen Sie sicher, dass die App auf einem Gerät installiert ist und Push-Berechtigungen erteilt wurden.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Run Self-Test Button */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              End-to-End Self-Test
            </CardTitle>
            <CardDescription>
              22 automatisierte Tests: Profile, Meals, Pricing, Content Filter, Privacy, Stripe, Admin, Map, Partner Verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => runTestMutation.mutate()}
              disabled={runTestMutation.isPending}
              size="lg"
              className="w-full md:w-auto"
            >
              {runTestMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Tests laufen...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Self-Test starten
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Current Test Results */}
        {lastTestResult && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(lastTestResult.status)}
                  Aktuelles Testergebnis
                </CardTitle>
                <div className="flex items-center gap-2">
                  {getStatusBadge(lastTestResult.status)}
                  <span className="text-sm text-muted-foreground">
                    {new Date(lastTestResult.timestamp).toLocaleString('de-DE')}
                  </span>
                </div>
              </div>
              <CardDescription>
                {lastTestResult.summary.passed}/{lastTestResult.summary.total} Tests bestanden 
                ({lastTestResult.summary.duration_ms}ms)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Details</TableHead>
                    <TableHead className="text-right">Zeit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lastTestResult.results.map((result, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{result.name}</TableCell>
                      <TableCell>{getStatusBadge(result.status)}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-md truncate">
                        {result.details}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {result.duration_ms}ms
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Previous Runs */}
        {previousRuns && previousRuns.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Vorherige QA-Läufe</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tests</TableHead>
                    <TableHead className="text-right">Dauer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previousRuns.map((run: any) => (
                    <TableRow key={run.id}>
                      <TableCell>
                        {new Date(run.created_at).toLocaleString('de-DE')}
                      </TableCell>
                      <TableCell>{getStatusBadge(run.status)}</TableCell>
                      <TableCell>
                        {run.summary?.passed || 0}/{run.summary?.total || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        {run.summary?.duration_ms ? `${run.summary.duration_ms}ms` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Release Checklist Summary */}
        <ReleaseChecklistSummary navigate={navigate} />

        {/* GO/NO-GO Decision */}
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="text-xl">🚦 GO/NO-GO Entscheidung</CardTitle>
          </CardHeader>
          <CardContent>
            {lastTestResult?.status === 'passed' ? (
              <Alert className="border-green-500 bg-green-50">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertDescription className="text-green-800 font-medium">
                  ✅ GO - Alle automatisierten Tests bestanden. Manuelle Prüfung empfohlen.
                </AlertDescription>
              </Alert>
            ) : lastTestResult?.status === 'failed' ? (
              <Alert variant="destructive">
                <XCircle className="h-5 w-5" />
                <AlertDescription className="font-medium">
                  ❌ NO-GO - {lastTestResult.summary.failed} Tests fehlgeschlagen. Bitte Fehler beheben.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertTriangle className="h-5 w-5" />
                <AlertDescription>
                  ⏳ Self-Test noch nicht ausgeführt. Bitte Tests starten.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
};

export default AdminHealth;
