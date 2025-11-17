import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { mockMeals } from '@/data/mockMeals';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const MapView = () => {
  // In a real app, this would use an actual map library like Leaflet or Mapbox
  // For now, we'll show a simplified view demonstrating the privacy concept

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-foreground mb-2">Nearby Meals</h2>
          <Alert className="border-privacy-zone bg-primary-light">
            <MapPin className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              <strong>Privacy First:</strong> Locations shown as approximate areas. 
              Exact addresses revealed only after booking confirmation.
            </AlertDescription>
          </Alert>
        </div>

        {/* Simplified Map Representation */}
        <div className="bg-muted rounded-lg p-6 mb-6 relative min-h-[300px] border border-border">
          <div className="absolute top-4 right-4 bg-card p-2 rounded-lg shadow-sm border border-border">
            <Navigation className="w-5 h-5 text-primary" />
          </div>
          
          <div className="text-center text-muted-foreground text-sm mb-4">
            Map View (Privacy Protected)
          </div>

          {/* Privacy Circles - Visual representation */}
          <div className="space-y-3">
            {mockMeals.slice(0, 3).map((meal, index) => (
              <div 
                key={meal.id}
                className="relative"
                style={{ marginLeft: `${index * 20}px` }}
              >
                <div className="w-24 h-24 rounded-full border-4 border-privacy-zone bg-privacy-zone/10 flex items-center justify-center mx-auto">
                  <div className="text-center">
                    <MapPin className="w-6 h-6 mx-auto text-privacy-zone mb-1" />
                    <span className="text-xs font-medium text-foreground">~{meal.distance}</span>
                  </div>
                </div>
                <p className="text-xs text-center mt-1 font-medium text-foreground">
                  {meal.location.neighborhood}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 text-center text-xs text-muted-foreground italic">
            🔒 Fuzzy location circles protect chef privacy
          </div>
        </div>

        {/* List View */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg text-foreground">Available Meals</h3>
          {mockMeals.map((meal) => (
            <Card key={meal.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    🍽️
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground mb-1">{meal.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      by {meal.chef.firstName} {meal.chef.lastName.charAt(0)}.
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        <MapPin className="w-3 h-3 mr-1" />
                        {meal.distance}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {meal.location.neighborhood}
                      </Badge>
                      {meal.isCookingExperience && (
                        <Badge variant="secondary" className="text-xs">
                          Cooking Experience
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-primary">
                      {meal.pricing.minimum === 0 ? 'Free' : `CHF ${meal.pricing.minimum}+`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            📍 In a real implementation, this would show an interactive map with privacy-protected locations
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default MapView;
