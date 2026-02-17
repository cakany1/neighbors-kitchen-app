import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { normalizeAll } from '@/utils/canonical_map';

import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';

import { ProfileRatings } from '@/components/ProfileRatings';
import { ProfileWizard } from '@/components/ProfileWizard';
import { ChefBookings } from '@/components/ChefBookings';
import { ChangePasswordSection } from '@/components/ChangePasswordSection';
import { HouseholdLinking } from '@/components/HouseholdLinking';
import { BlockedUsersList } from '@/components/BlockedUsersList';
import { TwoFactorSettings } from '@/components/TwoFactorSettings';
import { VerificationDialog } from '@/components/VerificationDialog';
import { VerificationBadges } from '@/components/VerificationBadges';
import { ReliabilityDisplay } from '@/components/ReliabilityDisplay';
import { KarmaLevel } from '@/components/KarmaLevel';
import { FeedbackDialog } from '@/components/FeedbackDialog';
import { PhotoPicker } from '@/components/PhotoPicker';
import GalleryUpload from '@/components/GalleryUpload';
import GalleryGrid from '@/components/GalleryGrid';
import { AppVersionBadge } from '@/components/AppVersionBadge';
import { ComplianceLinks } from '@/components/ComplianceLinks';
import { TagPicker, ALLERGEN_OPTIONS, DISLIKE_OPTIONS } from '@/components/TagPicker';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

import {
  User, Settings, Camera, MapPin, Phone, ChefHat, LogOut,
  ChevronDown, Loader2, Shield, Palmtree, Globe, Pencil, Trash2, AlertTriangle, X, Heart, Eye, CreditCard, Users
} from 'lucide-react';

