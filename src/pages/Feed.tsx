import { useState } from 'react';
import { MealCard } from '@/components/MealCard';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { mockMeals } from '@/data/mockMeals';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const Feed = () => {
  const navigate = useNavigate();
  const [showDisclaimer, setShowDisclaimer] = useState(() => {
    return !localStorage.getItem('disclaimerSeen');
  });

  const handleDismissDisclaimer = () => {
    localStorage.setItem('disclaimerSeen', 'true');
    setShowDisclaimer(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="max-w-lg mx-auto px-4 py-6">
        {showDisclaimer && (
          <Alert className="mb-6 border-primary bg-primary-light" onClick={handleDismissDisclaimer}>
            <AlertCircle className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm text-foreground">
              <strong>Welcome to Neighbors Kitchen!</strong> This is a private food-sharing community. 
              Please bring your own container, respect chef's homes, and pay fairly. Tap to dismiss.
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">Available Meals</h2>
          <p className="text-muted-foreground">Fresh home-cooked meals from your neighbors</p>
        </div>

        <div className="grid gap-4">
          {mockMeals.map((meal) => (
            <MealCard 
              key={meal.id} 
              meal={meal}
              onClick={() => navigate(`/meal/${meal.id}`)}
            />
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Feed;
