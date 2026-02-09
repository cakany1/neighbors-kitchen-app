import { ExternalLink, Mail, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ComplianceLinksProps {
  className?: string;
  variant?: 'footer' | 'settings';
}

export function ComplianceLinks({ className, variant = 'footer' }: ComplianceLinksProps) {
  const { t } = useTranslation();

  const links = [
    {
      label: t('footer.privacy_policy', 'Privacy Policy'),
      href: '/privacy',
      icon: FileText,
      external: false,
    },
    {
      label: t('footer.contact_support', 'Contact Support'),
      href: 'mailto:support@share-kitchen-basel.ch',
      icon: Mail,
      external: true,
    },
  ];

  if (variant === 'footer') {
    return (
      <div className={cn('flex flex-wrap gap-4 justify-center', className)}>
        {links.map(({ label, href, icon: Icon }) => (
          <a
            key={href}
            href={href}
            target={href.startsWith('mailto:') ? undefined : '_blank'}
            rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Icon className="w-4 h-4" />
            {label}
          </a>
        ))}
      </div>
    );
  }

  // Settings variant - vertical button layout
  return (
    <div className={cn('space-y-2', className)}>
      {links.map(({ label, href, icon: Icon }) => (
        <Button
          key={href}
          variant="ghost"
          className="w-full justify-start text-left"
          asChild
        >
          <a
            href={href}
            target={href.startsWith('mailto:') ? undefined : '_blank'}
            rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
            className="flex items-center gap-2"
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{label}</span>
            {!href.startsWith('mailto:') && (
              <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-50" />
            )}
          </a>
        </Button>
      ))}
    </div>
  );
}

export default ComplianceLinks;
