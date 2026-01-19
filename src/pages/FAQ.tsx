import { useState } from 'react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Smartphone, Bell, HelpCircle, Send, MessageCircleQuestion } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const FAQ = () => {
  const { t } = useTranslation();
  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch published community FAQ questions
  const { data: communityFaqs } = useQuery({
    queryKey: ['publishedFaqs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faq_requests')
        .select('id, question, admin_answer, similar_count')
        .eq('status', 'published')
        .order('similar_count', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

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

  const handleSubmitQuestion = async () => {
    if (!question.trim()) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('faq_requests')
        .insert({
          question: question.trim(),
          user_id: user?.id || null,
        });

      if (error) throw error;

      // Send admin notification (non-blocking)
      try {
        await supabase.functions.invoke('send-admin-notification', {
          body: {
            type: 'faq',
            content: question.trim(),
          },
        });
      } catch (notifError) {
        console.error('Admin notification failed (non-blocking):', notifError);
      }

      toast.success(t('faq.ask_question_success'));
      setQuestion('');
    } catch (error) {
      console.error('Error submitting question:', error);
      toast.error(t('faq.ask_question_error'));
    } finally {
      setIsSubmitting(false);
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
              <AccordionItem value="item-0">
                <AccordionTrigger className="text-left">{t('faq.q0')}</AccordionTrigger>
                <AccordionContent className="text-left">{t('faq.a0')}</AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-1">
                <AccordionTrigger className="text-left">{t('faq.q1')}</AccordionTrigger>
                <AccordionContent className="text-left">{t('faq.a1')}</AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger className="text-left">{t('faq.q2')}</AccordionTrigger>
                <AccordionContent className="text-left">{t('faq.a2')}</AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger className="text-left">{t('faq.q3')}</AccordionTrigger>
                <AccordionContent className="text-left">{t('faq.a3')}</AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger className="text-left">{t('faq.q4')}</AccordionTrigger>
                <AccordionContent className="text-left">{t('faq.a4')}</AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger className="text-left">{t('faq.q5')}</AccordionTrigger>
                <AccordionContent className="text-left">{t('faq.a5')}</AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger className="text-left">{t('faq.q6')}</AccordionTrigger>
                <AccordionContent className="text-left">{t('faq.a6')}</AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7">
                <AccordionTrigger className="text-left">{t('faq.q7')}</AccordionTrigger>
                <AccordionContent className="text-left">{t('faq.a7')}</AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-8">
                <AccordionTrigger className="text-left">{t('faq.q8')}</AccordionTrigger>
                <AccordionContent className="text-left">{t('faq.a8')}</AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-9">
                <AccordionTrigger className="text-left">{t('faq.q9')}</AccordionTrigger>
                <AccordionContent className="text-left">{t('faq.a9')}</AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-10">
                <AccordionTrigger className="text-left">{t('faq.q10')}</AccordionTrigger>
                <AccordionContent className="text-left">{t('faq.a10')}</AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-11">
                <AccordionTrigger className="text-left">{t('faq.q11')}</AccordionTrigger>
                <AccordionContent className="text-left">{t('faq.a11')}</AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Community FAQ Section - Published Questions */}
        {communityFaqs && communityFaqs.length > 0 && (
          <Card className="border-secondary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircleQuestion className="w-5 h-5 text-secondary" />
                {t('faq.community_questions_title')}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {t('faq.community_questions_desc')}
              </p>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {communityFaqs.map((faq, index) => (
                  <AccordionItem key={faq.id} value={`community-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent>{faq.admin_answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        )}

        {/* Ask Your Question Card */}
        <Card className="border-muted bg-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Send className="w-5 h-5 text-primary" />
              {t('faq.ask_question_title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder={t('faq.ask_question_placeholder')}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitQuestion()}
            />
            <Button 
              onClick={handleSubmitQuestion}
              disabled={isSubmitting || !question.trim()}
              className="w-full"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? t('faq.ask_question_submitting') : t('faq.ask_question_submit')}
            </Button>
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