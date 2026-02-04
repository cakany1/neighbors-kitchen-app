import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle, XCircle, User, Phone, MapPin, Globe, Heart, 
  Shield, Star, Calendar, AlertTriangle, CreditCard
} from 'lucide-react';

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  nickname: string | null;
  gender: string | null;
  age: number | null;
  phone_number: string | null;
  phone_verified: boolean | null;
  avatar_url: string | null;
  verification_status: string | null;
  id_verified: boolean | null;
  id_document_url: string | null;
  is_couple: boolean | null;
  partner_name: string | null;
  partner_photo_url: string | null;
  partner_gender: string | null;
  private_address: string | null;
  private_city: string | null;
  private_postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  allergens: string[] | null;
  dislikes: string[] | null;
  languages: string[] | null;
  role: string | null;
  visibility_mode: string | null;
  display_real_name: boolean | null;
  karma: number | null;
  successful_pickups: number | null;
  no_shows: number | null;
  vacation_mode: boolean | null;
  notification_radius: number | null;
  iban: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface AdminUserProfileDialogProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FieldRow = ({ 
  label, 
  value, 
  icon: Icon,
  status 
}: { 
  label: string; 
  value: React.ReactNode; 
  icon?: React.ComponentType<{ className?: string }>;
  status?: 'filled' | 'missing' | 'neutral';
}) => {
  const statusColor = status === 'filled' 
    ? 'text-green-500' 
    : status === 'missing' 
      ? 'text-destructive' 
      : 'text-muted-foreground';
  
  return (
    <div className="flex items-start justify-between py-2 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </div>
      <div className={`text-sm font-medium text-right max-w-[60%] ${statusColor}`}>
        {value || <span className="text-destructive italic">Nicht ausgefüllt</span>}
      </div>
    </div>
  );
};

