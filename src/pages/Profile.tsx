import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Star, Award, ChefHat, Heart, Globe, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { allergenOptions, dislikeCategories } from '@/utils/ingredientDatabase';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch (German)' },
  { code: 'fr', name: 'Français (French)' },
  { code: 'it', name: 'Italiano (Italian)' },
  { code: 'es', name: 'Español (Spanish)' },
  { code: 'pt', name: 'Português (Portuguese)' },
  { code: 'ar', name: 'العربية (Arabic)' },
  { code: 'tr', name: 'Türkçe (Turkish)' },
  { code: 'vi', name: 'Tiếng Việt (Vietnamese)' },
  { code: 'th', name: 'ไทย (Thai)' },
  { code: 'zh', name: '中文 (Chinese)' },
];

const Profile = () => {
  const { t, i18n } = useTranslation();
  
  // Mock user data
  const [user, setUser] = useState({
    firstName: 'Alex',
    lastName: 'Chen',
    nickname: 'FoodieChef',
    languages: ['en', 'de'], // Multiple languages now supported
    karma: 178,
    mealsShared: 23,
    mealsReceived: 31,
    fairPayments: 28,
    allergens: [] as string[],
    dislikes: [] as string[],
  });

  const toggleLanguage = (languageCode: string) => {
    setUser(prev => ({
      ...prev,
      languages: prev.languages.includes(languageCode)
        ? prev.languages.filter(l => l !== languageCode)
        : [...prev.languages, languageCode]
    }));
    
    // Set UI language to first selected language
    const primaryLanguage = user.languages.includes(languageCode) 
      ? user.languages.find(l => l !== languageCode) || 'en'
      : languageCode;
    
    localStorage.setItem('language', primaryLanguage);
    i18n.changeLanguage(primaryLanguage);
    toast.success(t('profile.languageUpdated'));
  };

  const toggleAllergen = (allergen: string) => {
    setUser(prev => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter(a => a !== allergen)
        : [...prev.allergens, allergen]
    }));
    toast.success('Dietary preferences updated');
  };

  const toggleDislike = (dislike: string) => {
    setUser(prev => ({
      ...prev,
      dislikes: prev.dislikes.includes(dislike)
        ? prev.dislikes.filter(d => d !== dislike)
        : [...prev.dislikes, dislike]
    }));
    toast.success('Food preferences updated');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-3xl">
                👤
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-sm text-muted-foreground">@{user.nickname}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Star className="w-5 h-5 text-trust-gold fill-current" />
                  <span className="text-lg font-semibold text-trust-gold">{user.karma} {t('profile.karma')}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{user.mealsShared}</p>
                <p className="text-xs text-muted-foreground">{t('profile.mealsShared')}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-secondary">{user.mealsReceived}</p>
                <p className="text-xs text-muted-foreground">{t('profile.mealsReceived')}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-trust-badge">{user.fairPayments}</p>
                <p className="text-xs text-muted-foreground">{t('profile.fairPayments')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Safety Shield - Dietary Preferences */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-destructive" />
              Safety Shield (Private)
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              This information is private and only used to warn you about allergens in meals
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-base font-semibold mb-3 block">Allergens</Label>
              <div className="space-y-3">
                {allergenOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`allergen-${option.value}`}
                      checked={user.allergens.includes(option.value)}
                      onCheckedChange={() => toggleAllergen(option.value)}
                    />
                    <Label
                      htmlFor={`allergen-${option.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-4 border-t border-border">
              <Label className="text-base font-semibold mb-3 block">Dislikes (Accordion)</Label>
              <Accordion type="multiple" className="w-full">
                {Object.entries(dislikeCategories).map(([category, items]) => (
                  <AccordionItem key={category} value={category}>
                    <AccordionTrigger className="text-sm capitalize">
                      {category} ({items.filter(item => user.dislikes.includes(item.value)).length}/{items.length})
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pt-2">
                        {items.map((dislike) => (
                          <div key={dislike.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`dislike-${dislike.value}`}
                              checked={user.dislikes.includes(dislike.value)}
                              onCheckedChange={() => toggleDislike(dislike.value)}
                            />
                            <Label
                              htmlFor={`dislike-${dislike.value}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {dislike.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </CardContent>
        </Card>

        {/* Language Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              {t('profile.languagePreference')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Label className="text-base font-semibold">{t('profile.languagePreference')}</Label>
              <div className="grid grid-cols-2 gap-3">
                {languages.map((lang) => (
                  <div key={lang.code} className="flex items-center space-x-2">
                    <Checkbox
                      id={`language-${lang.code}`}
                      checked={user.languages.includes(lang.code)}
                      onCheckedChange={() => toggleLanguage(lang.code)}
                    />
                    <Label
                      htmlFor={`language-${lang.code}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {lang.name}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                💬 {t('profile.languagePreference')} - Messages with chefs who speak different languages will be automatically translated for you
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-trust-gold" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary-light p-4 rounded-lg text-center">
                <ChefHat className="w-8 h-8 mx-auto mb-2 text-secondary" />
                <p className="font-semibold text-sm text-foreground">Chef Master</p>
                <p className="text-xs text-muted-foreground">20+ meals shared</p>
              </div>
              <div className="bg-primary-light p-4 rounded-lg text-center">
                <Heart className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="font-semibold text-sm text-foreground">Fair Payer</p>
                <p className="text-xs text-muted-foreground">Always pays fairly</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trust System Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>About Karma Points</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                <ChefHat className="w-4 h-4 text-secondary" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">Share Meals</p>
                <p className="text-xs text-muted-foreground">Earn karma by sharing your cooking</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Heart className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">Pay Fairly</p>
                <p className="text-xs text-muted-foreground">Build trust by fair payments</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-trust-badge/10 flex items-center justify-center flex-shrink-0">
                <Star className="w-4 h-4 text-trust-gold" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">Be Respectful</p>
                <p className="text-xs text-muted-foreground">Respect hosts and bring your own container</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Community Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle>{t('profile.communityGuidelines')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{t('guidelines.bringContainer')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{t('guidelines.bePunctual')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{t('guidelines.payFairly')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{t('guidelines.respectPrivacy')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{t('guidelines.communicate')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{t('guidelines.leaveFeedback')}</span>
              </li>
            </ul>
            
            {/* Disclaimer */}
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-foreground leading-relaxed">
                {t('guidelines.disclaimer')}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 space-y-3">
          <Button variant="outline" className="w-full">
            Edit Profile
          </Button>
          <Button variant="ghost" className="w-full text-muted-foreground">
            Settings
          </Button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;
