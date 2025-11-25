import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Smartphone, Bell, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const FAQ = () => {
  const { t } = useTranslation();

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error(t('faq.notification_unsupported'));
      return;
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      toast.success(t('faq.notification_granted'));
      new Notification('Neighbors Kitchen', {
        body: t('faq.notification_body'),
        icon: '/icon-192.png',
      });
    } else {
      toast.error(t('faq.notification_denied'));
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Page Title */}
        <div className="text-center">
          <HelpCircle className="w-12 h-12 text-primary mx-auto mb-3" />
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('faq.title')}</h1>
          <p className="text-muted-foreground">
            {t('faq.subtitle')}
          </p>
        </div>

        {/* Section A: App Installation & Notifications */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              {t('faq.install_title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-foreground mb-2">{t('faq.install_guide')}</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <Alert>
                  <AlertDescription>
                    <strong className="text-foreground">{t('faq.ios_label')}</strong>
                    <br />
                    {t('faq.ios_instructions')}
                  </AlertDescription>
                </Alert>
                <Alert>
                  <AlertDescription>
                    <strong className="text-foreground">{t('faq.android_label')}</strong>
                    <br />
                    {t('faq.android_instructions')}
                  </AlertDescription>
                </Alert>
                <Alert className="border-primary/50 bg-primary/5">
                  <Bell className="w-4 h-4 text-primary" />
                  <AlertDescription>
                    <strong className="text-foreground">{t('faq.notification_label')}</strong>
                    <br />
                    {t('faq.notification_description')}
                  </AlertDescription>
                </Alert>
              </div>
            </div>
            <Button 
              onClick={requestNotificationPermission}
              className="w-full"
            >
              <Bell className="w-4 h-4 mr-2" />
              {t('faq.enable_notifications')}
            </Button>
          </CardContent>
        </Card>

        {/* Section B: FAQ Accordion */}
        <Card>
          <CardHeader>
            <CardTitle>{t('faq.questions_title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>{t('faq.q1')}</AccordionTrigger>
                <AccordionContent>{t('faq.a1')}</AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>{t('faq.q2')}</AccordionTrigger>
                <AccordionContent>{t('faq.a2')}</AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>{t('faq.q3')}</AccordionTrigger>
                <AccordionContent>{t('faq.a3')}</AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger>{t('faq.q4')}</AccordionTrigger>
                <AccordionContent>{t('faq.a4')}</AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger>{t('faq.q5')}</AccordionTrigger>
                <AccordionContent>{t('faq.a5')}</AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger>{t('faq.q6')}</AccordionTrigger>
                <AccordionContent>{t('faq.a6')}</AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7">
                <AccordionTrigger>{t('faq.q7')}</AccordionTrigger>
                <AccordionContent>{t('faq.a7')}</AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-8">
                <AccordionTrigger>{t('faq.q8')}</AccordionTrigger>
                <AccordionContent>{t('faq.a8')}</AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-9">
                <AccordionTrigger>{t('faq.q9')}</AccordionTrigger>
                <AccordionContent>{t('faq.a9')}</AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-10">
                <AccordionTrigger>{t('faq.q10')}</AccordionTrigger>
                <AccordionContent>{t('faq.a10')}</AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Additional Help Card */}
        <Card className="border-muted">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              {t('faq.more_questions')}
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => window.location.href = '/impressum'}>
                {t('footer.imprint')}
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/agb'}>
                {t('footer.terms_privacy')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
};

export default FAQ;
