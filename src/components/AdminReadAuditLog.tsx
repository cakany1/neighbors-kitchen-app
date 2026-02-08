import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, Download, AlertCircle, Filter, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface AdminRead {
  id: string;
  admin_id: string;
  admin_first_name: string;
  admin_last_name: string;
  target_user_id: string;
  target_first_name: string;
  target_last_name: string;
  action: string;
  fields_count: number;
  context: string;
  created_at: string;
  notes: string | null;
}

export const AdminReadAuditLog = () => {
  const { t } = useTranslation();
  const [filterUserId, setFilterUserId] = useState('');
  const [filterAdminId, setFilterAdminId] = useState('');

  const { data: reads, isLoading, error } = useQuery({
    queryKey: ['adminReadsAudit', filterUserId, filterAdminId],
    queryFn: async () => {
      let query = supabase
        .from('admin_reads_summary')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterUserId) {
        query = query.eq('target_user_id', filterUserId);
      }
      if (filterAdminId) {
        query = query.eq('admin_id', filterAdminId);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      return (data || []) as AdminRead[];
    },
  });

  const getActionBadge = (action: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      view: 'default',
      export_json: 'secondary',
      export_csv: 'secondary',
    };

    const variant = variants[action] || 'default';
    const label = action.includes('export')
      ? `📥 ${action.replace('export_', '').toUpperCase()}`
      : `👁️ View`;

    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Alle Zugriffe auf sensible Benutzerdaten werden automatisch protokolliert.
          Dies ist ein Audit-Trail für Compliance und Sicherheit.
        </AlertDescription>
      </Alert>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Zielbenutzer-ID</label>
              <Input
                placeholder="User ID..."
                value={filterUserId}
                onChange={(e) => setFilterUserId(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Admin-ID</label>
              <Input
                placeholder="Admin ID..."
                value={filterAdminId}
                onChange={(e) => setFilterAdminId(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex gap-2">
            {(filterUserId || filterAdminId) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterUserId('');
                  setFilterAdminId('');
                }}
              >
                <X className="w-4 h-4 mr-1" />
                Filter zurücksetzen
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Audit-Log: Admin Datenzugriffe</span>
            <Badge variant="outline">
              {reads?.length || 0} Einträge
            </Badge>
          </CardTitle>
          <CardDescription>
            Zeigt alle Zugriffe auf sensible Benutzerdaten durch Admins
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Fehler beim Laden des Audit-Logs: {(error as Error).message}
              </AlertDescription>
            </Alert>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-pulse space-y-2 w-full">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted rounded" />
                ))}
              </div>
            </div>
          ) : reads && reads.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum/Zeit</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Zielbenutzer</TableHead>
                    <TableHead>Aktion</TableHead>
                    <TableHead>Felder</TableHead>
                    <TableHead>Kontext</TableHead>
                    <TableHead className="text-right">Notizen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reads.map((read) => (
                    <TableRow key={read.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(read.created_at), {
                          addSuffix: true,
                          locale: de,
                        })}
                        <br />
                        <span className="text-[10px]">
                          {new Date(read.created_at).toLocaleString('de-DE')}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {read.admin_first_name} {read.admin_last_name}
                        <br />
                        <span className="text-xs text-muted-foreground font-mono">
                          {read.admin_id.slice(0, 8)}...
                        </span>
                      </TableCell>
                      <TableCell>
                        {read.target_first_name} {read.target_last_name}
                        <br />
                        <span className="text-xs text-muted-foreground font-mono">
                          {read.target_user_id.slice(0, 8)}...
                        </span>
                      </TableCell>
                      <TableCell>{getActionBadge(read.action)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {read.fields_count} Felder
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {read.context}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {read.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Eye className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground">
                Keine Admin-Datenzugriffe protokolliert
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      {reads && reads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Statistiken</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Eindeutige Admins</p>
                <p className="text-2xl font-bold">
                  {new Set(reads.map((r) => r.admin_id)).size}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Benutzer mit Zugriff
                </p>
                <p className="text-2xl font-bold">
                  {new Set(reads.map((r) => r.target_user_id)).size}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Durchschn. Felder/Zugriff
                </p>
                <p className="text-2xl font-bold">
                  {(
                    reads.reduce((sum, r) => sum + (r.fields_count || 0), 0) /
                    reads.length
                  ).toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
