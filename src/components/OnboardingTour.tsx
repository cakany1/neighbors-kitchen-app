import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, ChefHat, MapPin, Heart, Shield, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';

interface TourStep {
  target: string;
  titleKey: string;
  descriptionKey: string;
  icon: React.ReactNode;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const tourSteps: TourStep[] = [
  {
    target: 'body',
    titleKey: 'onboarding.welcome_title',
    descriptionKey: 'onboarding.welcome_desc',
    icon: <Heart className="w-8 h-8 text-primary" />,
    position: 'center',
  },
  {
    target: '[data-tour="feed"]',
    titleKey: 'onboarding.feed_title',
    descriptionKey: 'onboarding.feed_desc',
    icon: <ChefHat className="w-6 h-6 text-primary" />,
    position: 'top',
  },
  {
    target: '[data-tour="map"]',
    titleKey: 'onboarding.map_title',
    descriptionKey: 'onboarding.map_desc',
    icon: <MapPin className="w-6 h-6 text-primary" />,
    position: 'top',
  },
  {
    target: '[data-tour="add-meal"]',
    titleKey: 'onboarding.add_meal_title',
    descriptionKey: 'onboarding.add_meal_desc',
    icon: <ChefHat className="w-6 h-6 text-primary" />,
    position: 'top',
  },
  {
    target: '[data-tour="profile"]',
    titleKey: 'onboarding.profile_title',
    descriptionKey: 'onboarding.profile_desc',
    icon: <Shield className="w-6 h-6 text-primary" />,
    position: 'top',
  },
  {
    target: '[data-tour="karma"]',
    titleKey: 'onboarding.karma_title',
    descriptionKey: 'onboarding.karma_desc',
    icon: <Star className="w-6 h-6 text-trust-gold" />,
    position: 'bottom',
  },
];

interface OnboardingTourProps {
  onComplete: () => void;
}

export const OnboardingTour = ({ onComplete }: OnboardingTourProps) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isCentered, setIsCentered] = useState(false);

  useEffect(() => {
    const updatePosition = () => {
      const step = tourSteps[currentStep];
      
      if (step.position === 'center' || step.target === 'body') {
        setIsCentered(true);
        return;
      }
      
      setIsCentered(false);
      const element = document.querySelector(step.target);
      
      if (element) {
        const rect = element.getBoundingClientRect();
        let top = 0;
        let left = 0;

        switch (step.position) {
          case 'top':
            top = rect.top - 180;
            left = Math.max(16, Math.min(window.innerWidth - 336, rect.left + rect.width / 2 - 160));
            break;
          case 'bottom':
            top = rect.bottom + 16;
            left = Math.max(16, Math.min(window.innerWidth - 336, rect.left + rect.width / 2 - 160));
            break;
          case 'left':
            top = rect.top + rect.height / 2 - 90;
            left = rect.left - 340;
            break;
          case 'right':
            top = rect.top + rect.height / 2 - 90;
            left = rect.right + 16;
            break;
        }

        // Ensure card stays within viewport
        top = Math.max(16, Math.min(window.innerHeight - 250, top));
        left = Math.max(16, Math.min(window.innerWidth - 336, left));

        setPosition({ top, left });
      } else {
        // Fallback to center if element not found
        setIsCentered(true);
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      localStorage.setItem('tour_completed', 'true');
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('tour_completed', 'true');
    onComplete();
  };

  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm" onClick={handleSkip} />
      
      {/* Spotlight on target element (only if not centered) */}
      {!isCentered && step.target !== 'body' && (
        <style>
          {`
            ${step.target} {
              position: relative;
              z-index: 50;
              box-shadow: 0 0 0 4px hsl(var(--primary)), 0 0 20px hsl(var(--primary) / 0.5);
              border-radius: 8px;
            }
          `}
        </style>
      )}

      {/* Tour Card */}
      <Card 
        className={`fixed z-50 w-80 shadow-2xl border-primary/20 ${
          isCentered 
            ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' 
            : ''
        }`}
        style={!isCentered ? { top: `${position.top}px`, left: `${position.left}px` } : undefined}
      >
        <CardContent className="pt-6">
          {/* Progress bar */}
          <Progress value={progress} className="h-1 mb-4" />
          
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                {step.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">{t(step.titleKey)}</h3>
                <p className="text-sm text-muted-foreground mt-1">{t(step.descriptionKey)}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="h-6 w-6 p-0 shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {t('onboarding.step_counter', { current: currentStep + 1, total: tourSteps.length })}
            </div>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" size="sm" onClick={handlePrev}>
                  {t('onboarding.back')}
                </Button>
              )}
              {currentStep === 0 && (
                <Button variant="outline" size="sm" onClick={handleSkip}>
                  {t('onboarding.skip')}
                </Button>
              )}
              <Button size="sm" onClick={handleNext}>
                {currentStep < tourSteps.length - 1 ? t('onboarding.next') : t('onboarding.done')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
