import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const AGB = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8 pb-24">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('legal.back_home')}
        </Button>
        <h1 className="text-3xl font-bold text-foreground mb-6">
          {t('legal.agb_title')}
        </h1>
        
        {/* English Disclaimer (only shown when language is EN) */}
        {i18n.language === 'en' && (
          <div className="mb-6 p-4 bg-muted/50 border border-border rounded-lg">
            <p className="text-sm text-muted-foreground italic">
              Note: For legal reasons, these terms are currently available in German only. In case of doubt, the German version applies.
            </p>
          </div>
        )}
        
        <div className="space-y-6 text-foreground">
          <section>
            <h2 className="text-xl font-semibold mb-3">{t('legal.scope_title')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('legal.scope_text')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">{t('legal.payment_title')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('legal.payment_text')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">{t('legal.liability_title')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('legal.liability_text')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">{t('legal.cancellation_title')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('legal.cancellation_text')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">{t('legal.privacy_title')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('legal.privacy_text')}
            </p>
          </section>
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default AGB;