const StatusBadge = ({ filled, label }: { filled: boolean; label: string }) => (
  <Badge 
    variant={filled ? 'default' : 'destructive'} 
    className="gap-1 text-xs"
  >
    {filled ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
    {label}
  </Badge>
);

export function AdminUserProfileDialog({ user, open, onOpenChange }: AdminUserProfileDialogProps) {
  if (!user) return null;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const genderEmoji = (gender: string | null) => {
    switch (gender) {
      case 'female': case 'woman': return '👩';
      case 'male': case 'man': return '👨';
      case 'diverse': return '🌈';
      default: return '❓';
    }
  };

  // Calculate profile completeness
  const requiredFields = [
    user.first_name,
    user.last_name,
    user.avatar_url,
    user.phone_number,
    user.gender,
    user.private_address,
  ];
  const filledCount = requiredFields.filter(Boolean).length;
  const completeness = Math.round((filledCount / requiredFields.length) * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="w-12 h-12 cursor-pointer" onClick={() => user.avatar_url && window.open(user.avatar_url, '_blank')}>
              <AvatarImage src={user.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.id}`} />
              <AvatarFallback>{user.first_name?.charAt(0) || '?'}</AvatarFallback>
            </Avatar>
            <div>
              <span>{user.first_name} {user.last_name}</span>
              {user.nickname && <span className="text-muted-foreground ml-2">@{user.nickname}</span>}
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          {/* Completeness Bar */}
          <div className="mb-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex justify-between text-sm mb-1">
              <span>Profil-Vollständigkeit</span>
              <span className={completeness === 100 ? 'text-green-500' : 'text-amber-500'}>
                {completeness}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${completeness === 100 ? 'bg-green-500' : 'bg-amber-500'}`}
                style={{ width: `${completeness}%` }}
              />
            </div>
          </div>

          {/* Quick Status Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            <StatusBadge filled={!!user.avatar_url} label="Foto" />
            <StatusBadge filled={!!user.phone_number} label="Telefon" />
            <StatusBadge filled={!!user.private_address} label="Adresse" />
            <StatusBadge filled={user.id_verified === true} label="ID verifiziert" />
            <StatusBadge filled={user.phone_verified === true} label="Tel. verifiziert" />
            {user.is_couple && <StatusBadge filled={!!user.partner_photo_url} label="Partner-Foto" />}
          </div>

          <Separator className="my-4" />

          {/* Personal Info */}
          <div className="space-y-1">
            <h3 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <User className="w-4 h-4" /> Persönliche Daten
            </h3>
            <FieldRow 
              label="Vorname" 
              value={user.first_name} 
              status={user.first_name ? 'filled' : 'missing'} 
            />
            <FieldRow 
              label="Nachname" 
              value={user.last_name} 
              status={user.last_name ? 'filled' : 'missing'} 
            />
            <FieldRow 
              label="Nickname" 
              value={user.nickname ? `@${user.nickname}` : null} 
              status="neutral" 
            />
            <FieldRow 
              label="Geschlecht" 
              value={user.gender ? `${genderEmoji(user.gender)} ${user.gender}` : null} 
              status={user.gender ? 'filled' : 'missing'} 
            />
            <FieldRow 
              label="Alter" 
              value={user.age ? `${user.age} Jahre` : null} 
              status="neutral" 
            />
            <FieldRow 
              label="Echter Name anzeigen" 
              value={user.display_real_name ? 'Ja' : 'Nein'} 
              status="neutral" 
            />
          </div>

          <Separator className="my-4" />

          {/* Contact Info */}
          <div className="space-y-1">
            <h3 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4" /> Kontakt
            </h3>
            <FieldRow 
              label="Telefon" 
              value={user.phone_number} 
              status={user.phone_number ? 'filled' : 'missing'} 
            />
            <FieldRow 
              label="Tel. verifiziert" 
              value={user.phone_verified ? '✅ Ja' : '❌ Nein'} 
              status={user.phone_verified ? 'filled' : 'missing'} 
            />
          </div>

          <Separator className="my-4" />

          {/* Address */}
          <div className="space-y-1">
            <h3 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Adresse
            </h3>
            <FieldRow 
              label="Strasse" 
              value={user.private_address} 
              status={user.private_address ? 'filled' : 'missing'} 
            />
            <FieldRow 
              label="PLZ" 
              value={user.private_postal_code} 
              status={user.private_postal_code ? 'filled' : 'missing'} 
            />
            <FieldRow 
              label="Stadt" 
              value={user.private_city} 
              status={user.private_city ? 'filled' : 'missing'} 
            />
            <FieldRow 
              label="Koordinaten" 
              value={user.latitude && user.longitude ? `${user.latitude.toFixed(4)}, ${user.longitude.toFixed(4)}` : null} 
              status="neutral" 
            />
            <FieldRow 
              label="Benachrichtigungsradius" 
              value={user.notification_radius ? `${user.notification_radius}m` : null} 
              status="neutral" 
            />
          </div>

          <Separator className="my-4" />

          {/* Couple Info */}
          {user.is_couple && (
            <>
              <div className="space-y-1">
                <h3 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <Heart className="w-4 h-4" /> Partner (Couple)
                </h3>
                <FieldRow 
                  label="Partnername" 
                  value={user.partner_name} 
                  status={user.partner_name ? 'filled' : 'missing'} 
                />
                <FieldRow 
                  label="Partner-Geschlecht" 
                  value={user.partner_gender ? `${genderEmoji(user.partner_gender)} ${user.partner_gender}` : null} 
                  status="neutral" 
                />
                <FieldRow 
                  label="Partner-Foto" 
                  value={user.partner_photo_url ? (
                    <Avatar className="w-8 h-8 cursor-pointer" onClick={() => window.open(user.partner_photo_url!, '_blank')}>
                      <AvatarImage src={user.partner_photo_url} />
                      <AvatarFallback>{user.partner_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  ) : null} 
                  status={user.partner_photo_url ? 'filled' : 'missing'} 
                />
              </div>
              <Separator className="my-4" />
            </>
          )}

          {/* Preferences */}
          <div className="space-y-1">
            <h3 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <Globe className="w-4 h-4" /> Präferenzen
            </h3>
            <FieldRow 
              label="Sprachen" 
              value={user.languages?.length ? user.languages.join(', ') : null} 
              status="neutral" 
            />
            <FieldRow 
              label="Rolle" 
              value={user.role} 
              status="neutral" 
            />
            <FieldRow 
              label="Sichtbarkeit" 
              value={user.visibility_mode} 
              status="neutral" 
            />
            <FieldRow 
              label="Allergien" 
              value={user.allergens?.length ? user.allergens.join(', ') : 'Keine'} 
              status="neutral" 
            />
            <FieldRow 
              label="Abneigungen" 
              value={user.dislikes?.length ? user.dislikes.join(', ') : 'Keine'} 
              status="neutral" 
            />
            <FieldRow 
              label="Urlaubs-Modus" 
              value={user.vacation_mode ? '🏖️ Aktiv' : 'Inaktiv'} 
              status="neutral" 
            />
          </div>

          <Separator className="my-4" />

          {/* Verification & Trust */}
          <div className="space-y-1">
            <h3 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Verifizierung & Vertrauen
            </h3>
            <FieldRow 
              label="Verifizierungsstatus" 
              value={
                <Badge variant={user.verification_status === 'approved' ? 'default' : user.verification_status === 'pending' ? 'secondary' : 'destructive'}>
                  {user.verification_status}
                </Badge>
              } 
              status="neutral" 
            />
            <FieldRow 
              label="ID verifiziert" 
              value={user.id_verified ? '✅ Ja' : '❌ Nein'} 
              status={user.id_verified ? 'filled' : 'missing'} 
            />
            <FieldRow 
              label="ID-Dokument" 
              value={user.id_document_url ? '📄 Vorhanden' : null} 
              status="neutral" 
            />
          </div>

          <Separator className="my-4" />

          {/* Karma & Stats */}
          <div className="space-y-1">
            <h3 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <Star className="w-4 h-4" /> Karma & Statistiken
            </h3>
            <FieldRow 
              label="Karma" 
              value={user.karma !== null ? `⭐ ${user.karma} Punkte` : null} 
              status="neutral" 
            />
            <FieldRow 
              label="Erfolgreiche Abholungen" 
              value={user.successful_pickups !== null ? `✅ ${user.successful_pickups}` : null} 
              status="neutral" 
            />
            <FieldRow 
              label="No-Shows" 
              value={
                user.no_shows !== null ? (
                  <span className={user.no_shows > 0 ? 'text-destructive' : ''}>
                    {user.no_shows > 0 ? `⚠️ ${user.no_shows}` : '0'}
                  </span>
                ) : null
              } 
              status="neutral" 
            />
          </div>

          <Separator className="my-4" />

          {/* Financial */}
          <div className="space-y-1">
            <h3 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Finanzen
            </h3>
            <FieldRow 
              label="IBAN" 
              value={user.iban ? `${user.iban.slice(0, 4)}****${user.iban.slice(-4)}` : null} 
              status={user.iban ? 'filled' : 'missing'} 
            />
          </div>

          <Separator className="my-4" />

          {/* Timestamps */}
          <div className="space-y-1">
            <h3 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Zeitstempel
            </h3>
            <FieldRow 
              label="Registriert am" 
              value={formatDate(user.created_at)} 
              status="neutral" 
            />
            <FieldRow 
              label="Letzte Aktualisierung" 
              value={formatDate(user.updated_at)} 
              status="neutral" 
            />
          </div>

          {/* User ID (for debugging) */}
          <div className="mt-4 p-2 bg-muted/30 rounded text-xs text-muted-foreground font-mono">
            ID: {user.id}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}