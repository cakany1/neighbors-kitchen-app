import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Meal } from '@/types/meal';

interface InteractiveMapProps {
  meals: Meal[];
  userLat?: number;
  userLng?: number;
}

const InteractiveMap = ({ meals, userLat = 47.5596, userLng = 7.5886 }: InteractiveMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map centered on Basel
    const map = L.map(mapRef.current).setView([userLat, userLng], 13);
    mapInstanceRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Add fuzzy circles for each meal
    meals.forEach((meal) => {
      const circle = L.circle([meal.location.fuzzyLat, meal.location.fuzzyLng], {
        radius: 200,
        fillColor: '#FF6B35',
        fillOpacity: 0.3,
        color: '#FF6B35',
        weight: 2,
      }).addTo(map);

      // Create popup content
      const popupContent = `
        <div class="p-2">
          <h3 class="font-semibold text-sm mb-1">${meal.title}</h3>
          <p class="text-xs text-muted-foreground mb-1">von ${meal.chef.firstName}</p>
          <p class="text-xs text-muted-foreground">${meal.location.neighborhood}</p>
          <button 
            onclick="window.location.href='/meal/${meal.id}'" 
            class="mt-2 w-full bg-primary text-primary-foreground text-xs py-1 px-2 rounded hover:bg-primary/90"
          >
            Details ansehen
          </button>
        </div>
      `;

      circle.bindPopup(popupContent);
    });

    // Cleanup
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [meals, userLat, userLng]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full min-h-[400px] rounded-lg overflow-hidden border border-border"
      style={{ zIndex: 0 }}
    />
  );
};

export default InteractiveMap;