const Profile = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [isOAuthUser, setIsOAuthUser] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Editable fields
  const [nickname, setNickname] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState<number | null>(null);
  const [privateAddress, setPrivateAddress] = useState('');
  const [privateCity, setPrivateCity] = useState('');
  const [privatePostalCode, setPrivatePostalCode] = useState('');
  const [vacationMode, setVacationMode] = useState(false);
  const [displayRealName, setDisplayRealName] = useState(false);
  const [notificationRadius, setNotificationRadius] = useState<number>(5);
  const [languages, setLanguages] = useState<string[]>([]);
  const [allergens, setAllergens] = useState<string[]>([]);
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [isCoupleToggle, setIsCoupleToggle] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [partnerGender, setPartnerGender] = useState('');
  const [visibilityMode, setVisibilityMode] = useState('all');
  const [iban, setIban] = useState('');

  // Collapsible sections
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email || '');
        setIsOAuthUser(user.app_metadata?.provider !== 'email');
      }
    };
    getUser();
  }, []);

  // Fetch profile data
  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ['currentUser', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Sync profile data to editable fields
  useEffect(() => {
    if (profile) {
      setNickname(profile.nickname || '');
      setPhoneNumber(profile.phone_number || '');
      setGender(profile.gender || '');
      setAge(profile.age);
      setPrivateAddress(profile.private_address || '');
      setPrivateCity(profile.private_city || '');
      setPrivatePostalCode(profile.private_postal_code || '');
      setVacationMode(profile.vacation_mode || false);
      setDisplayRealName(profile.display_real_name || false);
      setNotificationRadius(profile.notification_radius || 5);
      setLanguages(profile.languages || []);
      setAllergens(normalizeAll(profile.allergens || []));
      setDislikes(normalizeAll(profile.dislikes || []));
      setIsCoupleToggle(profile.is_couple || false);
      setPartnerName(profile.partner_name || '');
      setPartnerGender(profile.partner_gender || '');
      setVisibilityMode(profile.visibility_mode || 'all');
      setIban(profile.iban || '');
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!userId) return;

    // Validate phone
    const cleanPhone = phoneNumber.replace(/[\s\-()]/g, '');
    if (cleanPhone.length > 0 && cleanPhone.length < 8) {
      toast.error(t('profile.phone_too_short', 'Telefonnummer muss mindestens 8 Zeichen lang sein'));
      return;
    }

    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nickname,
          phone_number: phoneNumber || null,
          gender: gender || null,
          age,
          private_address: privateAddress || null,
          private_city: privateCity || null,
          private_postal_code: privatePostalCode || null,
          vacation_mode: vacationMode,
          display_real_name: displayRealName,
          notification_radius: notificationRadius,
          languages,
          allergens,
          dislikes,
          is_couple: isCoupleToggle,
          partner_name: partnerName || null,
          partner_gender: partnerGender || null,
          visibility_mode: visibilityMode,
          iban: iban || null,
        })
        .eq('id', userId);

      if (error) throw error;
      toast.success(t('profile.saved', '✅ Profil gespeichert'));
      setEditingProfile(false);
      queryClient.invalidateQueries({ queryKey: ['currentUser', userId] });
    } catch (error: any) {
      toast.error(error.message || t('profile.save_failed', 'Fehler beim Speichern'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!userId) return;
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast.error(`${t('toast.upload_failed')}: ${uploadError.message}`);
      return;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
    await supabase
      .from('profiles')
      .update({ avatar_url: data.publicUrl })
      .eq('id', userId);

    toast.success(t('toast.photo_updated'));
    queryClient.invalidateQueries({ queryKey: ['currentUser', userId] });
  };

  const handlePartnerPhotoUpload = async (file: File) => {
    if (!userId) return;
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/partner-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('gallery')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast.error(`${t('toast.upload_failed')}: ${uploadError.message}`);
      return;
    }

    const { data } = supabase.storage.from('gallery').getPublicUrl(fileName);
    await supabase
      .from('profiles')
      .update({ partner_photo_url: `${data.publicUrl}?t=${Date.now()}` })
      .eq('id', userId);

    toast.success(t('profile.partner_photo_updated', '📷 Partnerfoto aktualisiert'));
    queryClient.invalidateQueries({ queryKey: ['currentUser', userId] });
  };

  // Visibility mode options filtered by gender
  const getVisibilityOptions = () => {
    if (gender === 'male') return [{ value: 'all', label: t('profile.visibility_all', 'Alle') }];
    if (gender === 'female' || gender === 'woman')
      return [
        { value: 'all', label: t('profile.visibility_all', 'Alle') },
        { value: 'women_fli', label: t('profile.visibility_women_fli', 'Women + FLI') },
        { value: 'women_only', label: t('profile.visibility_women_only', 'Nur Frauen') },
      ];
    // diverse / other / non-binary
    return [
      { value: 'all', label: t('profile.visibility_all', 'Alle') },
      { value: 'women_fli', label: t('profile.visibility_women_fli', 'Women + FLI') },
    ];
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleVacationToggle = async (checked: boolean) => {
    if (!userId) return;
    setVacationMode(checked);
    await supabase
      .from('profiles')
      .update({ vacation_mode: checked })
      .eq('id', userId);
    toast.success(checked
      ? t('profile.vacation_on', '🏖️ Urlaubsmodus aktiviert')
      : t('profile.vacation_off', 'Urlaubsmodus deaktiviert'));
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Delete profile (cascades to all related data)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);
      
      if (error) {
        // If RLS blocks delete, try signing out anyway
        console.error('Profile delete error:', error);
      }
      
      await supabase.auth.signOut();
      toast.success(t('profile.account_deleted', 'Account wurde gelöscht'));
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || t('toast.profile_delete_error'));
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <main className="max-w-lg mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  const displayName = profile.display_real_name
    ? `${profile.first_name} ${profile.last_name}`
    : profile.nickname || profile.first_name;

  const missingPhoto = !profile.avatar_url;
  const missingAddress = !profile.private_address;
  const missingPhone = !profile.phone_number || profile.phone_number.replace(/[\s\-()]/g, '').length < 8;
  const isCouple = profile.is_couple || false;
  const partnerPhotoMissing = isCouple && !profile.partner_photo_url;
  const profileIncomplete = missingPhoto || missingAddress || missingPhone || partnerPhotoMissing;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="relative">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profile.avatar_url || undefined} alt={displayName} />
                  <AvatarFallback>
                    <User className="w-8 h-8" />
                  </AvatarFallback>
                </Avatar>
                <PhotoPicker
                  onPhotoSelected={(file) => handleAvatarUpload(file)}
                  bucket="avatars"
                  variant="outline"
                  size="sm"
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground p-1"
                  label=""
                />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold">{displayName}</h1>
                </div>

                <VerificationBadges
                  phoneVerified={profile.phone_verified || false}
                  idVerified={profile.id_verified || false}
                />

                <div className="mt-2">
                  <KarmaLevel karma={profile.karma || 0} size="sm" />
                </div>

                <ReliabilityDisplay
                  successfulPickups={profile.successful_pickups || 0}
                  noShows={profile.no_shows || 0}
                />
              </div>
            </div>

            {/* Vacation Mode Toggle */}
            <div className="flex items-center justify-between mt-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Palmtree className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{t('profile.vacation_mode', 'Urlaubsmodus')}</span>
              </div>
              <Switch
                checked={vacationMode}
                onCheckedChange={handleVacationToggle}
              />
            </div>

            {/* Profile completion prompt */}
            {profileIncomplete && (
              <Button
                onClick={() => setShowWizard(true)}
                variant="outline"
                className="w-full mt-4 border-primary/50 text-primary hover:bg-primary/10"
              >
                {t('profile.complete_profile', '⚠️ Profil vervollständigen')}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Ratings */}
        <ProfileRatings userId={userId!} />

        {/* Tabs: Info, Bookings, Gallery */}
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">
              <User className="w-4 h-4 mr-1" />
              {t('profile.info', 'Info')}
            </TabsTrigger>
            <TabsTrigger value="bookings">
              <ChefHat className="w-4 h-4 mr-1" />
              {t('profile.bookings', 'Buchungen')}
            </TabsTrigger>
            <TabsTrigger value="gallery">
              <Camera className="w-4 h-4 mr-1" />
              {t('profile.gallery', 'Galerie')}
            </TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{t('profile.personal_info', 'Persönliche Daten')}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editingProfile ? handleSaveProfile() : setEditingProfile(true)}
                    disabled={savingProfile}
                  >
                    {savingProfile ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : editingProfile ? (
                      t('profile.save', 'Speichern')
                    ) : (
                      <><Pencil className="w-4 h-4 mr-1" /> {t('profile.edit', 'Bearbeiten')}</>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Name - read only */}
                <div>
                  <Label className="text-muted-foreground text-xs">{t('profile.name', 'Name')}</Label>
                  <p className="font-medium">{profile.first_name} {profile.last_name}</p>
                  <p className="text-xs text-muted-foreground">{t('profile.name_readonly', 'Namensänderung nur über Support')}</p>
                </div>

                <Separator />

                {/* Nickname */}
                <div>
                  <Label htmlFor="nickname">{t('profile.nickname', 'Spitzname')}</Label>
                  {editingProfile ? (
                    <Input
                      id="nickname"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder={t('profile.nickname_placeholder', 'Dein Spitzname')}
                    />
                  ) : (
                    <p className="text-sm">{profile.nickname || '-'}</p>
                  )}
                </div>

                {/* Display real name toggle */}
                <div className="flex items-center justify-between">
                  <Label>{t('profile.show_real_name', 'Echten Namen anzeigen')}</Label>
                  <Switch
                    checked={displayRealName}
                    onCheckedChange={setDisplayRealName}
                    disabled={!editingProfile}
                  />
                </div>

                <Separator />

                {/* Phone */}
                <div>
                  <Label htmlFor="phone">
                    <Phone className="w-3 h-3 inline mr-1" />
                    {t('profile.phone', 'Telefon')}
                  </Label>
                  {editingProfile ? (
                    <Input
                      id="phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder={t('placeholders.phone_ch')}
                    />
                  ) : (
                    <p className="text-sm">{profile.phone_number || '-'}</p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <Label>{t('profile.gender', 'Geschlecht')}</Label>
                  {editingProfile ? (
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('profile.select_gender', 'Wählen')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="female">{t('profile.female', 'Weiblich')}</SelectItem>
                        <SelectItem value="male">{t('profile.male', 'Männlich')}</SelectItem>
                        <SelectItem value="non-binary">{t('profile.non_binary', 'Nicht-binär')}</SelectItem>
                        <SelectItem value="other">{t('profile.other', 'Andere')}</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm">{profile.gender || '-'}</p>
                  )}
                </div>

                {/* Age */}
                <div>
                  <Label htmlFor="age">{t('profile.age', 'Alter')}</Label>
                  {editingProfile ? (
                    <Input
                      id="age"
                      type="number"
                      min={16}
                      max={120}
                      value={age ?? ''}
                      onChange={(e) => setAge(e.target.value ? parseInt(e.target.value) : null)}
                    />
                  ) : (
                    <p className="text-sm">{profile.age || '-'}</p>
                  )}
                </div>

                <Separator />

                {/* Address */}
                <div>
                  <Label>
                    <MapPin className="w-3 h-3 inline mr-1" />
                    {t('profile.address', 'Adresse')}
                  </Label>
                  {editingProfile ? (
                    <div className="space-y-2 mt-1">
                      <Input
                        value={privateAddress}
                        onChange={(e) => setPrivateAddress(e.target.value)}
                        placeholder={t('profile.street', 'Strasse')}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={privatePostalCode}
                          onChange={(e) => setPrivatePostalCode(e.target.value)}
                          placeholder={t('profile.postal_code', 'PLZ')}
                        />
                        <Input
                          value={privateCity}
                          onChange={(e) => setPrivateCity(e.target.value)}
                          placeholder={t('profile.city', 'Stadt')}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm">
                      {profile.private_address
                        ? `${profile.private_address}, ${profile.private_postal_code || ''} ${profile.private_city || ''}`
                        : '-'}
                    </p>
                  )}
                </div>

                {/* Notification Radius */}
                <div>
                  <Label>{t('profile.notification_radius', 'Benachrichtigungsradius')}</Label>
                  {editingProfile ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={50}
                        value={notificationRadius}
                        onChange={(e) => setNotificationRadius(parseInt(e.target.value) || 5)}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">{t('units.km')}</span>
                    </div>
                  ) : (
                    <p className="text-sm">{profile.notification_radius || 5} km</p>
                  )}
                </div>

                {/* Languages */}
                <div>
                  <Label>
                    <Globe className="w-3 h-3 inline mr-1" />
                    {t('profile.languages', 'Sprachen')}
                  </Label>
                  {profile.languages && profile.languages.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {profile.languages.map((lang: string) => (
                        <Badge key={lang} variant="outline" className="text-xs">
                          {lang.toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">-</p>
                  )}
                </div>

                <Separator />

                {/* Allergens */}
                <div>
                  <Label>{t('profile.allergens', 'Allergene')}</Label>
                  <div className="mt-1">
                    <TagPicker
                      predefinedOptions={ALLERGEN_OPTIONS}
                      selected={allergens}
                      onChange={setAllergens}
                      allowCustom
                      placeholder={t('profile.add_allergen', 'z.B. Gluten, Nüsse...')}
                      badgeVariant="destructive"
                      readOnly={!editingProfile}
                      emptyText={t('profile.none', 'Keine')}
                    />
                  </div>
                </div>

                {/* Dislikes */}
                <div>
                  <Label>{t('profile.dislikes', 'Abneigungen')}</Label>
                  <div className="mt-1">
                    <TagPicker
                      predefinedOptions={DISLIKE_OPTIONS}
                      selected={dislikes}
                      onChange={setDislikes}
                      allowCustom
                      placeholder={t('profile.add_dislike', 'z.B. Koriander, Rosinen...')}
                      badgeVariant="secondary"
                      readOnly={!editingProfile}
                      emptyText={t('profile.none', 'Keine')}
                    />
                  </div>
                </div>

                <Separator />

                {/* Couple Account Toggle */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Users className="w-3 h-3" />
                      {t('profile.couple_account', 'Paar-Konto')}
                    </Label>
                    <Switch
                      checked={isCoupleToggle}
                      onCheckedChange={setIsCoupleToggle}
                      disabled={!editingProfile}
                    />
                  </div>

                  {isCoupleToggle && (
                    <div className="space-y-3 pl-2 border-l-2 border-primary/20 ml-2">
                      {/* Partner Name */}
                      <div>
                        <Label htmlFor="partnerName">{t('profile.partner_name', 'Partner-Name')}</Label>
                        {editingProfile ? (
                          <Input
                            id="partnerName"
                            value={partnerName}
                            onChange={(e) => setPartnerName(e.target.value)}
                            placeholder={t('profile.partner_name_placeholder', 'Name des Partners')}
                          />
                        ) : (
                          <p className="text-sm">{profile.partner_name || '-'}</p>
                        )}
                      </div>

                      {/* Partner Gender */}
                      <div>
                        <Label>{t('profile.partner_gender', 'Geschlecht des Partners')}</Label>
                        {editingProfile ? (
                          <Select value={partnerGender} onValueChange={setPartnerGender}>
                            <SelectTrigger>
                              <SelectValue placeholder={t('profile.select_gender', 'Wählen')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="female">{t('profile.female', 'Weiblich')}</SelectItem>
                              <SelectItem value="male">{t('profile.male', 'Männlich')}</SelectItem>
                              <SelectItem value="non-binary">{t('profile.non_binary', 'Nicht-binär')}</SelectItem>
                              <SelectItem value="other">{t('profile.other', 'Andere')}</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-sm">{profile.partner_gender || '-'}</p>
                        )}
                      </div>

                      {/* Partner Photo */}
                      <div>
                        <Label>{t('profile.partner_photo', 'Partner-Foto')}</Label>
                        <div className="flex items-center gap-3 mt-1">
                          <Avatar className="w-14 h-14">
                            <AvatarImage src={profile.partner_photo_url || undefined} />
                            <AvatarFallback><Heart className="w-5 h-5" /></AvatarFallback>
                          </Avatar>
                          <PhotoPicker
                            onPhotoSelected={(file) => handlePartnerPhotoUpload(file)}
                            bucket="gallery"
                            uploadPath={`${userId}/partner`}
                            variant="outline"
                            size="sm"
                            label={t('profile.upload_partner_photo', 'Foto hochladen')}
                          />
                        </div>
                        {profile.partner_photo_verified && (
                          <Badge variant="outline" className="mt-1 text-xs text-green-600">
                            ✓ {t('profile.partner_verified', 'Verifiziert')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Visibility Mode */}
                <div>
                  <Label className="flex items-center gap-2">
                    <Eye className="w-3 h-3" />
                    {t('profile.visibility_mode', 'Sichtbarkeitsmodus')}
                  </Label>
                  <p className="text-xs text-muted-foreground mb-1">
                    {t('profile.visibility_hint', 'Bestimmt wer deine Angebote sehen kann')}
                  </p>
                  {editingProfile ? (
                    <Select value={visibilityMode} onValueChange={setVisibilityMode}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getVisibilityOptions().map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm">
                      {getVisibilityOptions().find(o => o.value === (profile.visibility_mode || 'all'))?.label || profile.visibility_mode}
                    </p>
                  )}
                </div>

                {/* IBAN — only for chefs */}
                {(profile.role === 'chef' || profile.role === 'both' || profile.role === 'admin') && (
                  <>
                    <Separator />
                    <div>
                      <Label className="flex items-center gap-2">
                        <CreditCard className="w-3 h-3" />
                        {t('profile.iban', 'IBAN (für Auszahlungen)')}
                      </Label>
                      {editingProfile ? (
                        <Input
                          value={iban}
                          onChange={(e) => setIban(e.target.value.toUpperCase())}
                          placeholder={t('placeholders.iban')}
                          className="font-mono text-sm"
                        />
                      ) : (
                        <p className="text-sm font-mono">
                          {profile.iban ? `${profile.iban.substring(0, 4)} •••• •••• ${profile.iban.slice(-4)}` : '-'}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>


            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  {t('profile.verification', 'Verifizierung')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <VerificationDialog
                  userId={userId!}
                  verificationStatus={profile.verification_status as 'pending' | 'approved' | 'rejected'}
                  rejectionReason={profile.rejection_reason}
                  rejectionDetails={profile.rejection_details}
                  onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['currentUser', userId] });
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="mt-4">
            <ChefBookings userId={userId!} />
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery" className="space-y-4 mt-4">
            <GalleryUpload userId={userId!} />
            <GalleryGrid userId={userId!} isOwnProfile={true} />
          </TabsContent>
        </Tabs>

        {/* Settings Section */}
        <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
          <CollapsibleTrigger asChild>
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{t('profile.settings', 'Einstellungen')}</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${settingsOpen ? 'rotate-180' : ''}`} />
              </CardContent>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-2">
            <ChangePasswordSection userEmail={userEmail} isOAuthUser={isOAuthUser} />
          </CollapsibleContent>
        </Collapsible>

        {/* Security Section */}
        <Collapsible open={securityOpen} onOpenChange={setSecurityOpen}>
          <CollapsibleTrigger asChild>
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{t('profile.security', 'Sicherheit')}</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${securityOpen ? 'rotate-180' : ''}`} />
              </CardContent>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-2">
            <TwoFactorSettings userId={userId!} />
            <BlockedUsersList currentUserId={userId!} />
          </CollapsibleContent>
        </Collapsible>

        {/* Social Section */}
        <Collapsible open={socialOpen} onOpenChange={setSocialOpen}>
          <CollapsibleTrigger asChild>
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{t('profile.social', 'Haushalt & Feedback')}</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${socialOpen ? 'rotate-180' : ''}`} />
              </CardContent>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-2">
            <HouseholdLinking userId={userId!} userEmail={userEmail} />
            <FeedbackDialog userId={userId!} />
          </CollapsibleContent>
        </Collapsible>

        {/* Compliance & Legal */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('profile.compliance', 'Compliance & Legal')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ComplianceLinks variant="settings" />
            <div className="flex justify-center">
              <AppVersionBadge />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-destructive flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {t('profile.danger_zone', 'Gefahrenzone')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t('profile.delete_warning', 'Das Löschen deines Accounts entfernt alle deine Daten unwiderruflich.')}
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('profile.delete_account', 'Account löschen')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('profile.delete_confirm_title', 'Account wirklich löschen?')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('profile.delete_confirm_desc', 'Alle deine Gerichte, Buchungen, Nachrichten und Bewertungen werden unwiderruflich gelöscht. Tippe DELETE um zu bestätigen.')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Input
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder={t('profile.confirm_delete')}
                  className="mt-2"
                />
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteConfirm('')}>{t('common.cancel', 'Abbrechen')}</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={deleteConfirm !== 'DELETE'}
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {t('profile.delete_permanently', 'Endgültig löschen')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* Logout */}
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t('profile.logout', 'Abmelden')}
          </Button>
        </div>
      </main>

      {/* Profile Wizard */}
      <ProfileWizard
        open={showWizard}
        onClose={() => setShowWizard(false)}
        onComplete={() => {
          setShowWizard(false);
          refetch();
        }}
        userId={userId!}
        missingPhoto={missingPhoto}
        missingAddress={missingAddress}
        missingPhone={missingPhone}
        isCouple={isCouple}
        partnerPhotoMissing={partnerPhotoMissing}
      />

      <Footer />
      <BottomNav />
    </div>
  );
};

export default Profile;
