import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Bell,
  Server
} from 'lucide-react';
import { detectEnvironment, type AppEnvironment } from '@/utils/environment';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
  const statusText = progress === 100 
    ? t('admin_health.ready') 
    : progress > 0 
      ? t('admin_health.in_progress') 
      : t('admin_health.not_started');

  return (
    <Card className="border-2 border-primary/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-primary" />
            {t('admin_health.release_checklist')}
          </CardTitle>
          <Badge variant="outline" className="text-lg px-3 py-1">
            {statusEmoji} {checkedCount} / {total}
          </Badge>
        </div>
        <CardDescription>
          {t('admin_health.manual_qa_title', 'Manuelle QA-Prüfpunkte vor Go-Live')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="w-4 h-4 animate-spin" />
            {t('admin_health.loading')}
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
                {t('admin_health.to_checklist')}
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
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [lastTestResult, setLastTestResult] = useState<SelfTestResponse | null>(null);

  // Live DB connection check
  const { data: dbCheck, isLoading: dbCheckLoading } = useQuery({
    queryKey: ['dbConnectionCheck'],
    queryFn: async () => {
      const start = performance.now();
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      const latency = Math.round(performance.now() - start);
      return { connected: !error, latency, error: error?.message || null };
    },
    refetchInterval: 30000,
  });

  // GitHub Status check
  const { data: githubStatus, isLoading: githubLoading } = useQuery({
    queryKey: ['githubStatus'],
    queryFn: async () => {
      const res = await fetch('https://www.githubstatus.com/api/v2/status.json');
      if (!res.ok) throw new Error('GitHub Status API unreachable');
      const json = await res.json();
      return {
        indicator: json.status?.indicator as string,
        description: json.status?.description as string,
      };
    },
    refetchInterval: 60000,
  });
  const envInfo = detectEnvironment();

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
        toast.success(t('admin_health.self_test_passed', '✅ Self-Test bestanden! {{passed}}/{{total}} Tests erfolgreich.', { passed: data.summary.passed, total: data.summary.total }));
      } else {
        toast.error(t('admin_health.self_test_failed', '❌ Self-Test fehlgeschlagen! {{failed}} Tests nicht bestanden.', { failed: data.summary.failed }));
      }
    },
    onError: (error: Error) => {
      toast.error(t('admin.test_error', { message: error.message }));
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
              {t('admin_health.access_denied_title', 'Zugang verweigert.')} {t('admin_health.access_denied_desc', 'Admin-Berechtigung erforderlich.')}
              {adminError && <span className="block mt-2 text-xs">Fehler: {adminError.message}</span>}
            </AlertDescription>
          </Alert>
          <div className="mt-4 space-y-2">
            <Button onClick={() => navigate('/admin')}>
              {t('admin_health.back_to_admin', 'Zurück zum Admin Dashboard')}
            </Button>
            <Button variant="outline" onClick={() => navigate('/login')}>
              {t('admin_health.back_to_login', 'Zur Anmeldung')}
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
        return <Badge className="bg-green-100 text-green-800">{t('admin_health.pass')}</Badge>;
      case 'FAIL':
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">{t('admin_health.fail')}</Badge>;
      case 'SKIP':
        return <Badge className="bg-yellow-100 text-yellow-800">{t('admin_health.skip')}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Compute Go/No-Go readiness from latest available data (persists across page loads)
  const latestRun = lastTestResult || (previousRuns?.[0] ? {
    status: previousRuns[0].status as 'passed' | 'failed',
    summary: previousRuns[0].summary as SelfTestResponse['summary'],
    timestamp: (previousRuns[0].completed_at || previousRuns[0].created_at) as string,
  } : null);
  const dbOk = dbCheck?.connected === true;
  const testPassed = latestRun?.status === 'passed';
  const testRun = !!latestRun;
  const isGoLiveReady = dbOk && testPassed;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Environment Badge with Status Indicators */}
        <div className={`px-4 py-3 rounded-lg border-l-4 ${envInfo.bgColor}`}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5" />
              <div>
                <p className={`font-bold text-lg ${envInfo.color}`}>{envInfo.label}</p>
                <p className="text-xs text-muted-foreground">
                  Hostname: {envInfo.hostname} • Supabase: {envInfo.supabaseProjectId || 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">
                  {t('admin_health.preview_info')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* DB Status Indicator */}
              <div className="flex items-center gap-1.5 text-xs font-medium">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                  dbCheckLoading ? 'bg-yellow-400 animate-pulse' : dbCheck?.connected ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span>Supabase</span>
                {dbCheck?.connected && <span className="text-muted-foreground">({dbCheck.latency}ms)</span>}
              </div>
              {/* GitHub Status Indicator */}
              <div className="flex items-center gap-1.5 text-xs font-medium">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                  githubLoading ? 'bg-yellow-400 animate-pulse' : githubStatus?.indicator === 'none' ? 'bg-green-500' : githubStatus?.indicator === 'minor' ? 'bg-yellow-400' : 'bg-red-500'
                }`} />
                <span>GitHub</span>
              </div>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              {t('admin_health.system_healthcheck')}
            </h1>
            <p className="text-muted-foreground">{t('admin_health.go_live_title', 'Go-Live Bereitschaftstest & QA Dashboard')}</p>
          </div>
          <Button 
            onClick={() => navigate('/admin')}
            variant="outline"
          >
            {t('admin_health.back_to_admin', 'Zurück zum Admin')}
          </Button>
        </div>

        {/* Go/No-Go Readiness Banner */}
        <div className={`p-5 rounded-xl border-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          isGoLiveReady ? 'bg-green-50 border-green-500 dark:bg-green-950/30 dark:border-green-700' :
          !testRun ? 'bg-yellow-50 border-yellow-500 dark:bg-yellow-950/30 dark:border-yellow-700' :
          'bg-red-50 border-red-500 dark:bg-red-950/30 dark:border-red-700'
        }`}>
          <div className="flex items-center gap-3">
            {isGoLiveReady ? (
              <CheckCircle className="w-8 h-8 text-green-600 shrink-0" />
            ) : !testRun ? (
              <AlertTriangle className="w-8 h-8 text-yellow-600 shrink-0" />
            ) : (
              <XCircle className="w-8 h-8 text-red-600 shrink-0" />
            )}
            <div>
              <p className={`text-lg font-bold ${
                isGoLiveReady ? 'text-green-800 dark:text-green-200' :
                !testRun ? 'text-yellow-800 dark:text-yellow-200' :
                'text-red-800 dark:text-red-200'
              }`}>
                {isGoLiveReady ? '✅ READY – Go-Live freigegeben' :
                 !testRun ? '⏳ PENDING – Self-Test ausführen' :
                 '❌ NOT READY – Probleme beheben'}
              </p>
              <p className="text-sm text-muted-foreground">
                DB: {dbOk ? '✓' : '✗'}
                {' • Self-Test: '}
                {testRun
                  ? (testPassed
                    ? `✓ ${latestRun?.summary?.passed}/${latestRun?.summary?.total}`
                    : `✗ ${latestRun?.summary?.failed} fehlgeschlagen`)
                  : 'ausstehend'}
                {latestRun?.timestamp && ` • ${new Date(latestRun.timestamp).toLocaleString('de-DE')}`}
              </p>
            </div>
          </div>
          {!testRun && (
            <Button
              onClick={() => runTestMutation.mutate()}
              disabled={runTestMutation.isPending}
              size="sm"
            >
              {runTestMutation.isPending ? (
                <><RefreshCw className="w-4 h-4 mr-1 animate-spin" /> {t('admin_health.test_running')}</>
              ) : (
                <><Play className="w-4 h-4 mr-1" /> {t('admin_health.test_button')}</>
              )}
            </Button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Database className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{previousRuns?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">{t('admin_health.qa_runs')}</p>
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
                  <p className="text-sm text-muted-foreground">{t('admin_health.passed')}</p>
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
                  <p className="text-sm text-muted-foreground">{t('admin_health.failed')}</p>
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
                  <p className="text-sm text-muted-foreground">{t('admin_health.last_run_time')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Globe className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-xs font-bold">🇨🇭 {t('admin_health.switzerland')}</p>
                  <p className="text-xs text-muted-foreground">{t('admin_health.zurich_region')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live System Checks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* DB Connection Check */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                {t('admin_health.database_connection')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dbCheckLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <RefreshCw className="w-4 h-4 animate-spin" /> {t('admin_health.checking')}
                </div>
              ) : dbCheck?.connected ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="font-medium text-green-700">{t('admin_health.connected')}</span>
                  </div>
                  <Badge variant="outline">{dbCheck.latency} ms Latenz</Badge>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="font-medium text-red-700">{t('admin_health.error')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{dbCheck?.error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* GitHub Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                {t('admin_health.github_status')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {githubLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <RefreshCw className="w-4 h-4 animate-spin" /> {t('admin_health.checking')}
                </div>
              ) : githubStatus ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {githubStatus.indicator === 'none' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    )}
                    <span className="font-medium">{githubStatus.description}</span>
                  </div>
                  <Badge variant="outline">{githubStatus.indicator}</Badge>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-sm">{t('admin_health.not_reachable')}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Environment Check */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Server className="w-5 h-5 text-primary" />
                {t('admin_health.environment_info')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className={envInfo.label === 'PRODUCTION' ? 'bg-red-600' : 'bg-yellow-600'}>
                  {envInfo.label}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-mono text-muted-foreground break-all">
                  <span className="font-semibold text-foreground">VITE_SUPABASE_URL:</span><br />
                  {import.meta.env.VITE_SUPABASE_URL || '⚠️ nicht gesetzt'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-2 border-primary/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  {t('admin_health.stripe_payment')}
                </CardTitle>
                <CardDescription>
                  {t('admin_health.webhook_status')}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ['stripeStatus'] });
                  toast.success(t('admin.stripe_refreshed'));
                }}
                className="gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                {t('admin_health.refresh')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Current Mode */}
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t('admin_health.current_mode')}</span>
                  <Badge 
                    variant={stripeStatus?.currentMode === 'live' ? 'default' : 'secondary'}
                    className={stripeStatus?.currentMode === 'live' ? 'bg-green-600' : 'bg-yellow-600'}
                  >
                    {stripeStatus?.currentMode === 'live' ? `🔴 ${t('admin_health.live')}` : `🟡 ${t('admin_health.test')}`}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stripeStatus?.currentMode === 'live' 
                    ? t('admin_health.real_transactions', 'Echte Transaktionen aktiv')
                    : t('admin_health.sandbox_mode', 'Sandbox-Modus für Tests')}
                </p>
              </div>

              {/* Last Webhook */}
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t('admin_health.last_webhook')}</span>
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
                    {t('admin_health.no_webhooks')}
                  </p>
                )}
              </div>

              {/* 24h Stats */}
              <div className="p-4 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">{t('admin_health.last_24h')}</span>
                <div className="flex gap-4 mt-2">
                  <div className="text-center">
                    <p className="text-lg font-bold">{stripeStatus?.stats24h?.test || 0}</p>
                    <p className="text-xs text-muted-foreground">{t('admin_health.test')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">{stripeStatus?.stats24h?.live || 0}</p>
                    <p className="text-xs text-muted-foreground">{t('admin_health.live')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-destructive">{stripeStatus?.stats24h?.failed || 0}</p>
                    <p className="text-xs text-muted-foreground">{t('admin_health.error')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Warning if no webhooks configured */}
            {!stripeStatus?.lastWebhook && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {t('admin_health.no_webhooks')}. {t('admin_health.no_webhooks_info')}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Push Notification Status Card */}
        <Card className="border-2 border-primary/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  {t('admin_health.push_notifications')}
                </CardTitle>
                <CardDescription>
                  {t('admin_health.registered_devices')}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ['pushStatus'] });
                  toast.success(t('admin.push_refreshed'));
                }}
                className="gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                {t('admin_health.refresh')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Token Stats by Platform */}
              <div className="p-4 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">{t('admin_health.active_devices')}</span>
                <div className="flex gap-4 mt-2">
                  <div className="text-center">
                    <p className="text-lg font-bold">{pushStatus?.tokens?.ios || 0}</p>
                    <p className="text-xs text-muted-foreground">{t('admin_health.ios')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">{pushStatus?.tokens?.android || 0}</p>
                    <p className="text-xs text-muted-foreground">{t('admin_health.android')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">{pushStatus?.tokens?.web || 0}</p>
                    <p className="text-xs text-muted-foreground">{t('admin_health.web')}</p>
                  </div>
                </div>
              </div>

              {/* Environment Stats */}
              <div className="p-4 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">{t('admin_health.by_environment')}</span>
                <div className="flex gap-4 mt-2">
                  <div className="text-center">
                    <p className="text-lg font-bold">{pushStatus?.tokens?.production || 0}</p>
                    <p className="text-xs text-muted-foreground">{t('admin_health.prod')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">{pushStatus?.tokens?.development || 0}</p>
                    <p className="text-xs text-muted-foreground">{t('admin_health.dev')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">{pushStatus?.tokens?.total || 0}</p>
                    <p className="text-xs text-muted-foreground">{t('admin_health.total')}</p>
                  </div>
                </div>
              </div>

              {/* Last Token Registered */}
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t('admin_health.last_token')}</span>
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
                    {t('admin_health.no_tokens')}
                  </p>
                )}
              </div>
            </div>

            {/* Push Stats (last 24h) */}
            <div className="p-4 rounded-lg bg-muted/50">
              <span className="text-sm font-medium">{t('admin_health.last_24h_notifications')}</span>
              <div className="flex gap-6 mt-2">
                <div className="text-center">
                  <p className="text-lg font-bold">{pushStatus?.pushStats?.sent || 0}</p>
                  <p className="text-xs text-muted-foreground">{t('admin_health.sent')}</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-destructive">{pushStatus?.pushStats?.failed || 0}</p>
                  <p className="text-xs text-muted-foreground">{t('admin_health.failed')}</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{pushStatus?.pushStats?.total || 0}</p>
                  <p className="text-xs text-muted-foreground">{t('admin_health.total')}</p>
                </div>
              </div>
            </div>

            {/* Warning if no tokens */}
            {pushStatus?.tokens?.total === 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {t('admin_health.no_tokens')}. {t('admin_health.no_tokens_info')}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* View Logs Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="w-5 h-5" />
              {t('admin_health.logs_debugging')}
            </CardTitle>
            <CardDescription>
              {t('admin_health.logs_info')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-lg bg-muted/50 space-y-1">
              <p className="font-medium text-sm">📋 {t('admin_health.stripe_webhook_logs')}</p>
              <p className="text-xs text-muted-foreground">
                {t('admin_health.lovable_stripe_logs', 'Lovable Cloud → Cloud Tab → Edge Functions → <code className="bg-muted px-1 rounded">stripe-webhook</code> → Logs einsehen. Alternativ: Stripe Dashboard → Developers → Webhooks → Events.')}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 space-y-1">
              <p className="font-medium text-sm">🔔 {t('admin_health.push_notification_logs')}</p>
              <p className="text-xs text-muted-foreground">
                {t('admin_health.lovable_push_logs', 'Lovable Cloud → Cloud Tab → Edge Functions → <code className="bg-muted px-1 rounded">send-push-notification</code> / <code className="bg-muted px-1 rounded">trigger-push-notification</code> → Logs.')}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 space-y-1">
              <p className="font-medium text-sm">🗃️ {t('admin_health.database_logs')}</p>
              <p className="text-xs text-muted-foreground">
                Lovable Cloud → Cloud Tab → Database → Tabellen <code className="bg-muted px-1 rounded">stripe_webhook_events</code> und <code className="bg-muted px-1 rounded">push_notification_logs</code> {t('admin_health.view_directly')}.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Run Self-Test Button */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              {t('admin_health.end_to_end_test', 'End-to-End Self-Test')}
            </CardTitle>
            <CardDescription>
              {t('admin_health.test_description')}
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
                  {t('admin_health.tests_running', 'Tests laufen...')}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  {t('admin_health.start_test', 'Self-Test starten')}
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
                  {t('admin_health.current_test_result', 'Aktuelles Testergebnis')}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {getStatusBadge(lastTestResult.status)}
                  <span className="text-sm text-muted-foreground">
                    {new Date(lastTestResult.timestamp).toLocaleString('de-DE')}
                  </span>
                </div>
              </div>
              <CardDescription>
                {lastTestResult.summary.passed}/{lastTestResult.summary.total} {t('admin_health.tests_passed', 'Tests bestanden')}
                ({lastTestResult.summary.duration_ms}ms)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin_health.test')}</TableHead>
                    <TableHead>{t('admin_health.status')}</TableHead>
                    <TableHead className="hidden md:table-cell">{t('admin_health.details')}</TableHead>
                    <TableHead className="text-right">{t('admin_health.time')}</TableHead>
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
              <CardTitle>{t('admin_health.previous_qa_runs')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin_health.date')}</TableHead>
                    <TableHead>{t('admin_health.status')}</TableHead>
                    <TableHead>{t('admin_health.tests')}</TableHead>
                    <TableHead className="text-right">{t('admin_health.duration')}</TableHead>
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
            <CardTitle className="text-xl">🚦 {t('admin_health.go_no_go')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isGoLiveReady ? (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950/30">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200 font-medium">
                  {t('admin_health.status_ready', '✅ GO – Alle Checks bestanden. DB ✓ • Self-Test {{passed}}/{{total}} ✓', { passed: latestRun?.summary?.passed, total: latestRun?.summary?.total })}
                </AlertDescription>
              </Alert>
            ) : !testRun ? (
              <Alert>
                <AlertTriangle className="h-5 w-5" />
                <AlertDescription>
                  {t('admin_health.status_pending', '⏳ Self-Test noch nicht ausgeführt. Bitte Tests starten.')}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-5 w-5" />
                <AlertDescription className="font-medium">
                  ❌ NO-GO – {!dbOk ? t('admin_health.db_unreachable', 'DB nicht erreichbar. ') : ''}{!testPassed ? t('admin_health.tests_failed_count', '{{count}} Test(s) fehlgeschlagen.', { count: latestRun?.summary?.failed }) : ''} {t('admin_health.fix_errors', 'Bitte Fehler beheben.')}
                </AlertDescription>
              </Alert>
            )}
            {latestRun?.timestamp && (
              <p className="text-xs text-muted-foreground">
                {t('admin_health.last_test_time', 'Letzter Test')}: {new Date(latestRun.timestamp).toLocaleString('de-DE')}
              </p>
            )}
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
};

export default AdminHealth;
