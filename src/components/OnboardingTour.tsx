import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X } from 'lucide-react';

interface TourStep {
  target: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
  {
    target: '[data-tour="add-meal"]',
    title: 'Essen teilen',
    description: 'Hier kannst du Essen teilen und deine Nachbarn einladen.',
    position: 'top',
  },
  {
    target: '[data-tour="feed"]',
    title: 'Mahlzeiten entdecken',
    description: 'Durchsuche verfügbare Mahlzeiten in deiner Nachbarschaft.',
    position: 'bottom',
  },
  {
    target: '[data-tour="map"]',
    title: 'Karte ansehen',
    description: 'Finde Nachbarn in deinem Radius auf der Karte.',
    position: 'top',
  },
  {
    target: '[data-tour="karma"]',
    title: 'Karma Punkte',
    description: 'Hier siehst du deine Punkte. Verdiene Karma durch Teilen!',
    position: 'bottom',
  },
];

interface OnboardingTourProps {
  onComplete: () => void;
}

export const OnboardingTour = ({ onComplete }: OnboardingTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const updatePosition = () => {
      const step = tourSteps[currentStep];
      const element = document.querySelector(step.target);
      
      if (element) {
        const rect = element.getBoundingClientRect();
        let top = 0;
        let left = 0;

        switch (step.position) {
          case 'top':
            top = rect.top - 150;
            left = rect.left + rect.width / 2 - 150;
            break;
          case 'bottom':
            top = rect.bottom + 10;
            left = rect.left + rect.width / 2 - 150;
            break;
          case 'left':
            top = rect.top + rect.height / 2 - 75;
            left = rect.left - 320;
            break;
          case 'right':
            top = rect.top + rect.height / 2 - 75;
            left = rect.right + 10;
            break;
        }

        setPosition({ top, left });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem('tour_completed', 'true');
      onComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('tour_completed', 'true');
    onComplete();
  };

  const step = tourSteps[currentStep];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 z-40" onClick={handleSkip} />
      
      {/* Spotlight on target element */}
      <style>
        {`
          ${step.target} {
            position: relative;
            z-index: 50;
            box-shadow: 0 0 0 4px hsl(var(--primary)), 0 0 0 9999px rgba(0, 0, 0, 0.6);
          }
        `}
      </style>

      {/* Tour Card */}
      <Card 
        className="fixed z-50 w-80 shadow-xl"
        style={{ top: `${position.top}px`, left: `${position.left}px` }}
      >
        <CardContent className="pt-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Schritt {currentStep + 1} von {tourSteps.length}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSkip}>
                Überspringen
              </Button>
              <Button size="sm" onClick={handleNext}>
                {currentStep < tourSteps.length - 1 ? 'Weiter' : 'Fertig'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
