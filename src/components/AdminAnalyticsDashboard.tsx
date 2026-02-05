import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, Smartphone, Monitor, Tablet, Clock, 
  TrendingUp, Download, LogOut, Activity, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface AnalyticsData {
  activeSessions: number;
  totalSessions: number;
  pwaInstalls: number;
  avgSessionDuration: number;
  deviceBreakdown: { mobile: number; tablet: number; desktop: number };
  topExitPages: { page: string; count: number }[];
  recentSessions: any[];
  pwaUsers: number;
}

export function AdminAnalyticsDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch analytics data
  const { data: analytics, isLoading, refetch } = useQuery({
    queryKey: ['adminAnalytics', refreshKey],
    queryFn: async (): Promise<AnalyticsData> => {
      // Get active sessions (heartbeat within last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const [
        activeSessionsResult,
        totalSessionsResult,
        pwaInstallsResult,
        sessionsWithDurationResult,
        deviceBreakdownResult,
        exitPagesResult,
        recentSessionsResult,
        pwaUsersResult
      ] = await Promise.all([
        // Active sessions count
        supabase
          .from('user_sessions')
          .select('id', { count: 'exact', head: true })
          .gte('last_heartbeat', fiveMinutesAgo)
          .is('ended_at', null),
        
        // Total sessions count
        supabase
          .from('user_sessions')
          .select('id', { count: 'exact', head: true }),
        
        // PWA installs count
        supabase
          .from('analytics_events')
          .select('id', { count: 'exact', head: true })
          .eq('event_type', 'pwa_install'),
        
        // Sessions with duration for average calculation
        supabase
          .from('user_sessions')
          .select('duration_seconds')
          .not('duration_seconds', 'is', null),
        
        // Device breakdown
        supabase
          .from('user_sessions')
          .select('device_type'),
        
        // Top exit pages
        supabase
          .from('user_sessions')
          .select('exit_page')
          .not('exit_page', 'is', null),
        
        // Recent sessions
        supabase
          .from('user_sessions')
          .select(`
            id,
            user_id,
            started_at,
            ended_at,
            last_heartbeat,
            last_page,
            exit_page,
            device_type,
            is_pwa,
            duration_seconds
          `)
          .order('started_at', { ascending: false })
          .limit(20),
        
        // PWA users count
        supabase
          .from('user_sessions')
          .select('user_id', { count: 'exact', head: true })
          .eq('is_pwa', true)
      ]);

      // Calculate average session duration
      const durations = sessionsWithDurationResult.data || [];
      const avgDuration = durations.length > 0
        ? durations.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / durations.length
        : 0;

      // Calculate device breakdown
      const devices = deviceBreakdownResult.data || [];
      const deviceCounts = { mobile: 0, tablet: 0, desktop: 0 };
      devices.forEach(d => {
        if (d.device_type === 'mobile') deviceCounts.mobile++;
        else if (d.device_type === 'tablet') deviceCounts.tablet++;
        else deviceCounts.desktop++;
      });

      // Calculate top exit pages
      const exits = exitPagesResult.data || [];
      const exitCounts: Record<string, number> = {};
      exits.forEach(e => {
        if (e.exit_page) {
          exitCounts[e.exit_page] = (exitCounts[e.exit_page] || 0) + 1;
        }
      });
      const topExitPages = Object.entries(exitCounts)
        .map(([page, count]) => ({ page, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        activeSessions: activeSessionsResult.count || 0,
        totalSessions: totalSessionsResult.count || 0,
        pwaInstalls: pwaInstallsResult.count || 0,
        avgSessionDuration: Math.round(avgDuration),
        deviceBreakdown: deviceCounts,
        topExitPages,
        recentSessions: recentSessionsResult.data || [],
        pwaUsers: pwaUsersResult.count || 0
      };
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
  };

  const formatTimeAgo = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return 'gerade eben';
    if (diffMins < 60) return `vor ${diffMins}m`;
    if (diffMins < 1440) return `vor ${Math.round(diffMins / 60)}h`;
    return `vor ${Math.round(diffMins / 1440)}d`;
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Tablet className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalDevices = (analytics?.deviceBreakdown.mobile || 0) + 
    (analytics?.deviceBreakdown.tablet || 0) + 
    (analytics?.deviceBreakdown.desktop || 0);

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Live Analytics</h3>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Aktualisieren
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics?.activeSessions || 0}</p>
                <p className="text-xs text-muted-foreground">Aktive User</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics?.pwaInstalls || 0}</p>
                <p className="text-xs text-muted-foreground">PWA Installationen</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatDuration(analytics?.avgSessionDuration || 0)}</p>
                <p className="text-xs text-muted-foreground">Ø Session-Dauer</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics?.totalSessions || 0}</p>
                <p className="text-xs text-muted-foreground">Total Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Geräte-Verteilung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" /> Mobile
                </span>
                <span>{analytics?.deviceBreakdown.mobile || 0}</span>
              </div>
              <Progress 
                value={totalDevices > 0 ? ((analytics?.deviceBreakdown.mobile || 0) / totalDevices) * 100 : 0} 
                className="h-2"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Tablet className="w-4 h-4" /> Tablet
                </span>
                <span>{analytics?.deviceBreakdown.tablet || 0}</span>
              </div>
              <Progress 
                value={totalDevices > 0 ? ((analytics?.deviceBreakdown.tablet || 0) / totalDevices) * 100 : 0} 
                className="h-2"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Monitor className="w-4 h-4" /> Desktop
                </span>
                <span>{analytics?.deviceBreakdown.desktop || 0}</span>
              </div>
              <Progress 
                value={totalDevices > 0 ? ((analytics?.deviceBreakdown.desktop || 0) / totalDevices) * 100 : 0} 
                className="h-2"
              />
            </div>
            
            {/* PWA Users */}
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-primary" /> PWA-Nutzer
                </span>
                <Badge variant="secondary">{analytics?.pwaUsers || 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Exit Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Top Exit-Punkte
            </CardTitle>
            <CardDescription>Wo User die App verlassen</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics?.topExitPages && analytics.topExitPages.length > 0 ? (
              <div className="space-y-2">
                {analytics.topExitPages.map((exit, i) => (
                  <div key={exit.page} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="text-muted-foreground w-4">{i + 1}.</span>
                      <code className="bg-muted px-1 rounded text-xs">{exit.page}</code>
                    </span>
                    <Badge variant="outline">{exit.count}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Noch keine Exit-Daten verfügbar
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aktuelle Sessions</CardTitle>
          <CardDescription>Die letzten 20 User-Sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {analytics?.recentSessions.map((session: any) => {
                const isActive = !session.ended_at && 
                  new Date(session.last_heartbeat).getTime() > Date.now() - 5 * 60 * 1000;
                
                return (
                  <div 
                    key={session.id}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      isActive ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800' : 'bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {getDeviceIcon(session.device_type)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {session.last_page || '/'}
                          </span>
                          {session.is_pwa && (
                            <Badge variant="secondary" className="text-xs">PWA</Badge>
                          )}
                          {isActive && (
                            <Badge className="text-xs bg-green-500">Live</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(session.started_at)}
                          {session.duration_seconds && ` • ${formatDuration(session.duration_seconds)}`}
                        </span>
                      </div>
                    </div>
                    {session.exit_page && (
                      <code className="text-xs bg-muted px-1 rounded">
                        → {session.exit_page}
                      </code>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
