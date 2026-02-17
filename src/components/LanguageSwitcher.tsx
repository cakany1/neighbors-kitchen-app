import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const languages = [
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
];

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const toggleToOtherLanguage = () => {
    const otherLang = i18n.language === 'de' ? 'en' : 'de';
    changeLanguage(otherLang);
  };

  const currentLang = languages.find(lang => lang.code === i18n.language) || languages[0];
  const otherLang = languages.find(lang => lang.code !== i18n.language) || languages[1];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline">{currentLang.name}</span>
          <span className="sm:hidden">{currentLang.code.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className="cursor-pointer flex items-center gap-2"
          >
            <span>{lang.flag}</span>
            <span>{lang.name}</span>
            {lang.code === i18n.language && <span className="ml-auto text-primary">✓</span>}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem
          onClick={toggleToOtherLanguage}
          className="cursor-pointer border-t mt-1 pt-2 text-muted-foreground"
        >
          <span className="text-xs">
            {t('language_switcher.show_original_' + (i18n.language === 'de' ? 'en' : 'de'), i18n.language === 'de' ? '🔄 Show Original (EN)' : '🔄 Original anzeigen (DE)')}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
