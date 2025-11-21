import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { mockMeals } from '@/data/mockMeals';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import InteractiveMap from '@/components/maps/InteractiveMap';

const MapView = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="max-w-lg mx-auto px-4 py-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/app')} 
          className="mb-4"
        >
          ← Zurück zum Feed
        </Button>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Mahlzeiten in der Nähe
          </h2>
          <Alert className="border-primary/20 bg-primary/10">
            <MapPin className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              <strong>Privatsphäre zuerst:</strong> Standorte werden als ungefähre Bereiche angezeigt. 
              Genaue Adressen werden erst nach Buchungsbestätigung angezeigt.
            </AlertDescription>
          </Alert>
        </div>

        <div className="mb-6 h-[400px]">
          <InteractiveMap meals={mockMeals} />
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default MapView;
