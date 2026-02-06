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
  Lock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        </div>

        {/* Run Self-Test Button */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              End-to-End Self-Test
            </CardTitle>
            <CardDescription>
              Automatisierter Test aller Kernflüsse: Auth, Meals, Bookings, Privacy, Messaging, Content Filter
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

        {/* Manual QA Checklist */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Manuelle QA-Checkliste</CardTitle>
            <CardDescription>
              Zusätzliche manuelle Prüfpunkte vor Go-Live
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {[
                { id: 'meal-create', label: 'Meal erstellen → erscheint im Feed', icon: <Database className="w-4 h-4" /> },
                { id: 'booking-flow', label: 'Booking → Bestätigung → Status korrekt', icon: <CreditCard className="w-4 h-4" /> },
                { id: 'cancel-flow', label: 'Stornierung → Deadline-Check → Inventory restore', icon: <XCircle className="w-4 h-4" /> },
                { id: 'noshow-flow', label: 'No-Show markieren → Reliability Score Update', icon: <AlertTriangle className="w-4 h-4" /> },
                { id: 'rating-flow', label: 'Bewertung → Sichtbarkeit nach beidseitiger Bewertung', icon: <CheckCircle className="w-4 h-4" /> },
                { id: 'chat-flow', label: 'Chat → Nachrichten werden zugestellt', icon: <MessageSquare className="w-4 h-4" /> },
                { id: 'profile-gate', label: 'Unvollständiges Profil → Booking blockiert', icon: <Users className="w-4 h-4" /> },
                { id: 'self-book', label: 'Eigenes Meal buchen → Blockiert', icon: <Lock className="w-4 h-4" /> },
              ].map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                  <Badge variant="outline">Manuell prüfen</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

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
